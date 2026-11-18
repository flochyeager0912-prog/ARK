import type { Metadata } from "next";
import { withBase } from "@/lib/preview";
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
  CONFIRMED: { label: "Confirmed", cls: "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200" },
  WAITLISTED: { label: "Waitlisted", cls: "border border-amber-400/30 bg-amber-400/15 text-amber-100" },
  CANCELLED: { label: "Cancelled", cls: "border border-white/15 bg-white/5 text-muted" },
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
    <Section width="narrow" className="pt-24 sm:pt-32">
      {isNew && reg.status !== "CANCELLED" && (
        <div className="tone-ok mb-6 flex items-start gap-3 rounded-2xl p-5" role="status">
          <IconCheck className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">{reg.status === "CONFIRMED" ? "You're registered!" : "You're on the waitlist"}</p>
            <p className="text-sm opacity-90">We&apos;ve emailed the details to {reg.email}. Bookmark this page to view or cancel your booking later.</p>
          </div>
        </div>
      )}

      <div className="tile overflow-hidden">
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <p className="eyebrow">Booking reference</p>
            <p data-ref-code className="mt-2 font-mono text-3xl font-medium tracking-wider text-white">{reg.refCode}</p>
          </div>
          <span className={`badge ${status.cls}`}>{status.label}</span>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2"><dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Event</dt><dd className="mt-1 font-semibold text-white"><Link href={`/events/${event.slug}`} className="hover:underline">{event.title}</Link></dd></div>
            <div className="sm:col-span-2"><dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">When</dt><dd className="mt-1 font-semibold text-white">{formatEventWhen(event.startsAt, event.endsAt)}</dd></div>
            <div className="sm:col-span-2"><dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Where</dt><dd className="mt-1 font-semibold text-white">{event.venue}</dd></div>
            <div><dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Name</dt><dd className="mt-1 font-semibold text-white">{reg.name}</dd></div>
            <div><dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">People</dt><dd className="mt-1 font-semibold text-white">{reg.seats}</dd></div>
            {reg.checkedInAt && <div className="sm:col-span-2"><dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Checked in</dt><dd className="mt-1 font-semibold text-white">{formatDateTime(reg.checkedInAt)}</dd></div>}
          </dl>
          {qr && (
            <figure className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={`QR code for booking ${reg.refCode}`} width={180} height={180} className="mx-auto rounded-xl border border-line bg-white p-2" />
              <figcaption className="mt-2 text-xs text-muted">Show this at check-in</figcaption>
            </figure>
          )}
        </div>
        {reg.status === "CANCELLED" && (
          <p className="mx-6 mb-6 rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-sm text-muted" role="status">
            This booking has been cancelled{reg.cancelledAt ? ` (${formatDateTime(reg.cancelledAt)})` : ""}. Thank you for letting us know.
          </p>
        )}
        {event.status === "CANCELLED" && <p className="tone-bad mx-6 mb-6 rounded-xl px-4 py-3 text-sm">This event has been cancelled by the church.</p>}
        {reg.status === "WAITLISTED" && <p className="tone-warn mx-6 mb-6 rounded-xl px-4 py-3 text-sm">The event is currently full. If a place opens up, your booking will be confirmed automatically and we&apos;ll email you.</p>}
        {upcoming && reg.status !== "CANCELLED" && event.status !== "CANCELLED" && (
          <div className="flex flex-col gap-4 border-t border-line bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <a href={withBase(`/api/events/${event.slug}/ics`)} className="btn-outline px-4 py-2 text-xs">Add to calendar</a>
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
        Need help? Call <a href={`tel:${site.contact.phoneE164}`} className="font-semibold text-accent">{site.contact.phoneDisplay}</a>
      </p>
    </Section>
  );
}
