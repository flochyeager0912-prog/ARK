import { AdminHeader } from "@/components/admin/ui";
import { AnnouncementForm } from "@/components/admin/announcement-form";

export const metadata = { title: "New announcement" };

export default function NewAnnouncement() {
  return (
    <>
      <AdminHeader title="New announcement" back={{ href: "/admin/announcements", label: "Announcements" }} />
      <AnnouncementForm />
    </>
  );
}
