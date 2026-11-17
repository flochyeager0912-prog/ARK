import type { Metadata } from "next";
import Link from "next/link";
import { getPastEvents, getUpcomingEvents, type PublicEvent } from "@/server/queries";
import { PageHero, Section, SectionHeading } from "@/components/ui/section";
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
      active ? "border-glow-blue/50 bg-glow-blue/10 text-white" : "border-line bg-white/[0.02] text-muted hover:border-white/25 hover:text-white",
    );

  return (
    <>
      <PageHero eyebrow="Events" title="What's happening at The Ark" lead="Youth nights, camps, special Sundays, outreach and more — find something for the whole family and register online in under a minute." crumbs={[{ href: "/events", label: "Events" }]} />
      <Section>
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
            <p className="eyebrow mb-5">Up next</p>
            <EventCard event={featured} tag={ministryName(featured.ministrySlug)} featured />
            {groupByMonth(rest).map((g) => (
              <div key={g.month} className="mt-14">
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="font-display text-2xl font-medium text-white sm:text-3xl">{g.month}</h2>
                  <span className="h-px flex-1 bg-line" />
                  <span className="chip">{g.events.length} event{g.events.length === 1 ? "" : "s"}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.events.map((e) => <EventCard key={e.id} event={e} tag={ministryName(e.ministrySlug)} />)}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="tile mx-auto max-w-xl p-10 text-center">
            <h2 className="text-xl font-semibold text-white">{ministry ? "No upcoming events for this ministry" : "No upcoming events right now"}</h2>
            <p className="mt-2 text-muted">New events are announced on Sundays and on our Instagram. Meanwhile, join us at a Sunday service!</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {ministry && <Link href="/events" className="btn-outline">See all events</Link>}
              <Link href="/services" className="btn-primary">Service times</Link>
            </div>
          </div>
        )}
      </Section>
      {past.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Looking back" title="Recent events" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((e) => <EventCard key={e.id} event={e} tag={ministryName(e.ministrySlug)} />)}
          </div>
        </Section>
      )}
    </>
  );
}
