import { AdminHeader } from "@/components/admin/ui";
import { ServiceForm } from "@/components/admin/service-form";

export const metadata = { title: "Add service" };

export default function NewService() {
  return (
    <>
      <AdminHeader title="Add service" back={{ href: "/admin/services", label: "Service timings" }} />
      <ServiceForm />
    </>
  );
}
