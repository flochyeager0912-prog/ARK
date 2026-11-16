import type { Metadata } from "next";
import Link from "next/link";
import { getPastEvents, getUpcomingEvents, type PublicEvent } from "@/server/queries";
import { PageHero, Section } from "@/components/ui/section";
import { EventCard } from "@/components/site/event-card";
import { formatMonth } from "@/lib/time";
import { cn } from "@/lib/utils";
import { getMinistries } from "@/server/content";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming events at The Ark Victory Church — youth nights, camps, special services, outreach and more. Register online.",
  alternates: { canonical: "/events" },
};

type Props = { searchParams: Promise<{ ministry?: string }> };

function groupByMonth(events: PublicEvent[]) {
  const groups: { month: string; events: PublicEvent[] }[] = [];
  for (const e of events) {
    const month = formatMonth(e.startsAt);
    const last = groups.at(-1);
    if (last?.month === month) last.events.push(e);
    else groups.push({ month, events: [e] });
  }
  return groups;
}

export default async function EventsPage({ searchParams }: Props) {
  const [ministries, { ministry }, upcoming, past] = await Promise.all([getMinistries(), searchParams, getUpcomingEvents(100), getPastEvents(6)]);
  const ministryName = (slug: string | null) => (slug ? ministries.find((m) => m.slug === slug)?.name : undefined);
  const filtered = ministry ? upcoming.filter((e) => e.ministrySlug === ministry) : upcoming;
  const usedMinistries = ministries
    .map((m) => ({ ...m, count: upcoming.filter((e) => e.ministrySlug === m.slug).length }))
    .filter((m) => m.count > 0);

  // Feature the next event people can still act on; the rest are grouped by month.
  const featured = filtered.find((e) => e.availability !== "cancelled");
  const rest = filtered.filter((e) => e !== featured);

  const chip = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200",
      active ? "border-brand-600 bg-brand-600 text-white shadow-[0_8px_20px_-10px_rgb(31_63_174/0.7)]" : "border-line bg-white text-ink hover:border-brand-300 hover:bg-brand-50",
    );

  return (
    <>
      <PageHero eyebrow="Events" title="What's happening at The Ark" lead="Youth nights, camps, special Sundays, outreach and more — find something for the whole family and register online in under a minute." />
      <Section className="pt-10 sm:pt-12">
        {usedMinistries.length > 0 && (
          <nav aria-label="Filter events by ministry" className="no-scrollbar -mx-4 mb-10 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href="/events" scroll={false} className={chip(!ministry)} aria-current={!ministry ? "page" : undefined}>
              All <span className="opacity-70">{upcoming.length}</span>
            </Link>
            {usedMinistries.map((m) => (
              <Link key={m.slug} href={`/events?ministry=${m.slug}`} scroll={false} className={chip(ministry === m.slug)} aria-current={ministry === m.slug ? "page" : undefined}>
                {m.name} <span className="opacity-70">{m.count}</span>
              </Link>
            ))}
          </nav>
        )}

        {featured ? (
          <>
            <p className="eyebrow mb-4">Up next</p>
            <EventCard event={featured} tag={ministryName(featured.ministrySlug)} featured />
            {groupByMonth(rest).map((g) => (
              <div key={g.month} className="mt-14">
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="text-xl font-semibold sm:text-2xl">{g.month}</h2>
                  <span className="h-px flex-1 bg-line" />
                  <span className="text-sm text-muted">{g.events.length} event{g.events.length === 1 ? "" : "s"}</span>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {g.events.map((e) => <EventCard key={e.id} event={e} tag={ministryName(e.ministrySlug)} />)}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="card mx-auto max-w-xl p-10 text-center">
            <h2 className="text-xl font-semibold">{ministry ? "No upcoming events for this ministry" : "No upcoming events right now"}</h2>
            <p className="mt-2 text-muted">New events are announced on Sundays and on our Instagram. Meanwhile, join us at a Sunday service!</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {ministry && <Link href="/events" className="btn-outline">See all events</Link>}
              <Link href="/services" className="btn-primary">Service times</Link>
            </div>
          </div>
        )}
      </Section>
      {past.length > 0 && (
        <Section tone="surface">
          <h2 className="mb-8 text-2xl font-semibold">Recent events</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e) => <EventCard key={e.id} event={e} tag={ministryName(e.ministrySlug)} />)}
          </div>
        </Section>
      )}
    </>
  );
}
