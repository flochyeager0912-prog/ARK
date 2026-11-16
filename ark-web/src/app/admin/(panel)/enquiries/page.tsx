import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { purposeLabel } from "@/server/enquiries";
import { formatDateTime } from "@/lib/time";
import { AdminHeader, Empty, Panel, StatusBadge, td, th } from "@/components/admin/ui";

export const metadata = { title: "Enquiries" };

type Props = { searchParams: Promise<{ status?: string; type?: string }> };

export default async function EnquiriesPage({ searchParams }: Props) {
  const { status, type } = await searchParams;
  const where: Prisma.EnquiryWhereInput = {};
  if (status === "NEW" || status === "IN_PROGRESS" || status === "RESOLVED") where.status = status;
  else where.status = { not: "RESOLVED" };
  if (type === "prayer") where.isPrayerRequest = true;
  if (type === "general") where.isPrayerRequest = false;
  const items = await db.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 300 });

  const tab = (label: string, qs: string, active: boolean) => (
    <Link href={`/admin/enquiries${qs}`} className={`badge px-3 py-1.5 ${active ? "bg-navy-900 text-white" : "bg-white text-ink"}`}>{label}</Link>
  );

  return (
    <>
      <AdminHeader title="Enquiries & prayer requests" description="Messages from the contact form. Prayer requests are confidential." />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {tab("Open", "", !status && !type)}
        {tab("New", "?status=NEW", status === "NEW")}
        {tab("In progress", "?status=IN_PROGRESS", status === "IN_PROGRESS")}
        {tab("Resolved", "?status=RESOLVED", status === "RESOLVED")}
        {tab("Prayer requests (open)", "?type=prayer", type === "prayer")}
      </div>
      <Panel>
        {items.length === 0 ? <Empty>Nothing here.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="border-b border-line"><tr><th className={th}>From</th><th className={th}>Topic</th><th className={th}>Received</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {items.map((q) => (
                  <tr key={q.id} className="hover:bg-surface">
                    <td className={td}><Link href={`/admin/enquiries/${q.id}`} className="font-medium hover:text-brand-600">{q.name}</Link><p className="text-xs text-muted">{q.email}</p></td>
                    <td className={td}>{q.isPrayerRequest && "🙏 "}{purposeLabel(q.purpose.split(":")[0]!)}</td>
                    <td className={td}>{formatDateTime(q.createdAt)}</td>
                    <td className={td}><StatusBadge status={q.status} /></td>
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
