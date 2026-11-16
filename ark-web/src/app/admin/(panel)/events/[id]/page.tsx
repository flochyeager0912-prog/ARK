import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { deleteEventAction } from "@/server/actions/admin";
import { formatDateTime, formatEventWhen } from "@/lib/time";
import { AdminHeader, Notice, Panel, StatusBadge } from "@/components/admin/ui";
import { CheckInBox, RegistrationRowActions } from "@/components/admin/registration-controls";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { getMinistry } from "@/server/content";

export const metadata = { title: "Event" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string; q?: string; status?: string }> };

export default async function AdminEventPage({ params, searchParams }: Props) {

  const { id } = await params;
  const { saved, error, q, status } = await searchParams;
  const event = await db.event.findUnique({ where: { id } }).catch(() => null);
  if (!event) notFound();

  const search = q?.trim();
  const statusFilter = status === "CONFIRMED" || status === "WAITLISTED" || status === "CANCELLED" ? status : undefined;
  const [registrations, agg] = await Promise.all([
    db.registration.findMany({
      where: {
        eventId: id,
        status: statusFilter,
        ...(search
          ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }, { refCode: { contains: search.toUpperCase() } }] }
          : {}),
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      take: 1000,
    }),
    db.registration.groupBy({ by: ["status"], where: { eventId: id }, _sum: { seats: true }, _count: true }),
  ]);
  const sum = (s: string) => agg.find((a) => a.status === s)?._sum.seats ?? 0;
  const checkedIn = await db.registration.aggregate({ where: { eventId: id, status: "CONFIRMED", checkedInAt: { not: null } }, _sum: { seats: true } });
  const confirmed = sum("CONFIRMED");
  const ministry = event.ministrySlug ? await getMinistry(event.ministrySlug) : undefined;

  return (
    <>
      {saved && (
        <Notice>
          {event.status === "DRAFT" ? (
            <>Event saved as a draft — it is hidden from the public site until you publish it.</>
          ) : (
            <>Event saved — the public site is updated. <Link href={`/events/${event.slug}`} target="_blank" className="font-semibold underline">See it live ↗</Link></>
          )}
        </Notice>
      )}
      {error === "has-registrations" && <Notice tone="red">This event has registrations, so it can&apos;t be deleted. Set its status to Cancelled instead.</Notice>}
      <AdminHeader
        back={{ href: "/admin/events", label: "Events" }}
        title={event.title}
        description={<>{formatEventWhen(event.startsAt, event.endsAt)} · {event.venue}{ministry ? ` · ${ministry.name}` : ""}</>}
        actions={
          <>
            {event.status !== "DRAFT" && <Link href={`/events/${event.slug}`} target="_blank" className="btn-outline">View public page ↗</Link>}
            <Link href={`/admin/events/${event.id}/edit`} className="btn-primary">Edit event</Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4"><p className="text-xs text-muted">Status</p><div className="mt-1"><StatusBadge status={event.status} /></div></div>
        <div className="rounded-2xl border border-line bg-white p-4"><p className="text-xs text-muted">Confirmed seats</p><p className="font-display text-2xl font-semibold">{confirmed}{event.capacity ? <span className="text-base text-muted"> / {event.capacity}</span> : null}</p></div>
        <div className="rounded-2xl border border-line bg-white p-4"><p className="text-xs text-muted">Waitlisted seats</p><p className="font-display text-2xl font-semibold">{sum("WAITLISTED")}</p></div>
        <div className="rounded-2xl border border-line bg-white p-4"><p className="text-xs text-muted">Checked in</p><p className="font-display text-2xl font-semibold">{checkedIn._sum.seats ?? 0}<span className="text-base text-muted"> / {confirmed}</span></p></div>
      </div>

      {event.status === "PUBLISHED" && (
        <Panel title="Check-in" className="mb-6">
          <div className="p-5"><CheckInBox eventId={event.id} /></div>
        </Panel>
      )}

      <Panel>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex flex-1 gap-2" role="search">
            <input name="q" defaultValue={search} placeholder="Search name, email, phone or ref…" className="field max-w-sm py-2" />
            <select name="status" defaultValue={statusFilter ?? ""} className="field w-auto py-2">
              <option value="">All</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="WAITLISTED">Waitlisted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button className="btn-outline py-2">Filter</button>
          </form>
          <a href={`/admin/events/${event.id}/export`} className="btn-outline py-2">Export CSV</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Seats</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Registered</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {registrations.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No registrations{search || statusFilter ? " match your filter" : " yet"}.</td></tr>
              )}
              {registrations.map((r) => (
                <tr key={r.id} className={r.status === "CANCELLED" ? "opacity-60" : undefined}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{r.refCode}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.name}</p>
                    {r.notes && <p className="max-w-xs text-xs text-muted">{r.notes}</p>}
                  </td>
                  <td className="px-4 py-3"><a href={`tel:${r.phone}`} className="block hover:underline">{r.phone}</a><a href={`mailto:${r.email}`} className="block text-xs text-muted hover:underline">{r.email}</a></td>
                  <td className="px-4 py-3">{r.seats}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} />{r.checkedInAt && <p className="mt-1 text-xs text-emerald-700">✓ in {formatDateTime(r.checkedInAt).split(", ").pop()}</p>}</td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right"><RegistrationRowActions id={r.id} eventId={event.id} status={r.status} checkedIn={!!r.checkedInAt} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-10 rounded-2xl border border-red-200 bg-white p-5">
        <h2 className="font-semibold text-red-700">Delete event</h2>
        <p className="mt-1 text-sm text-muted">Only events without registrations can be deleted. To call off an event with bookings, edit it and set the status to Cancelled.</p>
        <form action={deleteEventAction.bind(null, event.id)} className="mt-3">
          <ConfirmButton message="Delete this event permanently?" className="btn-danger py-2">Delete event</ConfirmButton>
        </form>
      </div>
    </>
  );
}
