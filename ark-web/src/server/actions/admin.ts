"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { hashPassword, login, logout, requireAdmin, validatePasswordStrength } from "@/server/auth";
import { clientIp } from "@/server/request";
import {
  cancelRegistration,
  promoteAfterCapacityChange,
  sendEventCancelledEmails,
  setCheckIn,
} from "@/server/registrations";
import { notifyVolunteerDecision } from "@/server/volunteers";
import { fieldErrors, formToObject, type FormState } from "@/lib/validation";
import { parseIstLocal } from "@/lib/time";
import { safeHref, slugify } from "@/lib/utils";
import { isSafeImage } from "@/lib/content-schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const istDate = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const d = parseIstLocal(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: `${label} is required` });
        return z.NEVER;
      }
      return d;
    });

const optionalIstDate = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = parseIstLocal(v);
    if (!d) {
      ctx.addIssue({ code: "custom", message: "Invalid date/time" });
      return z.NEVER;
    }
    return d;
  });

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

function revalidatePublic() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "");
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Enter your email and password.", values: { email } };
  const res = await login(email, password, await clientIp());
  if (!res.ok) return { ok: false, message: res.message, values: { email } };
  redirect("/admin");
}

export async function logoutAction() {
  const admin = await requireAdmin();
  await audit(admin.id, "auth.logout", "admin_user", admin.id);
  await logout();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required").max(140),
    slug: z.string().trim().max(80).optional(),
    summary: z.string().trim().min(10, "Add a short summary (10+ characters)").max(300),
    description: z.string().trim().min(10, "Add a description").max(10000),
    ministrySlug: optionalText(60),
    imageUrl: optionalText(500).refine((v) => !v || isSafeImage(v), "Choose an image from the library or upload one"),
    venue: z.string().trim().min(2, "Venue is required").max(200),
    startsAt: istDate("Start date/time"),
    endsAt: optionalIstDate,
    status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED"]),
    registrationEnabled: checkbox,
    registrationClosesAt: optionalIstDate,
    capacity: z
      .string()
      .trim()
      .optional()
      .transform((v, ctx) => {
        if (!v) return null;
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1 || n > 100000) {
          ctx.addIssue({ code: "custom", message: "Capacity must be a whole number (or empty for unlimited)" });
          return z.NEVER;
        }
        return n;
      }),
    waitlistEnabled: checkbox,
    maxSeatsPerBooking: z.coerce.number().int().min(1).max(20),
    notifyCancellation: checkbox,
  })
  .superRefine((v, ctx) => {
    if (v.endsAt && v.endsAt <= v.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End must be after start" });
    if (v.registrationClosesAt && v.registrationClosesAt > v.startsAt)
      ctx.addIssue({ code: "custom", path: ["registrationClosesAt"], message: "Registration must close before the event starts" });
  });

export async function saveEventAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const raw = formToObject(fd);
  const parsed = eventSchema.safeParse(raw);
  const values = Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error), values };

  const { notifyCancellation, slug: rawSlug, ...data } = parsed.data;
  const slug = slugify(rawSlug || data.title);
  if (!slug) return { ok: false, errors: { slug: "Slug is required" }, values };

  const clash = await db.event.findFirst({ where: { slug, NOT: id ? { id } : undefined }, select: { id: true } });
  if (clash) return { ok: false, errors: { slug: "Another event already uses this URL slug" }, values };

  let eventId = id;
  if (id) {
    const before = await db.event.findUnique({ where: { id } });
    if (!before) return { ok: false, message: "Event not found." };
    const updated = await db.event.update({ where: { id }, data: { ...data, slug } });
    await audit(admin.id, "event.update", "event", id, { title: updated.title, status: updated.status });
    if (before.status !== "CANCELLED" && updated.status === "CANCELLED" && notifyCancellation) {
      const n = await sendEventCancelledEmails(updated);
      await audit(admin.id, "event.cancel_notified", "event", id, { recipients: n });
    }
    if (updated.status === "PUBLISHED" && (updated.capacity == null || (before.capacity != null && updated.capacity > before.capacity))) {
      await promoteAfterCapacityChange(id);
    }
  } else {
    const created = await db.event.create({ data: { ...data, slug } });
    eventId = created.id;
    await audit(admin.id, "event.create", "event", created.id, { title: created.title });
  }
  revalidatePublic();
  revalidatePath("/admin/events");
  redirect(`/admin/events/${eventId}?saved=1`);
}

export async function deleteEventAction(id: string) {
  const admin = await requireAdmin();
  const count = await db.registration.count({ where: { eventId: id } });
  if (count > 0) redirect(`/admin/events/${id}?error=has-registrations`);
  await db.event.delete({ where: { id } });
  await audit(admin.id, "event.delete", "event", id);
  revalidatePublic();
  redirect("/admin/events");
}

/** One-click publish / unpublish from the events list. Cancelling still goes through the edit form (it can email people). */
export async function setEventPublishedAction(id: string, published: boolean) {
  const admin = await requireAdmin();
  const event = await db.event.findUnique({ where: { id }, select: { status: true } });
  if (!event || event.status === "CANCELLED") return;
  const status = published ? "PUBLISHED" : "DRAFT";
  await db.event.update({ where: { id }, data: { status } });
  await audit(admin.id, published ? "event.publish" : "event.unpublish", "event", id);
  if (published) await promoteAfterCapacityChange(id);
  revalidatePublic();
  revalidatePath("/admin/events");
}

