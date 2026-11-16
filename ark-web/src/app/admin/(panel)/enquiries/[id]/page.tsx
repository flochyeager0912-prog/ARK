import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth";
import { purposeLabel } from "@/server/enquiries";
import { deleteEnquiryAction } from "@/server/actions/admin";
import { audit } from "@/server/audit";
import { formatDateTime } from "@/lib/time";
import { AdminHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { EnquiryStatusForm } from "@/components/admin/status-forms";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { getMinistry } from "@/server/content";

export const metadata = { title: "Enquiry" };

export default async function EnquiryPage({ params }: { params: Promise<{ id: string }> }) {

  const admin = await requireAdmin();
  const { id } = await params;
  const q = await db.enquiry.findUnique({ where: { id } }).catch(() => null);
  if (!q) notFound();
  if (q.isPrayerRequest) await audit(admin.id, "enquiry.view_prayer", "enquiry", id);
  const [purpose, ministrySlug] = q.purpose.split(":");
  const ministry = ministrySlug ? await getMinistry(ministrySlug) : undefined;

  return (
    <>
      <AdminHeader back={{ href: "/admin/enquiries", label: "Enquiries" }} title={`${q.isPrayerRequest ? "🙏 Prayer request" : purposeLabel(purpose!)} from ${q.name}`} description={`Received ${formatDateTime(q.createdAt)}`} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Message">
          <div className="space-y-4 p-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted">Name</dt><dd className="font-medium">{q.name}</dd></div>
              <div><dt className="text-muted">Status</dt><dd><StatusBadge status={q.status} /></dd></div>
              <div><dt className="text-muted">Email</dt><dd><a className="font-medium text-brand-600 hover:underline" href={`mailto:${q.email}`}>{q.email}</a></dd></div>
              <div><dt className="text-muted">Phone</dt><dd>{q.phone ? <a className="font-medium text-brand-600 hover:underline" href={`tel:${q.phone}`}>{q.phone}</a> : "—"}</dd></div>
              <div><dt className="text-muted">Topic</dt><dd className="font-medium">{purposeLabel(purpose!)}{ministry ? ` — ${ministry.name}` : ""}</dd></div>
              {q.isPrayerRequest && <div><dt className="text-muted">May we contact them?</dt><dd className="font-medium">{q.contactOk ? "Yes" : "No — please don't contact"}</dd></div>}
            </dl>
            <div className="whitespace-pre-wrap rounded-xl bg-surface p-4 text-sm leading-relaxed">{q.message}</div>
          </div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Follow-up"><div className="p-5"><EnquiryStatusForm id={q.id} status={q.status} notes={q.adminNotes ?? ""} /></div></Panel>
          {admin.role === "ADMIN" && (
            <div className="rounded-2xl border border-red-200 bg-white p-5">
              <p className="text-sm text-muted">Delete permanently (e.g. on a data-erasure request).</p>
              <form action={deleteEnquiryAction.bind(null, q.id)} className="mt-3">
                <ConfirmButton message="Permanently delete this enquiry?" className="btn-danger py-2">Delete</ConfirmButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
