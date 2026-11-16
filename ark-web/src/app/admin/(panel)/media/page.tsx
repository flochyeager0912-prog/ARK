import { listMedia } from "@/server/media";
import { AdminHeader } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/content/media-library";

export const metadata = { title: "Photo library" };

export default async function MediaPage() {
  const items = await listMedia(500);
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/content", label: "Page content" }}
        title="Photo library"
        description="Upload photos to use on pages and events. They are resized automatically and location data is removed."
      />
      <MediaLibrary initial={items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))} />
    </>
  );
}
