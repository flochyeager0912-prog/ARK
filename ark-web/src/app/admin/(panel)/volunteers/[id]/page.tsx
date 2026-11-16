import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { deleteVolunteerAction } from "@/server/actions/admin";
import { formatDateTime } from "@/lib/time";
import { AdminHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { VolunteerStatusForm } from "@/components/admin/status-forms";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata = { title: "Volunteer application" };

const CHILD_TEAMS = ["Victory Kids (children)", "Tweens", "Ark Arise (youth)", "Rakshak"];

export default async function VolunteerPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const a = await db.volunteerApplication.findUnique({ where: { id } }).catch(() => null);
  if (!a) notFound();
  const childFacing = a.teams.some((t) => CHILD_TEAMS.includes(t));
  const row = (label: string, value: React.ReactNode) => (
    <div><dt className="text-muted">{label}</dt><dd className="font-medium">{value || "—"}</dd></div>
  );
  return (
    <>
      <AdminHeader back={{ href: "/admin/volunteers", label: "Volunteers" }} title={a.name} description={`Applied ${formatDateTime(a.createdAt)}`} />
      {childFacing && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ This applicant chose a team that works with children or youth. Follow the church&apos;s child-safety screening (reference check, ID and a conversation) before approving.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Application">
          <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
            {row("Status", <StatusBadge status={a.status} />)}
            {row("Phone", <a href={`tel:${a.phone}`} className="text-brand-600 hover:underline">{a.phone}</a>)}
            {row("Email", <a href={`mailto:${a.email}`} className="text-brand-600 hover:underline">{a.email}</a>)}
            {row("Attending The Ark", a.attendingSince)}
            <div className="sm:col-span-2">{row("Teams", a.teams.join(", "))}</div>
            <div className="sm:col-span-2">{row("Availability", a.availability.join(", "))}</div>
            <div className="sm:col-span-2">{row("Skills / experience", <span className="whitespace-pre-wrap font-normal">{a.experience}</span>)}</div>
            <div className="sm:col-span-2">{row("Message", <span className="whitespace-pre-wrap font-normal">{a.message}</span>)}</div>
          </dl>
        </Panel>
        <div className="space-y-6">
          <Panel title="Decision"><div className="p-5"><VolunteerStatusForm id={a.id} status={a.status} notes={a.adminNotes ?? ""} /></div></Panel>
          {admin.role === "ADMIN" && (
            <div className="rounded-2xl border border-red-200 bg-white p-5">
              <p className="text-sm text-muted">Delete permanently (e.g. on a data-erasure request).</p>
              <form action={deleteVolunteerAction.bind(null, a.id)} className="mt-3">
                <ConfirmButton message="Permanently delete this application?" className="btn-danger py-2">Delete</ConfirmButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
