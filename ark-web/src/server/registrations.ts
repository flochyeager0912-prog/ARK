import "server-only";
import { Prisma, type Event, type Registration } from "@prisma/client";
import QRCode from "qrcode";
import { db } from "./db";
import { newRefCode, newToken, sha256 } from "./tokens";
import { sendMail, officeEmail } from "./mailer";
import { renderEmail } from "./email/layout";
import { buildIcs } from "@/lib/ics";
import { formatEventWhen } from "@/lib/time";
import { siteUrl } from "@/lib/env";
import { getSite } from "@/server/content";

export type RegisterInput = {
  name: string;
  email: string;
  phone: string;
  seats: number;
  notes?: string;
};

export type RegisterResult =
  | { ok: true; status: "CONFIRMED" | "WAITLISTED"; refCode: string; manageToken: string }
  | { ok: false; code: "NOT_FOUND" | "CLOSED" | "FULL" | "DUPLICATE" | "TOO_MANY_SEATS"; message: string };

/** Pure decision logic (unit-tested): can `seats` be confirmed given capacity & current confirmed seats? */
export function decideStatus(opts: {
  capacity: number | null;
  confirmedSeats: number;
  seats: number;
  waitlistEnabled: boolean;
}): "CONFIRMED" | "WAITLISTED" | "FULL" {
  if (opts.capacity == null) return "CONFIRMED";
  if (opts.confirmedSeats + opts.seats <= opts.capacity) return "CONFIRMED";
  return opts.waitlistEnabled ? "WAITLISTED" : "FULL";
}

import { registrationOpen } from "@/lib/events";
export { registrationOpen };

export async function confirmedSeats(eventId: string, tx: Prisma.TransactionClient = db) {
  const agg = await tx.registration.aggregate({
    where: { eventId, status: "CONFIRMED" },
    _sum: { seats: true },
  });
  return agg._sum.seats ?? 0;
}

/**
 * Registers for an event. Capacity is enforced inside a transaction that holds a
 * row lock on the event (SELECT ... FOR UPDATE), so concurrent registrations
 * for the same event are serialised and the event can never be overbooked.
 */
