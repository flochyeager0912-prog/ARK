import Link from "next/link";
import { db } from "@/server/db";
import { SECTION_KEYS, SECTION_META } from "@/content/sections";
import { formatDateTime } from "@/lib/time";
import { AdminHeader } from "@/components/admin/ui";

export const metadata = { title: "Page content" };

export default async function ContentIndex() {
  const rows = await db.contentBlock.findMany({ select: { key: true, updatedAt: true, updatedById: true } });
  const users = await db.adminUser.findMany({ where: { id: { in: rows.map((r) => r.updatedById).filter((x): x is string => !!x) } }, select: { id: true, name: true } });
  const nameOf = (id: string | null) => users.find((u) => u.id === id)?.name;
  return (
    <>
      <AdminHeader
        title="Page content"
        description="Edit the text and photos on the website. Changes go live as soon as you save, and every save is kept in the history so it can be undone."
        actions={<Link href="/admin/media" className="btn-outline">Photo library</Link>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {SECTION_KEYS.map((key) => {
          const meta = SECTION_META[key];
          const row = rows.find((r) => r.key === key);
          return (
            <Link key={key} href={`/admin/content/${key}`} className="group rounded-2xl border border-line bg-white p-5 transition hover:border-brand-300 hover:shadow-card">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold group-hover:text-brand-600">{meta.title}</h2>
                {row ? <span className="badge bg-brand-100 text-brand-800">edited</span> : <span className="badge bg-slate-100 text-slate-600">original</span>}
              </div>
              <p className="mt-1.5 text-sm text-muted">{meta.description}</p>
              {row && <p className="mt-3 text-xs text-muted">Last saved {formatDateTime(row.updatedAt)}{nameOf(row.updatedById) ? ` by ${nameOf(row.updatedById)}` : ""}</p>}
            </Link>
          );
        })}
      </div>
    </>
  );
}
