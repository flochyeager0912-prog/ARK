import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { logoutAction } from "@/server/actions/admin";
import { db } from "@/server/db";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Ark Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [newEnquiries, newVolunteers] = await Promise.all([
    db.enquiry.count({ where: { status: "NEW" } }),
    db.volunteerApplication.count({ where: { status: "SUBMITTED" } }),
  ]);
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-navy-950 text-white lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between px-5 py-4 lg:block lg:py-6">
          <Link href="/admin" className="font-display text-lg font-semibold">The Ark · Admin</Link>
          <p className="hidden text-xs text-white/50 lg:mt-1 lg:block">Version 1 · public website</p>
        </div>
        <AdminNav isAdmin={admin.role === "ADMIN"} badges={{ enquiries: newEnquiries, volunteers: newVolunteers }} />
        <div className="hidden border-t border-white/10 px-5 py-4 text-sm lg:absolute lg:bottom-0 lg:block lg:w-full">
          <p className="truncate font-medium">{admin.name}</p>
          <p className="truncate text-xs text-white/50">{admin.email} · {admin.role}</p>
          <div className="mt-3 flex gap-3 text-xs">
            <Link href="/admin/account" className="text-white/70 hover:text-white">Account</Link>
            <Link href="/" className="text-white/70 hover:text-white" target="_blank">View site ↗</Link>
            <form action={logoutAction}><button className="text-white/70 hover:text-white">Sign out</button></form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-end gap-4 border-b border-line bg-white px-4 py-2 text-sm lg:hidden">
          <Link href="/admin/account" className="text-muted">{admin.name}</Link>
          <form action={logoutAction}><button className="font-medium text-brand-600">Sign out</button></form>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
