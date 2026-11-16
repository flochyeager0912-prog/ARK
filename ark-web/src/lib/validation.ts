import { z } from "zod";

const trimmed = (max: number) => z.string().trim().max(max);
const required = (label: string, max: number) => z.string().trim().min(1, `${label} is required`).max(max);

/** Indian or international phone number; normalised to digits with optional leading "+". */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-().]/g, ""))
  .pipe(z.string().regex(/^\+?\d{10,15}$/, "Enter a valid phone number (10–15 digits)"));

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(254));

const consent = z.literal("on", { error: "Please give your consent so we can process your details" });

export const ENQUIRY_PURPOSES = [
  { value: "general", label: "General enquiry" },
  { value: "new-to-ark", label: "New to Ark / planning a visit" },
  { value: "prayer-request", label: "🙏 Prayer request" },
  { value: "ministerial-opportunities", label: "🙌 Ministerial opportunities" },
  { value: "volunteer", label: "🤝 Volunteer with us" },
  { value: "building-fund", label: "🏗️ Donate to the building fund" },
  { value: "discipleship-groups", label: "📖 Discipleship groups" },
  { value: "join-ministry", label: "Join a service or ministry" },
] as const;

export type EnquiryPurpose = (typeof ENQUIRY_PURPOSES)[number]["value"];
const purposeValues = ENQUIRY_PURPOSES.map((p) => p.value) as [EnquiryPurpose, ...EnquiryPurpose[]];

export const enquirySchema = z.object({
  name: required("Name", 120),
  email: emailSchema,
  phone: z.union([z.literal(""), phoneSchema]).optional().transform((v) => v || undefined),
  purpose: z.enum(purposeValues, { error: "Choose a purpose" }),
  ministry: trimmed(60).optional(),
  message: required("Message", 4000),
  contactOk: z.literal("on").optional(),
  consent,
});

export const VOLUNTEER_TEAMS = [
  "Worship & music",
  "Media & tech",
  "Hospitality & ushering",
  "Victory Kids (children)",
  "Tweens",
  "Ark Arise (youth)",
  "Prayer team",
  "Outreach & missions",
  "Rakshak",
  "Discipleship groups",
  "Administration",
  "Other",
] as const;

export const AVAILABILITY = [
  "6 AM Bilingual service",
  "8 AM Tamil service",
  "10 AM English service",
  "12:15 PM Ark Arise",
  "5 PM Hindi / Telugu",
  "Weekdays",
  "Special events",
] as const;

export const volunteerSchema = z.object({
  name: required("Name", 120),
  email: emailSchema,
  phone: phoneSchema,
  teams: z
    .array(z.enum(VOLUNTEER_TEAMS))
    .min(1, "Choose at least one team")
    .max(VOLUNTEER_TEAMS.length),
  availability: z.array(z.enum(AVAILABILITY)).max(AVAILABILITY.length).default([]),
  attendingSince: trimmed(60).optional(),
  experience: trimmed(2000).optional(),
  message: trimmed(2000).optional(),
  consent,
});

export const registrationSchema = z.object({
  name: required("Name", 120),
  email: emailSchema,
  phone: phoneSchema,
  seats: z.coerce.number().int().min(1, "At least 1 seat").max(20),
  notes: trimmed(1000).optional(),
  consent,
});

/** Read a FormData into a plain object, collecting repeated keys into arrays. */
export function formToObject(fd: FormData, arrayKeys: string[] = []) {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = fd.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = arrayKeys.includes(key) ? all : all[0];
  }
  for (const k of arrayKeys) if (!(k in out)) out[k] = [];
  return out;
}

export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: FieldErrors;
  /** echo back safe values so the form keeps user input on error */
  values?: Record<string, string | string[]>;
};
