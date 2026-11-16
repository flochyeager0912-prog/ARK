import "server-only";
import { db } from "./db";
import { sendMail, officeEmail } from "./mailer";
import { renderEmail } from "./email/layout";
import { siteUrl } from "@/lib/env";
import { ENQUIRY_PURPOSES, type EnquiryPurpose } from "@/lib/validation";
import { getMinistry, getSite } from "@/server/content";

export function purposeLabel(value: string) {
  const label = ENQUIRY_PURPOSES.find((p) => p.value === value)?.label ?? value;
  return label.replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

export async function submitEnquiry(input: {
  name: string;
  email: string;
  phone?: string;
  purpose: EnquiryPurpose;
  ministry?: string;
  message: string;
  contactOk: boolean;
}) {
  const isPrayerRequest = input.purpose === "prayer-request";
  const ministry = input.ministry ? await getMinistry(input.ministry) : undefined;
  const purpose = ministry ? `${input.purpose}:${ministry.slug}` : input.purpose;
  const enquiry = await db.enquiry.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      purpose,
      message: input.message,
      isPrayerRequest,
      contactOk: input.contactOk,
      consentAt: new Date(),
    },
  });

  // Acknowledge the sender.
  const site = await getSite();
  const ack = renderEmail(site, {
    preheader: "We've received your message",
    heading: isPrayerRequest ? "We're praying with you" : "Thank you for reaching out",
    greeting: `Hi ${input.name},`,
    blocks: [
      {
        type: "p",
        text: isPrayerRequest
          ? "Thank you for sharing your prayer request with us. Our pastoral team will be praying for you. Your request is kept confidential and is only seen by the pastoral team."
          : "Thank you for contacting The Ark Victory Church. One of our leaders will get in touch with you soon.",
      },
      { type: "kv", rows: [["Topic", purposeLabel(input.purpose) + (ministry ? ` — ${ministry.name}` : "")]] },
      { type: "note", text: `If it's urgent, please call us on ${site.contact.phoneDisplay}.` },
    ],
  });
  await sendMail({ to: input.email, subject: "We've received your message — The Ark Victory Church", ...ack });

  // Notify the office. Prayer request content is deliberately NOT included in email.
  const office = officeEmail();
  if (office) {
    const note = renderEmail(site, {
      preheader: `New ${purposeLabel(input.purpose)}`,
      heading: isPrayerRequest ? "New prayer request" : "New enquiry",
      blocks: [
        {
          type: "kv",
          rows: [
            ["Topic", purposeLabel(input.purpose) + (ministry ? ` — ${ministry.name}` : "")],
            ["From", input.name],
            ...(isPrayerRequest ? [] : ([["Email", input.email], ["Phone", input.phone ?? "—"]] as [string, string][])),
          ],
        },
        ...(isPrayerRequest
          ? [{ type: "note" as const, text: "For confidentiality, prayer request details are only visible in the admin area." }]
          : [{ type: "p" as const, text: input.message }]),
        { type: "button", label: "Open in admin", href: siteUrl(`/admin/enquiries/${enquiry.id}`) },
      ],
    });
    await sendMail({
      to: office,
      subject: isPrayerRequest ? "New prayer request" : `New enquiry: ${purposeLabel(input.purpose)}`,
      replyTo: isPrayerRequest ? undefined : input.email,
      ...note,
    });
  }
  return enquiry.id;
}
