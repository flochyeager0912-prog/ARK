import { AdminHeader } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/event-form";
import { getMinistries } from "@/server/content";

export const metadata = { title: "New event" };

export default async function NewEventPage() {
  return (
    <>
      <AdminHeader title="New event" back={{ href: "/admin/events", label: "Events" }} />
      <EventForm ministries={(await getMinistries()).map((m) => ({ slug: m.slug, name: m.name }))} />
    </>
  );
}
