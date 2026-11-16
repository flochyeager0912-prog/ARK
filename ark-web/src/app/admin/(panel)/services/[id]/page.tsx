import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { deleteServiceAction } from "@/server/actions/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ServiceForm } from "@/components/admin/service-form";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata = { title: "Edit service" };

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await db.service.findUnique({ where: { id } }).catch(() => null);
  if (!service) notFound();
  return (
    <>
      <AdminHeader title={`Edit: ${service.name}`} back={{ href: "/admin/services", label: "Service timings" }} />
      <ServiceForm service={service} />
      <div className="mt-10 rounded-2xl border border-red-200 bg-white p-5">
        <p className="text-sm text-muted">Prefer unticking “Show on website” to hide a service temporarily.</p>
        <form action={deleteServiceAction.bind(null, service.id)} className="mt-3">
          <ConfirmButton message="Delete this service permanently?" className="btn-danger py-2">Delete service</ConfirmButton>
        </form>
      </div>
    </>
  );
}
