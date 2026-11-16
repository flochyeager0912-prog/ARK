import "server-only";
import type { VolunteerStatus } from "@prisma/client";
import { db } from "./db";
import { sendMail, officeEmail } from "./mailer";
import { renderEmail } from "./email/layout";
import { siteUrl } from "@/lib/env";
import { getSite } from "@/server/content";

export async function submitVolunteerApplication(input: {
  name: string;
  email: string;
  phone: string;
  teams: string[];
  availability: string[];
  attendingSince?: string;
  experience?: string;
  message?: string;
}) {
  const app = await db.volunteerApplication.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      teams: input.teams,
      availability: input.availability,
      attendingSince: input.attendingSince || null,
      experience: input.experience || null,
      message: input.message || null,
      consentAt: new Date(),
    },
  });

  const site = await getSite();
  const ack = renderEmail(site, {
    preheader: "Thank you for offering to serve",
    heading: "Thank you for offering to serve!",
    greeting: `Hi ${input.name},`,
    blocks: [
      {
        type: "p",
        text: "We've received your volunteer application. Every helping hand makes a difference — a ministry leader will contact you to talk about next steps.",
      },
      { type: "kv", rows: [["Teams", input.teams.join(", ")]] },
      { type: "note", text: `Questions? Call ${site.contact.phoneDisplay} or reply to ${site.contact.email}.` },
    ],
  });
  await sendMail({ to: input.email, subject: "Your volunteer application — The Ark Victory Church", ...ack });

  const office = officeEmail();
  if (office) {
    const note = renderEmail(site, {
      preheader: "New volunteer application",
      heading: "New volunteer application",
      blocks: [
        { type: "kv", rows: [["Name", input.name], ["Teams", input.teams.join(", ")], ["Phone", input.phone]] },
        { type: "button", label: "Review in admin", href: siteUrl(`/admin/volunteers/${app.id}`) },
      ],
    });
    await sendMail({ to: office, subject: `Volunteer application: ${input.name}`, replyTo: input.email, ...note });
  }
  return app.id;
}

/** Email the applicant when an admin approves or declines. */
export async function notifyVolunteerDecision(id: string, status: VolunteerStatus) {
  if (status !== "APPROVED" && status !== "DECLINED") return;
  const app = await db.volunteerApplication.findUnique({ where: { id } });
  if (!app) return;
  const approved = status === "APPROVED";
  const site = await getSite();
  const mail = renderEmail(site, {
    preheader: approved ? "Welcome to the team" : "About your volunteer application",
    heading: approved ? "Welcome to the team! 🙌" : "Thank you for your application",
    greeting: `Hi ${app.name},`,
    blocks: [
      {
        type: "p",
        text: approved
          ? `Your application to serve (${app.teams.join(", ")}) has been approved. A team leader will be in touch with your schedule and next steps.`
          : "Thank you for offering to serve. We aren't able to place you on the team(s) you selected right now, but we'd love to stay in touch and find the right place for you to serve.",
      },
      { type: "note", text: `Questions? Call ${site.contact.phoneDisplay}.` },
    ],
  });
  await sendMail({ to: app.email, subject: approved ? "Welcome to the Ark volunteer team" : "Your volunteer application", ...mail });
}
