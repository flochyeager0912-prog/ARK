import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { formatDateTime } from "@/lib/time";
import { AdminHeader, Empty, Panel, StatusBadge, td, th } from "@/components/admin/ui";

export const metadata = { title: "Volunteers" };

const TABS: { key: string; label: string; where: Prisma.VolunteerApplicationWhereInput }[] = [
  { key: "", label: "To review", where: { status: { in: ["SUBMITTED", "ON_HOLD"] } } },
  { key: "APPROVED", label: "Approved", where: { status: "APPROVED" } },
  { key: "DECLINED", label: "Declined", where: { status: "DECLINED" } },
];

export default async function VolunteersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const tab = TABS.find((t) => t.key === status) ?? TABS[0]!;
  const apps = await db.volunteerApplication.findMany({
    where: tab.where,
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return (
    <>
      <AdminHeader title="Volunteer applications" />
      <div className="mb-4 flex gap-2 text-sm">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/volunteers${t.key ? `?status=${t.key}` : ""}`} className={`badge px-3 py-1.5 ${t.key === tab.key ? "bg-navy-900 text-white" : "bg-white text-ink"}`}>{t.label}</Link>
        ))}
      </div>
      <Panel>
        {apps.length === 0 ? <Empty>No applications.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="border-b border-line"><tr><th className={th}>Name</th><th className={th}>Teams</th><th className={th}>Applied</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {apps.map((a) => (
                  <tr key={a.id} className="hover:bg-surface">
                    <td className={td}><Link href={`/admin/volunteers/${a.id}`} className="font-medium hover:text-brand-600">{a.name}</Link><p className="text-xs text-muted">{a.phone}</p></td>
                    <td className={td}>{a.teams.join(", ")}</td>
                    <td className={td}>{formatDateTime(a.createdAt)}</td>
                    <td className={td}><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
