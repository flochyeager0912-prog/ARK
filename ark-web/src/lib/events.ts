/**
 * Pure event helpers shared by public pages, admin previews and tests.
 * Availability is a *label* only — the public site never shows seat numbers.
 */
import type { Event } from "@prisma/client";

export type EventAvailability = "open" | "waitlist" | "full" | "closed" | "dropin" | "cancelled" | "ended";

type RegistrationFields = Pick<Event, "status" | "registrationEnabled" | "registrationClosesAt" | "startsAt">;

/** Is registration currently open for this event? */
export function registrationOpen(e: RegistrationFields, now = new Date()) {
  if (e.status !== "PUBLISHED" || !e.registrationEnabled) return false;
  if (e.registrationClosesAt && e.registrationClosesAt.getTime() <= now.getTime()) return false;
  return e.startsAt.getTime() > now.getTime();
}

/** Public availability of an event, given the seats already confirmed. */
export function availabilityOf(
  e: RegistrationFields & Pick<Event, "endsAt" | "capacity" | "waitlistEnabled">,
  confirmedSeats: number,
  now = new Date(),
): EventAvailability {
  if (e.status === "CANCELLED") return "cancelled";
  if ((e.endsAt ?? e.startsAt).getTime() < now.getTime()) return "ended";
  if (!e.registrationEnabled) return "dropin";
  if (!registrationOpen(e, now)) return "closed";
  if (e.capacity != null && confirmedSeats >= e.capacity) return e.waitlistEnabled ? "waitlist" : "full";
  return "open";
}

export const AVAILABILITY_LABEL: Record<EventAvailability, string> = {
  open: "Registration open",
  waitlist: "Waitlist open",
  full: "Fully booked",
  closed: "Registration closed",
  dropin: "Free · just come",
  cancelled: "Cancelled",
  ended: "Ended",
};

export const AVAILABILITY_TONE: Record<EventAvailability, string> = {
  open: "bg-emerald-500 text-white",
  waitlist: "bg-amber-400 text-amber-950",
  full: "bg-slate-700 text-white",
  closed: "bg-slate-700 text-white",
  dropin: "bg-white text-navy-900",
  cancelled: "bg-red-600 text-white",
  ended: "bg-slate-500 text-white",
};
