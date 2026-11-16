import Link from "next/link";
import { db } from "@/server/db";
import { confirmedSeats } from "@/server/registrations";
import { formatDateTime } from "@/lib/time";
import { purposeLabel } from "@/server/enquiries";
import { AdminHeader, Empty, Notice, Panel, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function Dashboard({ searchParams }: Props) {
  const { error } = await searchParams;
  const now = new Date();
  const [events, enquiries, volunteers, counts] = await Promise.all([
    db.event.findMany({ where: { status: "PUBLISHED", startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 5 }),
    db.enquiry.findMany({ where: { status: { not: "RESOLVED" } }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.volunteerApplication.findMany({ where: { status: { in: ["SUBMITTED", "ON_HOLD"] } }, orderBy: { createdAt: "desc" }, take: 6 }),
    Promise.all([
      db.registration.count({ where: { status: "CONFIRMED", event: { startsAt: { gte: now } } } }),
      db.enquiry.count({ where: { status: "NEW" } }),
      db.volunteerApplication.count({ where: { status: "SUBMITTED" } }),
      db.event.count({ where: { status: "PUBLISHED", startsAt: { gte: now } } }),
    ]),
  ]);
  const seats = await Promise.all(events.map((e) => confirmedSeats(e.id)));
  const [regs, newEnq, newVol, upcoming] = counts;
  const stats = [
    { label: "Upcoming events", value: upcoming, href: "/admin/events" },
    { label: "Active registrations", value: regs, href: "/admin/events" },
    { label: "New enquiries", value: newEnq, href: "/admin/enquiries" },
    { label: "New volunteer applications", value: newVol, href: "/admin/volunteers" },
  ];

  return (
    <>
      {error === "forbidden" && <Notice tone="red">You don&apos;t have permission to view that page.</Notice>}
      <AdminHeader title="Dashboard" description="An overview of what needs attention." actions={<Link href="/admin/events/new" className="btn-primary">New event</Link>} />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-line bg-white p-5 hover:border-brand-300">
            <p className="font-display text-3xl font-semibold">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Upcoming events" className="lg:col-span-2">
          {events.length === 0 ? (
            <Empty>No upcoming published events. <Link href="/admin/events/new" className="text-brand-600 underline">Create one</Link>.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {events.map((e, i) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <Link href={`/admin/events/${e.id}`} className="font-medium hover:text-brand-600">{e.title}</Link>
                    <p className="text-xs text-muted">{formatDateTime(e.startsAt)}</p>
                  </div>
                  <p className="text-sm">
                    <strong>{seats[i]}</strong>
                    <span className="text-muted">{e.capacity ? ` / ${e.capacity} seats` : " seats booked"}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Open enquiries">
          {enquiries.length === 0 ? <Empty>All caught up 🎉</Empty> : (
            <ul className="divide-y divide-line">
              {enquiries.map((q) => (
                <li key={q.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/enquiries/${q.id}`} className="font-medium hover:text-brand-600">{q.name}</Link>
                    <p className="truncate text-xs text-muted">{purposeLabel(q.purpose.split(":")[0]!)} · {formatDateTime(q.createdAt)}</p>
                  </div>
                  <StatusBadge status={q.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Volunteer applications to review">
          {volunteers.length === 0 ? <Empty>No pending applications.</Empty> : (
            <ul className="divide-y divide-line">
              {volunteers.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/volunteers/${v.id}`} className="font-medium hover:text-brand-600">{v.name}</Link>
                    <p className="truncate text-xs text-muted">{v.teams.join(", ")}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
