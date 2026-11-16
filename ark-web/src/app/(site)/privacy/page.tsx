import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { getSite } from "@/server/content";

export const metadata: Metadata = { title: "Privacy notice", alternates: { canonical: "/privacy" } };

export default async function PrivacyPage() {
  const site = await getSite();
  return (
    <>
      <div className="hero-bg h-24 sm:h-28" />
      <Section className="pt-10">
        <article className="prose-ark mx-auto max-w-3xl [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mb-1 [&_li]:text-muted [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6">
          <h1 className="mb-6 text-4xl font-semibold text-ink">Privacy notice</h1>
          <p>
            {site.name} (“we”, “us”) respects your privacy. This notice explains how we handle personal data collected through this website,
            in line with India&apos;s Digital Personal Data Protection Act, 2023.
          </p>

          <h2>What we collect</h2>
          <ul>
            <li><strong>Contact &amp; prayer requests:</strong> your name, email, optional phone number, the topic and your message.</li>
            <li><strong>Event registrations:</strong> your name, email, mobile number, number of seats and any notes you add.</li>
            <li><strong>Volunteer applications:</strong> your name, email, mobile number, preferred teams, availability and any details you share.</li>
            <li><strong>Technical data:</strong> your IP address is used briefly to prevent spam and abuse (rate limiting). We do not use advertising trackers.</li>
          </ul>

          <h2>Why we use it</h2>
          <p>
            Only to respond to you, manage your event booking (confirmation, reminders, check-in and waitlist updates), process your volunteer
            application, and pray for you if you ask us to. We do not sell or share your data for marketing.
          </p>

          <h2>Prayer requests</h2>
          <p>Prayer requests are confidential. They are visible only to authorised church staff in our admin system and are not included in notification emails.</p>

          <h2>Children</h2>
          <p>Registrations for anyone under 18 must be made by a parent or guardian, who gives consent on the child&apos;s behalf.</p>

          <h2>Who can see it</h2>
          <p>
            Authorised church staff and ministry leaders who need it to respond to you. Our hosting and email providers process data on our behalf
            under appropriate safeguards.
          </p>

          <h2>How long we keep it</h2>
          <p>
            Event registrations are kept for up to 12 months after the event; enquiries and volunteer applications for up to 24 months, unless you
            ask us to delete them sooner or we need them for an ongoing relationship (for example, as an active volunteer).
          </p>

          <h2>Your rights</h2>
          <p>
            You can ask to access, correct or erase your personal data, or withdraw your consent, at any time. You can also cancel an event booking
            yourself using the link in your confirmation email.
          </p>

          <h2>Contact &amp; grievances</h2>
          <p>
            Email <a href={`mailto:${site.contact.email}`} className="text-brand-600 underline">{site.contact.email}</a> or call {site.contact.phoneDisplay}, or write
            to us at {site.address.full}. We will respond within 30 days.
          </p>
          <p className="text-sm">Last updated: November 2026.</p>
        </article>
      </Section>
    </>
  );
}