export async function register(eventId: string, input: RegisterInput): Promise<RegisterResult> {
  const manageToken = newToken();
  const result = await db.$transaction(
    async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "event" WHERE id = ${eventId}::uuid FOR UPDATE`;
      if (locked.length === 0) return { ok: false as const, code: "NOT_FOUND" as const, message: "Event not found." };
      const event = await tx.event.findUniqueOrThrow({ where: { id: eventId } });

      if (!registrationOpen(event)) {
        return { ok: false as const, code: "CLOSED" as const, message: "Registration for this event is closed." };
      }
      if (input.seats > event.maxSeatsPerBooking) {
        return {
          ok: false as const,
          code: "TOO_MANY_SEATS" as const,
          message: `You can book up to ${event.maxSeatsPerBooking} seat(s) per registration.`,
        };
      }
      const existing = await tx.registration.findFirst({
        where: { eventId, email: input.email, status: { in: ["CONFIRMED", "WAITLISTED"] } },
        select: { id: true },
      });
      if (existing) {
        return {
          ok: false as const,
          code: "DUPLICATE" as const,
          message:
            "This email is already registered for this event. Check your inbox for the confirmation email, or use the link in it to manage your booking.",
        };
      }

      const decision = decideStatus({
        capacity: event.capacity,
        confirmedSeats: await confirmedSeats(eventId, tx),
        seats: input.seats,
        waitlistEnabled: event.waitlistEnabled,
      });
      if (decision === "FULL") {
        return { ok: false as const, code: "FULL" as const, message: "Sorry, this event is fully booked." };
      }

      // Pick an unused reference code (31^6 ≈ 887M space; a failed INSERT would abort the tx, so check first).
      let refCode = newRefCode();
      for (let attempt = 0; await tx.registration.findUnique({ where: { refCode }, select: { id: true } }); attempt++) {
        if (attempt > 5) throw new Error("Could not allocate a unique reference code");
        refCode = newRefCode();
      }
      const reg = await tx.registration.create({
        data: {
          eventId,
          refCode,
          name: input.name,
          email: input.email,
          phone: input.phone,
          seats: input.seats,
          notes: input.notes || null,
          status: decision,
          manageTokenHash: sha256(manageToken),
          consentAt: new Date(),
        },
      });
      return { ok: true as const, status: decision, refCode: reg.refCode, manageToken, event, reg };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15_000 },
  );

  if (!result.ok) return result;
  await sendRegistrationEmail(result.event, result.reg, result.manageToken, result.status === "CONFIRMED" ? "confirmed" : "waitlisted");
  const office = officeEmail();
  if (office) {
    const site = await getSite();
    const mail = renderEmail(site, {
      preheader: `New registration for ${result.event.title}`,
      heading: "New event registration",
      blocks: [
        {
          type: "kv",
          rows: [
            ["Event", result.event.title],
            ["Reference", result.reg.refCode],
            ["Status", result.status],
            ["Name", result.reg.name],
            ["Seats", String(result.reg.seats)],
          ],
        },
        { type: "button", label: "Open in admin", href: siteUrl(`/admin/events/${result.event.id}`) },
      ],
    });
    await sendMail({ to: office, subject: `Registration ${result.reg.refCode} · ${result.event.title}`, ...mail });
  }
  return { ok: true, status: result.status, refCode: result.refCode, manageToken: result.manageToken };
}

export async function findByManageToken(token: string) {
  if (!token || token.length > 100) return null;
  return db.registration.findUnique({
    where: { manageTokenHash: sha256(token) },
    include: { event: true },
  });
}

/**
 * Cancels a registration and promotes waitlisted registrations (FIFO) into freed seats.
 * Returns the promoted registrations (already emailed).
 */
export async function cancelRegistration(registrationId: string): Promise<{ cancelled: boolean; promoted: number }> {
  const out = await db.$transaction(async (tx) => {
    const reg = await tx.registration.findUnique({ where: { id: registrationId } });
    if (!reg || reg.status === "CANCELLED") return { cancelled: false, promoted: [] as Registration[], event: null };
    await tx.$queryRaw`SELECT id FROM "event" WHERE id = ${reg.eventId}::uuid FOR UPDATE`;
    await tx.registration.update({
      where: { id: reg.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    const promoted = await promoteWaitlist(reg.eventId, tx);
    const event = await tx.event.findUnique({ where: { id: reg.eventId } });
    return { cancelled: true, promoted, event };
  });

  if (out.event) {
    for (const p of out.promoted) await sendPromotionEmail(out.event, p);
  }
  return { cancelled: out.cancelled, promoted: out.promoted.length };
}

/** Must be called inside a transaction that holds the event row lock. */
export async function promoteWaitlist(eventId: string, tx: Prisma.TransactionClient): Promise<Registration[]> {
  const event = await tx.event.findUnique({ where: { id: eventId } });
  if (!event || event.status !== "PUBLISHED" || event.startsAt <= new Date()) return [];
  const waitlist = await tx.registration.findMany({
    where: { eventId, status: "WAITLISTED" },
    orderBy: { createdAt: "asc" },
  });
  let used = await confirmedSeats(eventId, tx);
  const promoted: Registration[] = [];
  for (const w of waitlist) {
    if (event.capacity != null && used + w.seats > event.capacity) continue; // smaller parties behind may still fit
    const updated = await tx.registration.update({ where: { id: w.id }, data: { status: "CONFIRMED" } });
    used += w.seats;
    promoted.push(updated);
  }
  return promoted;
}

/** Re-run promotion after an admin increases capacity. */
export async function promoteAfterCapacityChange(eventId: string) {
  const out = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "event" WHERE id = ${eventId}::uuid FOR UPDATE`;
    const promoted = await promoteWaitlist(eventId, tx);
    const event = await tx.event.findUnique({ where: { id: eventId } });
    return { promoted, event };
  });
  if (out.event) for (const p of out.promoted) await sendPromotionEmail(out.event, p);
  return out.promoted.length;
}

