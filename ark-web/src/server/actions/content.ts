"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { resetSection, restoreRevision, saveSection } from "@/server/content";
import { listMedia, type MediaItem } from "@/server/media";
import { db } from "@/server/db";
import { audit } from "@/server/audit";
import { isSectionKey } from "@/content/sections";

export type ContentSaveState = { ok: boolean; message?: string; issues?: { path: string; message: string }[]; savedAt?: number };

function refreshSite() {
  revalidatePath("/", "layout");
}

/** Saves a whole section. `json` is the editor state serialised as JSON. */
export async function saveContentAction(key: string, json: string): Promise<ContentSaveState> {
  const admin = await requireAdmin();
  if (!isSectionKey(key)) return { ok: false, message: "Unknown section." };
  if (json.length > 2_000_000) return { ok: false, message: "This section is too large to save." };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, message: "Could not read the form data. Please reload and try again." };
  }
  const res = await saveSection(key, raw, admin);
  if (!res.ok) return { ok: false, message: "Please fix the problems below and save again.", issues: res.issues };
  refreshSite();
  revalidatePath(`/admin/content/${key}`);
  return { ok: true, message: "Saved — the website is updated.", savedAt: Date.now() };
}

export async function resetContentAction(key: string): Promise<ContentSaveState> {
  const admin = await requireAdmin();
  if (!isSectionKey(key)) return { ok: false, message: "Unknown section." };
  await resetSection(key, admin);
  refreshSite();
  revalidatePath(`/admin/content/${key}`);
  return { ok: true, message: "Reset to the original text. (The previous version was saved in history.)", savedAt: Date.now() };
}

export async function restoreRevisionAction(revisionId: string): Promise<ContentSaveState> {
  const admin = await requireAdmin();
  const res = await restoreRevision(revisionId, admin);
  if (!res.ok) return { ok: false, message: "Could not restore this version.", issues: res.issues };
  refreshSite();
  if (res.key) revalidatePath(`/admin/content/${res.key}`);
  return { ok: true, message: "Version restored.", savedAt: Date.now() };
}

export async function listMediaAction(): Promise<MediaItem[]> {
  await requireAdmin();
  return listMedia();
}

export async function updateMediaAltAction(id: string, alt: string) {
  const admin = await requireAdmin();
  await db.media.update({ where: { id }, data: { alt: alt.trim().slice(0, 300) || null } });
  await audit(admin.id, "media.update", "media", id);
  revalidatePath("/admin/media");
}

/** Deletes an upload, refusing if any page content or event still uses it. */
export async function deleteMediaAction(id: string): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  const url = `/media/${id}.webp`;
  const [blocks, events] = await Promise.all([
    db.contentBlock.findMany({ select: { key: true, value: true } }),
    db.event.findMany({ where: { imageUrl: url }, select: { title: true } }),
  ]);
  const usedIn = [
    ...blocks.filter((b) => JSON.stringify(b.value).includes(url)).map((b) => `content “${b.key}”`),
    ...events.map((e) => `event “${e.title}”`),
  ];
  if (usedIn.length) return { ok: false, message: `Still used in ${usedIn.join(", ")}. Replace it there first.` };
  await db.media.delete({ where: { id } });
  await audit(admin.id, "media.delete", "media", id);
  revalidatePath("/admin/media");
  return { ok: true, message: "Deleted." };
}
