import Link from "next/link";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { duplicateEventAction, setEventPublishedAction } from "@/server/actions/admin";
import { getMinistries } from "@/server/content";
import { formatDateTime, relativeDay } from "@/lib/time";
import { cn } from "@/lib/utils";
import { AdminHeader, Empty, Panel, StatusBadge } from "@/components/admin/ui";
import { PendingButton } from "@/components/admin/pending-button";

export const metadata = { title: "Events" };

type Show = "upcoming" | "past" | "drafts";

export default async function AdminEvents({ searchParams }: { searchParams: Promise<{ show?: string; q?: string }> }) {
  const params = await searchParams;
  const show: Show = params.show === "past" || params.show === "drafts" ? params.show : "upcoming";
  const q = params.q?.trim();
  const now = new Date();

  const scopes: Record<Show, Prisma.EventWhereInput> = {
    upcoming: { startsAt: { gte: now }, status: { not: "DRAFT" } },
    past: { startsAt: { lt: now } },
    drafts: { status: "DRAFT", startsAt: { gte: now } },
  };
  const search: Prisma.EventWhereInput = q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { venue: { contains: q, mode: "insensitive" } }] } : {};

  const [events, counts, ministries] = await Promise.all([
    db.event.findMany({ where: { ...scopes[show], ...search }, orderBy: { startsAt: show === "past" ? "desc" : "asc" }, take: 200 }),
    Promise.all((Object.keys(scopes) as Show[]).map(async (k) => [k, await db.event.count({ where: scopes[k] })] as const)),
    getMinistries(),
  ]);
  const count = Object.fromEntries(counts) as Record<Show, number>;
  const seats = await db.registration.groupBy({
    by: ["eventId", "status"],
    where: { eventId: { in: events.map((e) => e.id) }, status: { in: ["CONFIRMED", "WAITLISTED"] } },
    _sum: { seats: true },
  });
  const seatMap = (id: string, st: string) => seats.find((s) => s.eventId === id && s.status === st)?._sum.seats ?? 0;
  const ministryName = (slug: string | null) => (slug ? ministries.find((m) => m.slug === slug)?.name : null);

  const tabs: { key: Show; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "drafts", label: "Drafts" },
    { key: "past", label: "Past" },
  ];

  return (
    <>
      <AdminHeader
        title="Events & registrations"
        description="Published events appear on the public site instantly. Drafts stay hidden until you publish them."
        actions={<Link href="/admin/events/new" className="btn-primary">+ New event</Link>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-full border border-line bg-white p-1 text-sm">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.key === "upcoming" ? "/admin/events" : `/admin/events?show=${t.key}`}
              className={cn("rounded-full px-4 py-1.5 font-semibold transition-colors", show === t.key ? "bg-navy-900 text-white" : "text-muted hover:text-ink")}
            >
              {t.label} <span className="opacity-60">{count[t.key]}</span>
            </Link>
          ))}
        </div>
        <form role="search" className="flex gap-2">
          {show !== "upcoming" && <input type="hidden" name="show" value={show} />}
          <input name="q" defaultValue={q} placeholder="Search title or venue…" aria-label="Search events" className="field w-full py-2 sm:w-64" />
          <button className="btn-outline py-2">Search</button>
        </form>
      </div>

      <Panel>
        {events.length === 0 ? (
          <Empty>
            {q ? <>No events match “{q}”.</> : <>No {show === "drafts" ? "draft" : show} events.</>}{" "}
            {show !== "past" && <Link href="/admin/events/new" className="font-semibold text-brand-600 hover:underline">Create one →</Link>}
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {events.map((e) => {
              const confirmed = seatMap(e.id, "CONFIRMED");
              const waitlisted = seatMap(e.id, "WAITLISTED");
              const pct = e.capacity ? Math.min(100, Math.round((confirmed / e.capacity) * 100)) : null;
              const soon = relativeDay(e.startsAt);
              return (
                <li key={e.id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-surface/70 sm:flex-row sm:items-center">
                  <Link href={`/admin/events/${e.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-navy-900">
                      {e.imageUrl ? <Image src={e.imageUrl} alt="" fill sizes="96px" className="object-cover" /> : <div className="hero-bg absolute inset-0" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold hover:text-brand-600">{e.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {formatDateTime(e.startsAt)}{soon && show !== "past" ? ` · ${soon}` : ""}{ministryName(e.ministrySlug) ? ` · ${ministryName(e.ministrySlug)}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={e.status} />
                        {e.status === "PUBLISHED" && show !== "past" && <span className="badge bg-emerald-50 text-emerald-700">● Live on site</span>}
                        {!e.registrationEnabled && <span className="badge bg-slate-100 text-slate-600">No registration</span>}
                      </div>
                    </div>
                  </Link>

                  {e.registrationEnabled && (
                    <div className="w-full shrink-0 sm:w-44">
                      <p className="text-xs text-muted">
                        <span className="font-semibold text-ink">{confirmed}</span>{e.capacity ? ` / ${e.capacity}` : ""} booked
                        {waitlisted > 0 && <span className="text-amber-700"> · {waitlisted} waitlist</span>}
                      </p>
                      {pct !== null && (
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                          <div className={cn("h-full rounded-full", pct >= 100 ? "bg-amber-500" : "bg-brand-500")} style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {e.status !== "CANCELLED" && show !== "past" && (
                      <form action={setEventPublishedAction.bind(null, e.id, e.status !== "PUBLISHED")}>
                        <PendingButton className={cn("btn px-3 py-1.5 text-xs", e.status === "PUBLISHED" ? "border border-line bg-white hover:bg-surface" : "bg-emerald-600 text-white hover:bg-emerald-700")}>
                          {e.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </PendingButton>
                      </form>
                    )}
                    <Link href={`/admin/events/${e.id}/edit`} className="btn-outline px-3 py-1.5 text-xs">Edit</Link>
                    <form action={duplicateEventAction.bind(null, e.id)}>
                      <PendingButton className="btn-outline px-3 py-1.5 text-xs" title="Copy as a new draft">Duplicate</PendingButton>
                    </form>
                    {e.status !== "DRAFT" && <Link href={`/events/${e.slug}`} target="_blank" className="btn px-3 py-1.5 text-xs text-brand-600 hover:bg-brand-50">View ↗</Link>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
