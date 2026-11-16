import { requireAdmin } from "@/server/auth";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { ChangePasswordForm } from "@/components/admin/user-forms";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const me = await requireAdmin();
  return (
    <>
      <AdminHeader title="My account" description={`${me.name} · ${me.email} · ${me.role}`} />
      <Panel title="Change password"><div className="p-5"><ChangePasswordForm /></div></Panel>
    </>
  );
}
