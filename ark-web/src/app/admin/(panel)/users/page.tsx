import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { setUserActiveAction } from "@/server/actions/admin";
import { formatDateTime } from "@/lib/time";
import { AdminHeader, Notice, Panel, td, th } from "@/components/admin/ui";
import { CreateUserForm } from "@/components/admin/user-forms";

export const metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await requireAdmin("ADMIN");
  const { error } = await searchParams;
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <>
      {error === "self" && <Notice tone="red">You can&apos;t deactivate your own account.</Notice>}
      <AdminHeader title="Staff users" description="People who can sign in to this admin area." />
      <Panel className="mb-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-line"><tr><th className={th}>Name</th><th className={th}>Role</th><th className={th}>Last sign-in</th><th className={th}>Status</th><th className={th}></th></tr></thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className={td}><p className="font-medium">{u.name}</p><p className="text-xs text-muted">{u.email}</p></td>
                  <td className={td}>{u.role}</td>
                  <td className={td}>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}</td>
                  <td className={td}>{u.active ? "Active" : <span className="text-red-600">Deactivated</span>}</td>
                  <td className={`${td} text-right`}>
                    {u.id !== me.id && (
                      <form action={setUserActiveAction.bind(null, u.id, !u.active)}>
                        <button className="btn-outline px-3 py-1.5 text-xs">{u.active ? "Deactivate" : "Reactivate"}</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel title="Add a user"><div className="p-5"><CreateUserForm /></div></Panel>
    </>
  );
}