/** Copies an event (without registrations) as a draft and opens it for editing. */
export async function duplicateEventAction(id: string) {
  const admin = await requireAdmin();
  const src = await db.event.findUnique({ where: { id } });
  if (!src) redirect("/admin/events");
  let slug = `${src.slug}-copy`.slice(0, 80);
  for (let n = 2; await db.event.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${src.slug}-copy-${n}`.slice(0, 80);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- strip identity/timestamps
  const { id: _id, createdAt, updatedAt, ...data } = src;
  const copy = await db.event.create({ data: { ...data, slug, title: `${src.title} (copy)`.slice(0, 140), status: "DRAFT" } });
  await audit(admin.id, "event.duplicate", "event", copy.id, { from: id });
  revalidatePath("/admin/events");
  redirect(`/admin/events/${copy.id}/edit`);
}

export async function adminCancelRegistrationAction(registrationId: string, eventId: string) {
  const admin = await requireAdmin();
  const res = await cancelRegistration(registrationId);
  await audit(admin.id, "registration.cancel", "registration", registrationId, { promoted: res.promoted });
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePublic();
}

export async function toggleCheckInAction(registrationId: string, eventId: string, checkedIn: boolean) {
  const admin = await requireAdmin();
  await setCheckIn(registrationId, checkedIn);
  await audit(admin.id, checkedIn ? "registration.check_in" : "registration.undo_check_in", "registration", registrationId);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function checkInByRefAction(eventId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const ref = String(fd.get("ref") ?? "").trim().toUpperCase();
  if (!ref) return { ok: false, message: "Enter a booking reference." };
  const normalized = ref.startsWith("ARK-") ? ref : `ARK-${ref.replace(/^ARK/, "")}`;
  const reg = await db.registration.findFirst({ where: { eventId, refCode: normalized } });
  if (!reg) return { ok: false, message: `No booking ${normalized} for this event.` };
  if (reg.status !== "CONFIRMED") return { ok: false, message: `${normalized} is ${reg.status.toLowerCase()} — not confirmed.` };
  if (reg.checkedInAt) return { ok: true, message: `${reg.name} (${reg.seats} seat${reg.seats > 1 ? "s" : ""}) was already checked in.` };
  await setCheckIn(reg.id, true);
  await audit(admin.id, "registration.check_in", "registration", reg.id);
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true, message: `✓ Checked in ${reg.name} — ${reg.seats} seat${reg.seats > 1 ? "s" : ""}.` };
}

// ---------------------------------------------------------------------------
// Enquiries & volunteers
// ---------------------------------------------------------------------------

const enquiryUpdate = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
  adminNotes: optionalText(5000),
});

export async function updateEnquiryAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = enquiryUpdate.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  await db.enquiry.update({
    where: { id },
    data: { ...parsed.data, resolvedAt: parsed.data.status === "RESOLVED" ? new Date() : null },
  });
  await audit(admin.id, "enquiry.update", "enquiry", id, { status: parsed.data.status });
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  return { ok: true, message: "Saved." };
}

export async function deleteEnquiryAction(id: string) {
  const admin = await requireAdmin("ADMIN");
  await db.enquiry.delete({ where: { id } });
  await audit(admin.id, "enquiry.delete", "enquiry", id);
  redirect("/admin/enquiries");
}

const volunteerUpdate = z.object({
  status: z.enum(["SUBMITTED", "ON_HOLD", "APPROVED", "DECLINED"]),
  adminNotes: optionalText(5000),
  notify: checkbox,
});

export async function updateVolunteerAction(id: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = volunteerUpdate.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  const before = await db.volunteerApplication.findUnique({ where: { id }, select: { status: true } });
  if (!before) return { ok: false, message: "Application not found." };
  const { notify, ...data } = parsed.data;
  await db.volunteerApplication.update({ where: { id }, data });
  await audit(admin.id, "volunteer.update", "volunteer_application", id, { status: data.status });
  let msg = "Saved.";
  if (notify && before.status !== data.status) {
    await notifyVolunteerDecision(id, data.status);
    if (data.status === "APPROVED" || data.status === "DECLINED") msg = "Saved and applicant emailed.";
  }
  revalidatePath("/admin/volunteers");
  revalidatePath(`/admin/volunteers/${id}`);
  return { ok: true, message: msg };
}

export async function deleteVolunteerAction(id: string) {
  const admin = await requireAdmin("ADMIN");
  await db.volunteerApplication.delete({ where: { id } });
  await audit(admin.id, "volunteer.delete", "volunteer_application", id);
  redirect("/admin/volunteers");
}

// ---------------------------------------------------------------------------
// Services (service timings)
// ---------------------------------------------------------------------------

const time = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) {
      ctx.addIssue({ code: "custom", message: "Use HH:MM (24-hour)" });
      return z.NEVER;
    }
    return v;
  });

const serviceSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z.string().trim().max(60).optional(),
    subtitle: optionalText(120),
    description: optionalText(1000),
    category: z.enum(["SUNDAY", "FELLOWSHIP", "CHILDREN", "MONTHLY"]),
    language: optionalText(60),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    recurrence: z.enum(["WEEKLY", "MONTHLY_NTH"]),
    nthWeek: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .pipe(z.number().int().min(-1).max(5).nullable()),
    startTime: time,
    endTime: time,
    venue: optionalText(200),
    livestream: checkbox,
    sortOrder: z.coerce.number().int().min(0).max(999),
    active: checkbox,
  })
  .superRefine((v, ctx) => {
    if (v.recurrence === "MONTHLY_NTH" && (v.nthWeek == null || v.nthWeek === 0))
      ctx.addIssue({ code: "custom", path: ["nthWeek"], message: "Choose which week of the month" });
    if (v.startTime && v.endTime && v.endTime <= v.startTime)
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after start time" });
  });

export async function saveServiceAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const raw = formToObject(fd);
  const values = Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = serviceSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error), values };
  const { slug: rawSlug, ...data } = parsed.data;
  const slug = slugify(rawSlug || data.name);
  const clash = await db.service.findFirst({ where: { slug, NOT: id ? { id } : undefined }, select: { id: true } });
  if (clash) return { ok: false, errors: { slug: "Slug already in use" }, values };
  const payload = { ...data, slug, nthWeek: data.recurrence === "WEEKLY" ? null : data.nthWeek };
  if (id) {
    await db.service.update({ where: { id }, data: payload });
    await audit(admin.id, "service.update", "service", id, { name: data.name });
  } else {
    const s = await db.service.create({ data: payload });
    await audit(admin.id, "service.create", "service", s.id, { name: data.name });
  }
  revalidatePublic();
  redirect("/admin/services?saved=1");
}

export async function deleteServiceAction(id: string) {
  const admin = await requireAdmin();
  await db.service.delete({ where: { id } });
  await audit(admin.id, "service.delete", "service", id);
  revalidatePublic();
  redirect("/admin/services");
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

const announcementSchema = z.object({
  title: z.string().trim().min(3).max(140),
  body: optionalText(400),
  linkUrl: optionalText(500).refine((v) => !v || safeHref(v) !== null, "Use a /path or an https:// link"),
  linkLabel: optionalText(40),
  startsAt: optionalIstDate,
  endsAt: optionalIstDate,
  active: checkbox,
});

export async function saveAnnouncementAction(id: string | null, _prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const raw = formToObject(fd);
  const values = Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error), values };
  const data = { ...parsed.data, startsAt: parsed.data.startsAt ?? new Date() };
  if (id) await db.announcement.update({ where: { id }, data });
  else await db.announcement.create({ data });
  await audit(admin.id, id ? "announcement.update" : "announcement.create", "announcement", id, { title: data.title });
  revalidatePublic();
  redirect("/admin/announcements?saved=1");
}

export async function deleteAnnouncementAction(id: string) {
  const admin = await requireAdmin();
  await db.announcement.delete({ where: { id } });
  await audit(admin.id, "announcement.delete", "announcement", id);
  revalidatePublic();
  redirect("/admin/announcements");
}

// ---------------------------------------------------------------------------
// Users & account
// ---------------------------------------------------------------------------

const newUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: z.enum(["ADMIN", "EDITOR"]),
  password: z.string().min(1),
});

export async function createUserAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin("ADMIN");
  const raw = formToObject(fd);
  const parsed = newUserSchema.safeParse(raw);
  const values = { name: String(raw.name ?? ""), email: String(raw.email ?? ""), role: String(raw.role ?? "EDITOR") };
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values };
  const weak = validatePasswordStrength(parsed.data.password);
  if (weak) return { ok: false, errors: { password: weak }, values };
  try {
    const u = await db.adminUser.create({
      data: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, passwordHash: await hashPassword(parsed.data.password) },
    });
    await audit(admin.id, "user.create", "admin_user", u.id, { email: u.email, role: u.role });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: false, errors: { email: "A user with this email exists" }, values };
    throw e;
  }
  revalidatePath("/admin/users");
  return { ok: true, message: `User ${parsed.data.email} created. Share the password with them securely.` };
}

export async function setUserActiveAction(id: string, active: boolean) {
  const admin = await requireAdmin("ADMIN");
  if (id === admin.id) redirect("/admin/users?error=self");
  await db.adminUser.update({ where: { id }, data: { active } });
  await audit(admin.id, active ? "user.activate" : "user.deactivate", "admin_user", id);
  revalidatePath("/admin/users");
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const user = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
  if (!(await bcrypt.compare(current, user.passwordHash))) return { ok: false, errors: { current: "Current password is incorrect" } };
  const weak = validatePasswordStrength(next);
  if (weak) return { ok: false, errors: { next: weak } };
  if (next !== confirm) return { ok: false, errors: { confirm: "Passwords don't match" } };
  await db.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(next) } });
  await audit(admin.id, "user.change_password", "admin_user", admin.id);
  return { ok: true, message: "Password updated." };
}
