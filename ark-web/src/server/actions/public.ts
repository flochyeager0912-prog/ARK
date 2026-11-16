"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  enquirySchema,
  fieldErrors,
  formToObject,
  registrationSchema,
  volunteerSchema,
  type FormState,
} from "@/lib/validation";
import { guardPublicForm } from "@/server/spam";
import { submitEnquiry } from "@/server/enquiries";
import { submitVolunteerApplication } from "@/server/volunteers";
import { cancelRegistration, findByManageToken, register } from "@/server/registrations";
import { db } from "@/server/db";
import { rateLimit } from "@/server/rate-limit";
import { clientIp } from "@/server/request";

/** Strip secrets/consent from echoed values. */
function echo(obj: Record<string, unknown>): FormState["values"] {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "consent" || k.startsWith("_") || k === "company_website" || k === "cf-turnstile-response") continue;
    if (typeof v === "string") out[k] = v.slice(0, 4000);
    else if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === "string").slice(0, 50);
  }
  return out;
}

const GENERIC_ERROR = "Something went wrong on our side. Please try again, or call us.";

export async function submitEnquiryAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = formToObject(fd);
  const guard = await guardPublicForm(fd, "enquiry", 8);
  if (!guard.ok) return guard.silent ? { ok: true, message: "Thank you! We've received your message." } : { ok: false, message: guard.message, values: echo(raw) };

  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error), values: echo(raw) };

  try {
    await submitEnquiry({ ...parsed.data, contactOk: parsed.data.contactOk === "on" || parsed.data.purpose !== "prayer-request" });
  } catch (e) {
    console.error("[enquiry] submit failed", e);
    return { ok: false, message: GENERIC_ERROR, values: echo(raw) };
  }
  return {
    ok: true,
    message:
      parsed.data.purpose === "prayer-request"
        ? "Thank you for sharing your prayer request. Our pastoral team will be praying for you."
        : "Thank you! We've received your message and one of our leaders will get in touch with you soon.",
  };
}

export async function submitVolunteerAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const raw = formToObject(fd, ["teams", "availability"]);
  const guard = await guardPublicForm(fd, "volunteer", 5);
  if (!guard.ok) return guard.silent ? { ok: true, message: "Thank you for offering to serve!" } : { ok: false, message: guard.message, values: echo(raw) };

  const parsed = volunteerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error), values: echo(raw) };

  try {
    await submitVolunteerApplication(parsed.data);
  } catch (e) {
    console.error("[volunteer] submit failed", e);
    return { ok: false, message: GENERIC_ERROR, values: echo(raw) };
  }
  return {
    ok: true,
    message: "Thank you for offering to serve! We've emailed you a confirmation and a ministry leader will contact you soon.",
  };
}

export async function registerAction(eventId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const raw = formToObject(fd);
  const guard = await guardPublicForm(fd, "register", 10);
  if (!guard.ok) return guard.silent ? { ok: false, message: "Please try again." } : { ok: false, message: guard.message, values: echo(raw) };

  const parsed = registrationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please check the highlighted fields.", errors: fieldErrors(parsed.error), values: echo(raw) };

  let result;
  try {
    result = await register(eventId, parsed.data);
  } catch (e) {
    console.error("[register] failed", e);
    return { ok: false, message: GENERIC_ERROR, values: echo(raw) };
  }
  if (!result.ok) return { ok: false, message: result.message, values: echo(raw) };

  const event = await db.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (event) revalidatePath(`/events/${event.slug}`);
  redirect(`/booking/${result.manageToken}?new=1`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by useActionState
export async function cancelBookingAction(token: string, _prev: FormState, _fd: FormData): Promise<FormState> {
  const ip = await clientIp();
  if (!(await rateLimit(`cancel:${ip}`, 20, 3600))) return { ok: false, message: "Too many attempts. Please try later." };
  const reg = await findByManageToken(token);
  if (!reg) return { ok: false, message: "Booking not found." };
  if (reg.status === "CANCELLED") return { ok: true, message: "This booking is already cancelled." };
  if (reg.event.startsAt <= new Date()) return { ok: false, message: "This event has already started and can no longer be cancelled online." };
  await cancelRegistration(reg.id);
  revalidatePath(`/events/${reg.event.slug}`);
  revalidatePath(`/booking/${token}`);
  return { ok: true, message: "Your booking has been cancelled. Thank you for letting us know." };
}
