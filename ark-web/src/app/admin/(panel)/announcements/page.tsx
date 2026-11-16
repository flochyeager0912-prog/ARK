import Link from "next/link";
import { db } from "@/server/db";
import { formatDateTime } from "@/lib/time";
import { AdminHeader, Empty, Notice, Panel, td, th } from "@/components/admin/ui";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const items = await db.announcement.findMany({ orderBy: { startsAt: "desc" }, take: 100 });
  const now = new Date();
  return (
    <>
      {saved && <Notice>Saved.</Notice>}
      <AdminHeader title="Announcements" description="Short notices shown in a banner on the home page (up to 3 at a time)." actions={<Link href="/admin/announcements/new" className="btn-primary">New announcement</Link>} />
      <Panel>
        {items.length === 0 ? <Empty>No announcements yet.</Empty> : (
          <table className="w-full">
            <thead className="border-b border-line"><tr><th className={th}>Title</th><th className={th}>Showing</th><th className={th}>Window</th></tr></thead>
            <tbody className="divide-y divide-line">
              {items.map((a) => {
                const live = a.active && a.startsAt <= now && (!a.endsAt || a.endsAt > now);
                return (
                  <tr key={a.id} className="hover:bg-surface">
                    <td className={td}><Link href={`/admin/announcements/${a.id}`} className="font-medium hover:text-brand-600">{a.title}</Link></td>
                    <td className={td}>{live ? <span className="badge bg-emerald-100 text-emerald-800">live</span> : <span className="badge bg-slate-100 text-slate-600">not showing</span>}</td>
                    <td className={td}>{formatDateTime(a.startsAt)}{a.endsAt ? ` → ${formatDateTime(a.endsAt)}` : " → no end"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
