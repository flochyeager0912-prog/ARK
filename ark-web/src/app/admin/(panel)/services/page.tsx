import Link from "next/link";
import { db } from "@/server/db";
import { describeSchedule, describeTimeRange } from "@/lib/time";
import { AdminHeader, Notice, Panel, td, th } from "@/components/admin/ui";

export const metadata = { title: "Service timings" };

const CAT: Record<string, string> = { SUNDAY: "Sunday services", FELLOWSHIP: "Language fellowships", CHILDREN: "Children & youth", MONTHLY: "Monthly gatherings" };

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const services = await db.service.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  return (
    <>
      {saved && <Notice>Saved. The website has been updated.</Notice>}
      <AdminHeader title="Service timings" description="These times appear on the home page, Services page, ministry pages and in Google search results." actions={<Link href="/admin/services/new" className="btn-primary">Add service</Link>} />
      <div className="space-y-6">
        {Object.entries(CAT).map(([key, label]) => (
          <Panel key={key} title={label}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="border-b border-line"><tr><th className={th}>Name</th><th className={th}>When</th><th className={th}>Time</th><th className={th}>Visible</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {services.filter((s) => s.category === key).map((s) => (
                    <tr key={s.id} className="hover:bg-surface">
                      <td className={td}><Link href={`/admin/services/${s.id}`} className="font-medium hover:text-brand-600">{s.name}</Link>{s.livestream && <span className="ml-2 text-xs text-red-600">● live</span>}</td>
                      <td className={td}>{describeSchedule(s)}</td>
                      <td className={td}>{describeTimeRange(s)}</td>
                      <td className={td}>{s.active ? "Yes" : <span className="text-muted">Hidden</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
