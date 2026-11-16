"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMediaAction, updateMediaAltAction } from "@/server/actions/content";
import { uploadImage } from "./image-picker";

type Item = { id: string; url: string; filename: string; width: number; height: number; sizeBytes: number; alt: string | null; createdAt: string };

export function MediaLibrary({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setMsg("");
    const added: Item[] = [];
    for (const f of Array.from(files)) {
      try {
        const it = await uploadImage(f);
        added.push({ ...it, createdAt: new Date(it.createdAt).toISOString() });
      } catch (e) {
        setMsg(`${f.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
    }
    setItems((cur) => [...added, ...cur]);
    setBusy(false);
    router.refresh();
  };

  return (
    <div>
      <div
        className="mb-6 rounded-2xl border-2 border-dashed border-line bg-white p-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
      >
        <p className="text-sm text-muted">Drag photos here, or</p>
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(e) => upload(e.target.files)} />
        <button type="button" className="btn-primary mt-3" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? "Uploading…" : "Choose photos"}
        </button>
        <p className="mt-2 text-xs text-muted">JPG, PNG, WebP, GIF or AVIF · up to 10 MB each</p>
      </div>
      {msg && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{msg}</p>}
      {items.length === 0 ? (
        <p className="text-center text-sm text-muted">No uploaded photos yet. The built-in photos from the old website are always available in the image picker.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <li key={it.id} className="overflow-hidden rounded-2xl border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={it.alt ?? ""} loading="lazy" className="aspect-[4/3] w-full bg-surface object-cover" />
              <div className="space-y-2 p-3">
                <p className="truncate text-xs font-medium" title={it.filename}>{it.filename}</p>
                <p className="text-xs text-muted">{it.width}×{it.height} · {Math.round(it.sizeBytes / 1024)} KB</p>
                <input
                  defaultValue={it.alt ?? ""}
                  placeholder="Describe the photo…"
                  aria-label="Image description"
                  className="field py-1.5 text-xs"
                  onBlur={(e) => {
                    if (e.target.value !== (it.alt ?? "")) start(() => updateMediaAltAction(it.id, e.target.value));
                  }}
                />
                <div className="flex gap-2">
                  <button type="button" className="btn-outline flex-1 px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(it.url).then(() => setMsg(`Copied ${it.url}`))}>
                    Copy link
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="btn-outline px-2 py-1 text-xs text-red-600"
                    onClick={() => {
                      if (!confirm("Delete this photo?")) return;
                      start(async () => {
                        const res = await deleteMediaAction(it.id);
                        setMsg(res.message);
                        if (res.ok) setItems((cur) => cur.filter((x) => x.id !== it.id));
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
