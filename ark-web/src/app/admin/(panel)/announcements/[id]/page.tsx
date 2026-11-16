import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { deleteAnnouncementAction } from "@/server/actions/admin";
import { AdminHeader } from "@/components/admin/ui";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { ConfirmButton } from "@/components/admin/confirm-button";

export const metadata = { title: "Edit announcement" };

export default async function EditAnnouncement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await db.announcement.findUnique({ where: { id } }).catch(() => null);
  if (!a) notFound();
  return (
    <>
      <AdminHeader title="Edit announcement" back={{ href: "/admin/announcements", label: "Announcements" }} />
      <AnnouncementForm a={a} />
      <form action={deleteAnnouncementAction.bind(null, a.id)} className="mt-8">
        <ConfirmButton message="Delete this announcement?" className="btn-danger py-2">Delete</ConfirmButton>
      </form>
    </>
  );
}
