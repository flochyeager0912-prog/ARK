"use client";

import { useEffect, useRef, useState } from "react";
import { IMAGE_LIBRARY } from "@/content/image-library.generated";
import { listMediaAction } from "@/server/actions/content";
import type { MediaItem } from "@/server/media";
import { cn } from "@/lib/utils";

type Tab = "uploads" | "library";

/** Uploads a file to the admin media endpoint. Returns the new image URL. */
export async function uploadImage(file: File): Promise<MediaItem> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/admin/media/upload", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as { item?: MediaItem; error?: string };
  if (!res.ok || !data.item) throw new Error(data.error ?? "Upload failed");
  return data.item;
}

/** Image field: preview + "Change" opens a picker with uploads, built-in library and upload. */
export function ImageField({ value, onChange, allowEmpty = true }: { value: string; onChange: (v: string) => void; allowEmpty?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-surface"
        aria-label={value ? "Change image" : "Choose image"}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-muted">No image</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-navy-950/50 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">Change</span>
      </button>
      <div className="min-w-0 space-y-1">
        <p className="truncate font-mono text-xs text-muted">{value || "—"}</p>
        <div className="flex gap-2">
          <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>
            {value ? "Change" : "Choose"}
          </button>
          {allowEmpty && value && (
            <button type="button" className="btn-outline px-3 py-1.5 text-xs text-red-600" onClick={() => onChange("")}>
              Remove
            </button>
          )}
        </div>
      </div>
      {open && (
        <ImagePickerDialog
          current={value}
          onClose={() => setOpen(false)}
          onPick={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

export function ImagePickerDialog({ current, onPick, onClose }: { current?: string; onPick: (url: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("uploads");
  const [uploads, setUploads] = useState<MediaItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    listMediaAction()
      .then(setUploads)
      .catch(() => setUploads([]));
  }, []);

  const onFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const item = await uploadImage(file);
      onPick(item.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const lib = IMAGE_LIBRARY.filter((src) => src.toLowerCase().includes(filter.toLowerCase()));

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
      className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-2xl p-0 backdrop:bg-navy-950/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">Choose an image</h2>
          <button type="button" onClick={() => dialogRef.current?.close()} className="btn-outline px-3 py-1.5 text-xs">Close</button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          {(["uploads", "library"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("badge px-3 py-1.5 text-sm", tab === t ? "bg-navy-900 text-white" : "bg-surface text-ink")}>
              {t === "uploads" ? "Uploaded photos" : "Built-in photos"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <button type="button" className="btn-primary px-4 py-2" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? "Uploading…" : "Upload new photo"}
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
        >
          {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {tab === "library" && (
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name…" className="field mb-4 max-w-xs py-2" />
          )}
          {tab === "uploads" && uploads?.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center text-sm text-muted">
              No uploads yet. Click <strong>Upload new photo</strong> or drop an image here.
              <br />
              Photos are resized automatically and location data is removed.
            </div>
          )}
          {tab === "uploads" && uploads === null && <p className="text-sm text-muted">Loading…</p>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {(tab === "uploads" ? (uploads ?? []).map((u) => ({ src: u.url, label: u.alt || u.filename })) : lib.map((src) => ({ src, label: src.replace("/images/", "") }))).map((img) => (
              <li key={img.src}>
                <button
                  type="button"
                  onClick={() => onPick(img.src)}
                  className={cn(
                    "group block w-full overflow-hidden rounded-xl border-2 text-left transition",
                    current === img.src ? "border-brand-600" : "border-transparent hover:border-brand-300",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt="" loading="lazy" className="aspect-[4/3] w-full bg-surface object-cover" />
                  <span className="block truncate px-2 py-1.5 text-xs text-muted">{img.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  );
}
