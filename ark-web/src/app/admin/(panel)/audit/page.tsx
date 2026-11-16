import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { formatDateTime } from "@/lib/time";
import { AdminHeader, Panel, td, th } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };

export default async function AuditPage() {
  await requireAdmin("ADMIN");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { actor: { select: { name: true } } } });
  return (
    <>
      <AdminHeader title="Audit log" description="The latest 300 staff actions." />
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-line"><tr><th className={th}>When</th><th className={th}>Who</th><th className={th}>Action</th><th className={th}>Details</th></tr></thead>
            <tbody className="divide-y divide-line">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className={`${td} whitespace-nowrap`}>{formatDateTime(l.createdAt)}</td>
                  <td className={td}>{l.actor?.name ?? "—"}</td>
                  <td className={`${td} font-mono text-xs`}>{l.action}</td>
                  <td className={`${td} max-w-md truncate font-mono text-xs text-muted`}>{l.meta ? JSON.stringify(l.meta) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
