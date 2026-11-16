import "server-only";
import { cache } from "react";
import type { Event } from "@prisma/client";
import { db } from "./db";
import { confirmedSeats } from "./registrations";
import { nextOccurrence } from "@/lib/time";
import { availabilityOf, type EventAvailability } from "@/lib/events";

export type PublicEvent = Event & { availability: EventAvailability };

/** Active services, ordered for display. */
export const getServices = cache(async () =>
  db.service.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
);

/** The next upcoming service (by start time) across all active services with a time. */
export async function getNextService(now = new Date()) {
  const services = await getServices();
  let best: { service: (typeof services)[number]; at: Date } | null = null;
  for (const s of services) {
    if (s.category === "CHILDREN") continue;
    const at = nextOccurrence(s, now);
    if (at && (!best || at < best.at)) best = { service: s, at };
  }
  return best;
}

/** Attach a public availability label (never a seat count) to each event in one query. */
async function withAvailability(events: Event[]): Promise<PublicEvent[]> {
  const limited = events.filter((e) => e.capacity != null).map((e) => e.id);
  const sums = limited.length
    ? await db.registration.groupBy({ by: ["eventId"], where: { eventId: { in: limited }, status: "CONFIRMED" }, _sum: { seats: true } })
    : [];
  const taken = new Map(sums.map((s) => [s.eventId, s._sum.seats ?? 0]));
  const now = new Date();
  return events.map((e) => ({ ...e, availability: availabilityOf(e, taken.get(e.id) ?? 0, now) }));
}

// An event without an end time counts as "upcoming" until 6 hours after it starts.
const OPEN_ENDED_MS = 6 * 3600_000;

export const getUpcomingEvents = cache(async (limit = 50) => {
  const now = new Date();
  const events = await db.event.findMany({
    where: {
      status: { in: ["PUBLISHED", "CANCELLED"] },
      OR: [{ endsAt: { gte: now } }, { endsAt: null, startsAt: { gte: new Date(now.getTime() - OPEN_ENDED_MS) } }],
    },
    orderBy: { startsAt: "asc" },
    take: limit,
  });
  return withAvailability(events);
});

export const getPastEvents = cache(async (limit = 12) => {
  const now = new Date();
  const events = await db.event.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ endsAt: { lt: now } }, { endsAt: null, startsAt: { lt: new Date(now.getTime() - OPEN_ENDED_MS) } }],
    },
    orderBy: { startsAt: "desc" },
    take: limit,
  });
  return withAvailability(events);
});

export const getPublicEvent = cache(async (slug: string) => {
  const event = await db.event.findUnique({ where: { slug } });
  if (!event || event.status === "DRAFT") return null;
  const taken = event.capacity == null ? 0 : await confirmedSeats(event.id);
  return { event, availability: availabilityOf(event, taken) };
});

export const getActiveAnnouncements = cache(async () => {
  const now = new Date();
  return db.announcement.findMany({
    where: { active: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    orderBy: { startsAt: "desc" },
    take: 3,
  });
});
