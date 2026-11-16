import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { AdminHeader } from "@/components/admin/ui";
import { EventForm } from "@/components/admin/event-form";
import { getMinistries } from "@/server/content";

export const metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id } }).catch(() => null);
  if (!event) notFound();
  return (
    <>
      <AdminHeader title={`Edit: ${event.title}`} back={{ href: `/admin/events/${event.id}`, label: "Back to event" }} />
      <EventForm event={event} ministries={(await getMinistries()).map((m) => ({ slug: m.slug, name: m.name }))} />
    </>
  );
}
