import type { Metadata } from "next";
import { withBase } from "@/lib/preview";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicEvent, getUpcomingEvents } from "@/server/queries";
import { getMinistry, getSite } from "@/server/content";
import { mapsDirectionsUrl } from "@/content/site";
import { formatDateTime, formatEventWhen, formatTime, relativeDay } from "@/lib/time";
import { googleCalendarUrl } from "@/lib/ics";
import { Breadcrumbs, Meta, Section, SectionHeading } from "@/components/ui/section";
import { AvailabilityBadge, EventCard } from "@/components/site/event-card";
import { IconArrowRight, IconCalendar, IconCheck, IconPin, IconUsers, IconWhatsApp } from "@/components/ui/icons";
import { jsonLdString } from "@/components/site/json-ld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicEvent((await params).slug);
  if (!data) return {};
  const { event } = data;
  return {
    title: event.title,
    description: event.summary,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { type: "article", images: event.imageUrl ? [event.imageUrl] : undefined },
  };
}

/** What the visitor can do right now — worded without revealing seat numbers. */
const STATUS_TEXT = {
  open: "Registration is open",
  waitlist: "Fully booked — join the waitlist and we'll confirm you automatically if a place opens up",
  full: "This event is fully booked",
  closed: "Registration is closed",
  dropin: "No registration needed — just come along!",
  cancelled: "This event has been cancelled",
  ended: "This event has ended",
} as const;

export default async function EventPage({ params }: Props) {
  const data = await getPublicEvent((await params).slug);
  if (!data) notFound();
  const { event, availability } = data;
  const [site, ministry, upcoming] = await Promise.all([
    getSite(),
    event.ministrySlug ? getMinistry(event.ministrySlug) : undefined,
    getUpcomingEvents(4),
  ]);
  const more = upcoming.filter((e) => e.id !== event.id && e.availability !== "cancelled").slice(0, 3);
  const canRegister = availability === "open" || availability === "waitlist";
  const live = availability !== "cancelled" && availability !== "ended";
  const soon = live ? relativeDay(event.startsAt) : null;
  const baseUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/events/${event.slug}`;
  const shareText = encodeURIComponent(`${event.title} — ${formatEventWhen(event.startsAt, event.endsAt)}\n${url}`);
  const gcal = googleCalendarUrl({ uid: event.id, title: event.title, description: `${event.summary}\n${url}`, location: event.venue, start: event.startsAt, end: event.endsAt });
  const registerLabel = availability === "waitlist" ? "Join the waitlist" : "Register now";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.startsAt.toISOString(),
    endDate: event.endsAt?.toISOString(),
    eventStatus: availability === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.venue, address: site.address.full },
    image: event.imageUrl ? [`${baseUrl}${event.imageUrl}`] : undefined,
    organizer: { "@type": "Organization", name: site.name, url: baseUrl },
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "INR",
      availability: availability === "waitlist" || availability === "full" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url,
    },
  };

  return (
    <>
      <section className="container-page pb-5 pt-24 sm:pb-7 sm:pt-32">
        <div className="panel overflow-hidden">
          {event.imageUrl && (
            <>
              <Image src={event.imageUrl} alt="" fill priority sizes="100vw" className="scale-105 object-cover opacity-25 blur-[2px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-night-950/95 via-night-950/80 to-night-950/40" />
            </>
          )}
          <div className="stagger relative p-7 sm:p-10 lg:p-12">
            <Breadcrumbs items={[{ href: "/events", label: "Events" }, ...(ministry ? [{ href: `/ministries/${ministry.slug}`, label: ministry.name }] : [])]} />
            <div className="mb-5 flex flex-wrap gap-2">
              <AvailabilityBadge availability={availability} />
              {soon && <span className="badge border border-white/20 bg-white/10 px-3 py-1 text-white backdrop-blur">{soon}</span>}
            </div>
            <h1 className="max-w-4xl font-display text-[2.4rem] font-medium leading-[1.05] text-white sm:text-6xl">{event.title}</h1>
            <p className="lead mt-5 max-w-2xl">{event.summary}</p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink/85">
              <p className="flex items-center gap-2"><IconCalendar size={18} className="text-glow-blue" />{formatEventWhen(event.startsAt, event.endsAt)}</p>
              <p className="flex items-center gap-2"><IconPin size={18} className="text-glow-blue" />{event.venue}</p>
            </div>
            {canRegister && (
              <Link href={`/events/${event.slug}/register`} className="btn-primary mt-8 hidden px-6 lg:inline-flex">
                {registerLabel} <IconArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            {event.imageUrl && (
              <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl border border-line">
                <Image src={event.imageUrl} alt={event.title} fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
              </div>
            )}
            <p className="eyebrow mb-4">Details</p>
            <h2 className="font-display text-3xl font-medium text-white">About this event</h2>
            <div className="prose-ark mt-4 whitespace-pre-line text-[17px]">
              <p>{event.description}</p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="tile overflow-hidden">
              <div className="space-y-5 p-6">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-glow-blue"><IconCalendar size={18} /></span>
                  <Meta label="When">{formatEventWhen(event.startsAt, event.endsAt)}</Meta>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-glow-blue"><IconPin size={18} /></span>
                  <Meta label="Where">
                    {event.venue}
                    {live && <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="block text-sm font-medium text-accent hover:underline">Get directions</a>}
                  </Meta>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-glow-blue">{canRegister || availability === "dropin" ? <IconCheck size={18} /> : <IconUsers size={18} />}</span>
                  <Meta label="Registration">
                    {STATUS_TEXT[availability]}
                    {event.registrationClosesAt && canRegister && <span className="block text-sm font-normal text-muted">Closes {formatDateTime(event.registrationClosesAt)}</span>}
                  </Meta>
                </div>
              </div>

              {canRegister && (
                <div className="border-t border-line bg-white/[0.02] p-6">
                  <Link href={`/events/${event.slug}/register`} className="btn-primary w-full py-3.5 text-base">
                    {registerLabel} <IconArrowRight size={18} />
                  </Link>
                  <p className="mt-3 text-center text-xs text-muted">Free · takes under a minute · QR ticket by email</p>
                </div>
              )}

              {live && (
                <div className="flex flex-wrap gap-2 border-t border-line p-6">
                  <a href={withBase(`/api/events/${event.slug}/ics`)} className="btn-outline px-4 py-2 text-xs">Add to calendar</a>
                  <a href={gcal} target="_blank" rel="noopener noreferrer" className="btn-outline px-4 py-2 text-xs">Google Calendar</a>
                  <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="btn-outline px-4 py-2 text-xs">
                    <IconWhatsApp size={14} className="text-emerald-400" /> Share
                  </a>
                </div>
              )}
            </div>
          </aside>
        </div>
      </Section>

      {more.length > 0 && (
        <Section>
          <SectionHeading eyebrow="What else is on" title="More upcoming events" action={<Link href="/events" className="btn-outline">All events</Link>} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </Section>
      )}

      {/* Phones: the primary action stays within thumb reach, above the tab bar. */}
      {canRegister && (
        <div data-action-bar className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-white/[0.08] bg-night-950/90 px-4 py-3 backdrop-blur-xl animate-toast-in lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{event.title}</p>
              <p className="truncate text-xs text-muted">{soon ? `${soon} · ` : ""}{formatTime(event.startsAt)}</p>
            </div>
            <Link href={`/events/${event.slug}/register`} className="btn-primary shrink-0 px-5 py-2.5">{registerLabel}</Link>
          </div>
        </div>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
    </>
  );
}
