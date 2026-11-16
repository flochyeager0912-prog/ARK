import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicEvent, getUpcomingEvents } from "@/server/queries";
import { getMinistry, getSite } from "@/server/content";
import { mapsDirectionsUrl } from "@/content/site";
import { formatDateTime, formatEventWhen, formatTime, relativeDay } from "@/lib/time";
import { googleCalendarUrl } from "@/lib/ics";
import { Section } from "@/components/ui/section";
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
      <section className="hero-bg relative overflow-hidden text-white">
        {event.imageUrl && (
          <>
            <Image src={event.imageUrl} alt="" fill priority sizes="100vw" className="scale-105 object-cover opacity-35 blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/30" />
          </>
        )}
        <div className="container-page relative pb-14 pt-32 sm:pb-16 sm:pt-40">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-sm text-white/60">
            <Link href="/events" className="hover:text-white">Events</Link>
            {ministry && <><span aria-hidden>/</span><Link href={`/ministries/${ministry.slug}`} className="hover:text-white">{ministry.name}</Link></>}
          </nav>
          <div className="stagger">
            <div className="mb-5 flex flex-wrap gap-2">
              <AvailabilityBadge availability={availability} />
              {soon && <span className="badge border border-white/20 bg-white/10 px-3 py-1 text-white backdrop-blur">{soon}</span>}
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{event.title}</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">{event.summary}</p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/85">
              <p className="flex items-center gap-2"><IconCalendar size={18} className="text-brand-300" />{formatEventWhen(event.startsAt, event.endsAt)}</p>
              <p className="flex items-center gap-2"><IconPin size={18} className="text-brand-300" />{event.venue}</p>
            </div>
          </div>
        </div>
      </section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div>
            {event.imageUrl && (
              <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl shadow-lift">
                <Image src={event.imageUrl} alt={event.title} fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
              </div>
            )}
            <h2 className="text-2xl font-semibold">About this event</h2>
            <div className="prose-ark mt-4 whitespace-pre-line text-[17px]">
              <p>{event.description}</p>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="card overflow-hidden">
              <div className="space-y-4 p-6">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><IconCalendar size={20} /></span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">When</p>
                    <p className="font-medium">{formatEventWhen(event.startsAt, event.endsAt)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><IconPin size={20} /></span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Where</p>
                    <p className="font-medium">{event.venue}</p>
                    {live && <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-600 hover:underline">Get directions</a>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">{canRegister || availability === "dropin" ? <IconCheck size={20} /> : <IconUsers size={20} />}</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Registration</p>
                    <p className="font-medium">{STATUS_TEXT[availability]}</p>
                    {event.registrationClosesAt && canRegister && <p className="text-sm text-muted">Closes {formatDateTime(event.registrationClosesAt)}</p>}
                  </div>
                </div>
              </div>

              {canRegister && (
                <div className="border-t border-line bg-surface/60 p-6">
                  <Link href={`/events/${event.slug}/register`} className="btn-primary w-full py-3.5 text-base">
                    {registerLabel} <IconArrowRight size={18} />
                  </Link>
                  <p className="mt-3 text-center text-xs text-muted">Free · takes under a minute · QR ticket by email</p>
                </div>
              )}

              {live && (
                <div className="flex flex-wrap gap-2 border-t border-line p-6">
                  <a href={`/api/events/${event.slug}/ics`} className="btn-outline px-4 py-2 text-xs">Add to calendar</a>
                  <a href={gcal} target="_blank" rel="noopener noreferrer" className="btn-outline px-4 py-2 text-xs">Google Calendar</a>
                  <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="btn-outline px-4 py-2 text-xs">
                    <IconWhatsApp size={14} className="text-emerald-600" /> Share
                  </a>
                </div>
              )}
            </div>
          </aside>
        </div>
      </Section>

      {more.length > 0 && (
        <Section tone="surface">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">More upcoming events</h2>
            <Link href="/events" className="text-sm font-semibold text-brand-600 hover:underline">All events →</Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </Section>
      )}

      {/* Phones: the primary action stays within thumb reach, above the tab bar. */}
      {canRegister && (
        <div data-action-bar className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgb(11_20_48/0.25)] backdrop-blur-xl animate-toast-in lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{event.title}</p>
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