export async function setCheckIn(registrationId: string, checkedIn: boolean) {
  return db.registration.update({
    where: { id: registrationId },
    data: { checkedInAt: checkedIn ? new Date() : null },
  });
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

export function eventIcs(event: Event, status: "CONFIRMED" | "CANCELLED" = "CONFIRMED") {
  return buildIcs({
    uid: `${event.id}@thearkvictorychurch.com`,
    title: event.title,
    description: `${event.summary}\n\n${siteUrl(`/events/${event.slug}`)}`,
    location: event.venue,
    url: siteUrl(`/events/${event.slug}`),
    start: event.startsAt,
    end: event.endsAt,
    status,
  });
}

export const qrPng = (refCode: string) => QRCode.toBuffer(refCode, { width: 360, margin: 1, errorCorrectionLevel: "M" });

async function sendRegistrationEmail(
  event: Event,
  reg: Registration,
  manageToken: string,
  kind: "confirmed" | "waitlisted",
) {
  const manageUrl = siteUrl(`/booking/${manageToken}`);
  const confirmed = kind === "confirmed";
  const site = await getSite();
  const mail = renderEmail(site, {
    preheader: confirmed ? `You're registered for ${event.title}` : `You're on the waitlist for ${event.title}`,
    heading: confirmed ? "You're registered! 🎉" : "You're on the waitlist",
    greeting: `Hi ${reg.name},`,
    blocks: [
      {
        type: "p",
        text: confirmed
          ? `Thank you for registering for ${event.title}. Please show the QR code or your reference number at the venue.`
          : `${event.title} is currently full, so we've added you to the waitlist. If a seat opens up we'll confirm your place automatically and email you.`,
      },
      {
        type: "kv",
        rows: [
          ["Reference", reg.refCode],
          ["Event", event.title],
          ["When", formatEventWhen(event.startsAt, event.endsAt)],
          ["Where", event.venue],
          ["Seats", String(reg.seats)],
        ],
      },
      ...(confirmed ? [{ type: "img" as const, cid: "ticket-qr", alt: `QR code for ${reg.refCode}` }] : []),
      { type: "button", label: "View or cancel my booking", href: manageUrl },
      {
        type: "note",
        text: `Can't make it? Please cancel using the link above so someone else can have your seat. Questions? Call ${site.contact.phoneDisplay}.`,
      },
    ],
  });
  await sendMail({
    to: reg.email,
    subject: confirmed ? `Confirmed: ${event.title} (${reg.refCode})` : `Waitlisted: ${event.title} (${reg.refCode})`,
    ...mail,
    attachments: [
      ...(confirmed ? [{ filename: `${reg.refCode}.png`, content: await qrPng(reg.refCode), cid: "ticket-qr" }] : []),
      { filename: "event.ics", content: eventIcs(event), contentType: "text/calendar; charset=utf-8" },
    ],
  });
}

async function sendPromotionEmail(event: Event, reg: Registration) {
  const site = await getSite();
  const mail = renderEmail(site, {
    preheader: `A seat opened up for ${event.title}`,
    heading: "Good news — your seat is confirmed!",
    greeting: `Hi ${reg.name},`,
    blocks: [
      { type: "p", text: `A place opened up and your waitlisted registration for ${event.title} is now confirmed.` },
      {
        type: "kv",
        rows: [
          ["Reference", reg.refCode],
          ["When", formatEventWhen(event.startsAt, event.endsAt)],
          ["Where", event.venue],
          ["Seats", String(reg.seats)],
        ],
      },
      { type: "img", cid: "ticket-qr", alt: `QR code for ${reg.refCode}` },
      { type: "note", text: "Use the link in your original registration email to view or cancel your booking." },
    ],
  });
  await sendMail({
    to: reg.email,
    subject: `Confirmed from waitlist: ${event.title} (${reg.refCode})`,
    ...mail,
    attachments: [
      { filename: `${reg.refCode}.png`, content: await qrPng(reg.refCode), cid: "ticket-qr" },
      { filename: "event.ics", content: eventIcs(event), contentType: "text/calendar; charset=utf-8" },
    ],
  });
}

export async function sendEventCancelledEmails(event: Event) {
  const regs = await db.registration.findMany({
    where: { eventId: event.id, status: { in: ["CONFIRMED", "WAITLISTED"] } },
  });
  for (const r of regs) {
    const site = await getSite();
    const mail = renderEmail(site, {
      preheader: `${event.title} has been cancelled`,
      heading: "Event cancelled",
      greeting: `Hi ${r.name},`,
      blocks: [
        { type: "p", text: `We're sorry — ${event.title} (${formatEventWhen(event.startsAt, event.endsAt)}) has been cancelled.` },
        { type: "p", text: `Your registration ${r.refCode} is no longer needed. Please contact us on ${site.contact.phoneDisplay} with any questions.` },
      ],
    });
    await sendMail({
      to: r.email,
      subject: `Cancelled: ${event.title}`,
      ...mail,
      attachments: [{ filename: "event.ics", content: eventIcs(event, "CANCELLED"), contentType: "text/calendar; charset=utf-8" }],
    });
  }
  return regs.length;
}
