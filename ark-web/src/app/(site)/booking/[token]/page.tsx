import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { findByManageToken } from "@/server/registrations";
import { formatDateTime, formatEventWhen } from "@/lib/time";
import { googleCalendarUrl } from "@/lib/ics";
import { Section } from "@/components/ui/section";
import { CancelBookingForm } from "@/components/forms/cancel-booking-form";
import { IconCheck } from "@/components/ui/icons";
import { getSite } from "@/server/content";

export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> };

const STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-800" },
  WAITLISTED: { label: "Waitlisted", cls: "bg-amber-100 text-amber-900" },
  CANCELLED: { label: "Cancelled", cls: "bg-slate-200 text-slate-700" },
};

export default async function BookingPage({ params, searchParams }: Props) {
  const site = await getSite();
  const { token } = await params;
  const { new: isNew } = await searchParams;
  const reg = await findByManageToken(token);
  if (!reg) notFound();
  const { event } = reg;
  const qr = reg.status === "CONFIRMED" ? await QRCode.toDataURL(reg.refCode, { width: 320, margin: 1 }) : null;
  const upcoming = event.startsAt > new Date();
  const status = STATUS[reg.status]!;

  return (
    <>
      <div className="hero-bg h-24 sm:h-28" />
      <Section className="pt-10 sm:pt-12">
        <div className="mx-auto max-w-2xl">
          {isNew && reg.status !== "CANCELLED" && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-5 text-emerald-900" role="status">
              <IconCheck className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{reg.status === "CONFIRMED" ? "You're registered!" : "You're on the waitlist"}</p>
                <p className="text-sm">We&apos;ve emailed the details to {reg.email}. Bookmark this page to view or cancel your booking later.</p>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="flex items-start justify-between gap-4 border-b border-line p-6">
              <div>
                <p className="text-sm text-muted">Booking reference</p>
                <p className="font-display text-3xl font-semibold tracking-wider">{reg.refCode}</p>
              </div>
              <span className={`badge ${status.cls}`}>{status.label}</span>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
              <dl className="space-y-3 text-sm">
                <div><dt className="text-muted">Event</dt><dd className="font-semibold"><Link href={`/events/${event.slug}`} className="hover:underline">{event.title}</Link></dd></div>
                <div><dt className="text-muted">When</dt><dd className="font-semibold">{formatEventWhen(event.startsAt, event.endsAt)}</dd></div>
                <div><dt className="text-muted">Where</dt><dd className="font-semibold">{event.venue}</dd></div>
                <div><dt className="text-muted">Name</dt><dd className="font-semibold">{reg.name}</dd></div>
                <div><dt className="text-muted">People</dt><dd className="font-semibold">{reg.seats}</dd></div>
                {reg.checkedInAt && <div><dt className="text-muted">Checked in</dt><dd className="font-semibold">{formatDateTime(reg.checkedInAt)}</dd></div>}
              </dl>
              {qr && (
                <figure className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt={`QR code for booking ${reg.refCode}`} width={180} height={180} className="mx-auto rounded-xl border border-line" />
                  <figcaption className="mt-2 text-xs text-muted">Show this at check-in</figcaption>
                </figure>
              )}
            </div>
            {reg.status === "CANCELLED" && (
              <p className="mx-6 mb-6 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700" role="status">
                This booking has been cancelled{reg.cancelledAt ? ` (${formatDateTime(reg.cancelledAt)})` : ""}. Thank you for letting us know.
              </p>
            )}
            {event.status === "CANCELLED" && <p className="mx-6 mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">This event has been cancelled by the church.</p>}
            {reg.status === "WAITLISTED" && <p className="mx-6 mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">The event is currently full. If a place opens up, your booking will be confirmed automatically and we&apos;ll email you.</p>}
            {upcoming && reg.status !== "CANCELLED" && event.status !== "CANCELLED" && (
              <div className="flex flex-col gap-4 border-t border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <a href={`/api/events/${event.slug}/ics`} className="btn-outline px-4 py-2 text-xs">Add to calendar</a>
                  <a
                    href={googleCalendarUrl({ uid: event.id, title: event.title, location: event.venue, start: event.startsAt, end: event.endsAt })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline px-4 py-2 text-xs"
                  >
                    Google Calendar
                  </a>
                </div>
                <CancelBookingForm token={token} />
              </div>
            )}
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Need help? Call <a href={`tel:${site.contact.phoneE164}`} className="font-semibold text-brand-600">{site.contact.phoneDisplay}</a>
          </p>
        </div>
      </Section>
    </>
  );
}
