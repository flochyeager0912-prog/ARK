"use client";

import { useTransition } from "react";
import { restoreRevisionAction } from "@/server/actions/content";
import { formatDateTime } from "@/lib/time";

export function RevisionList({ revisions }: { revisions: { id: string; createdAt: string; createdByName: string | null; note: string | null }[] }) {
  const [pending, start] = useTransition();
  return (
    <section className="rounded-2xl border border-line bg-white">
      <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">History</h2>
      {revisions.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">No earlier versions yet. Each time you save, the previous version is kept here.</p>
      ) : (
        <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
          {revisions.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 px-4 py-3">
              <div className="min-w-0 text-xs">
                <p className="font-medium text-ink">{formatDateTime(new Date(r.createdAt))}</p>
                <p className="truncate text-muted">{r.note ?? "Saved"}{r.createdByName ? ` · ${r.createdByName}` : ""}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                className="btn-outline shrink-0 px-3 py-1 text-xs"
                onClick={() => {
                  if (!confirm("Restore this version? The current version will be kept in the history.")) return;
                  start(async () => {
                    const res = await restoreRevisionAction(r.id);
                    if (!res.ok) alert(res.message);
                    window.location.reload();
                  });
                }}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
