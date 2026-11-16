import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getSection, sectionShape } from "@/server/content";
import { isSectionKey, SECTION_META } from "@/content/sections";
import { AdminHeader } from "@/components/admin/ui";
import { ContentEditor } from "@/components/admin/content/content-editor";
import { RevisionList } from "@/components/admin/content/revision-list";

export const metadata = { title: "Edit content" };

export default async function EditContentPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isSectionKey(key)) notFound();
  const meta = SECTION_META[key];
  const [value, row, revisions] = await Promise.all([
    getSection(key),
    db.contentBlock.findUnique({ where: { key }, select: { key: true } }),
    db.contentRevision.findMany({ where: { key }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, createdAt: true, createdByName: true, note: true } }),
  ]);

  return (
    <>
      <AdminHeader back={{ href: "/admin/content", label: "Page content" }} title={meta.title} description={meta.description} />
      <div className="grid gap-8 xl:grid-cols-[1fr_260px]">
        <ContentEditor sectionKey={key} shape={sectionShape(key)} initial={value} viewHref={meta.pages[0] ?? "/"} isCustomised={!!row} />
        <aside className="xl:sticky xl:top-8 xl:self-start">
          <RevisionList revisions={revisions.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />
        </aside>
      </div>
    </>
  );
}
