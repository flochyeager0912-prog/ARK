import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { audit } from "./audit";
import { OPTIONAL_FIELDS, SECTION_DEFAULTS, REQUIRED_KEYS, type SectionKey, type Sections } from "@/content/sections";
import { ministryGroups, type Ministry } from "@/content/ministries";
import { formatIssues, mergeOver, normalize, schemaFor, shapeOf, withOptional, type Shape } from "@/lib/content-schema";

const shapes = new Map<SectionKey, Shape>();
export function sectionShape(key: SectionKey): Shape {
  let s = shapes.get(key);
  if (!s) {
    s = withOptional(shapeOf(SECTION_DEFAULTS[key]), OPTIONAL_FIELDS[key] ?? []);
    shapes.set(key, s);
  }
  return s;
}

/**
 * Returns the live content for a section: the saved value (if any) merged over the
 * code default. Invalid/corrupt saved values fall back to the default so the site never breaks.
 * Cached per request.
 */
export const getSection = cache(async <K extends SectionKey>(key: K): Promise<Sections[K]> => {
  const fallback = SECTION_DEFAULTS[key];
  let row: { value: Prisma.JsonValue } | null = null;
  try {
    row = await db.contentBlock.findUnique({ where: { key }, select: { value: true } });
  } catch (e) {
    console.error(`[content] could not load "${key}", using defaults`, e);
    return fallback;
  }
  if (!row) return fallback;
  const merged = mergeOver(fallback, row.value);
  const parsed = schemaFor(sectionShape(key), "", REQUIRED_KEYS).safeParse(merged);
  if (!parsed.success) {
    console.error(`[content] stored "${key}" is invalid, using defaults`, parsed.error.issues.slice(0, 3));
    return fallback;
  }
  return parsed.data as Sections[K];
});

// Convenience accessors -------------------------------------------------------
export const getSite = () => getSection("site");
export const getMinistries = async (): Promise<Ministry[]> => (await getSection("ministries")).items;
export const getMinistry = async (slug: string) => (await getMinistries()).find((m) => m.slug === slug);

// ---------------------------------------------------------------------------
// Saving
// ---------------------------------------------------------------------------

export type SaveResult = { ok: true } | { ok: false; issues: { path: string; message: string }[] };

/** Extra rules that the generic schema can't express. */
function extraChecks(key: SectionKey, value: unknown): { path: string; message: string }[] {
  const issues: { path: string; message: string }[] = [];
  if (key === "ministries") {
    const items = (value as { items: Ministry[] }).items;
    const seen = new Set<string>();
    items.forEach((m, i) => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.slug)) issues.push({ path: `Ministries › #${i + 1} › URL name`, message: "Use lowercase letters, numbers and dashes only" });
      if (seen.has(m.slug)) issues.push({ path: `Ministries › #${i + 1} › URL name`, message: `“${m.slug}” is used twice` });
      seen.add(m.slug);
      if (!(ministryGroups as readonly string[]).includes(m.group)) issues.push({ path: `Ministries › #${i + 1} › Group`, message: "Choose a group" });
    });
    if (items.length === 0) issues.push({ path: "Ministries", message: "Keep at least one ministry" });
  }
  if (key === "site") {
    const s = value as Sections["site"];
    if (!/^\+\d{10,15}$/.test(s.contact.phoneE164)) issues.push({ path: "Contact › Phone (international format)", message: "Use + and digits only, e.g. +919884265131" });
    if (!/^\d{10,15}$/.test(s.contact.whatsappE164)) issues.push({ path: "Contact › WhatsApp number", message: "Digits only with country code" });
    if (s.featuredVideoId && !/^[\w-]{6,20}$/.test(s.featuredVideoId)) issues.push({ path: "Featured YouTube video ID", message: "Paste only the video ID, e.g. ftCX9xWeFzU" });
  }
  return issues;
}

export function validateSection(key: SectionKey, raw: unknown): { ok: true; value: unknown } | { ok: false; issues: { path: string; message: string }[] } {
  const shape = sectionShape(key);
  const normalized = normalize(raw, shape);
  const parsed = schemaFor(shape, "", REQUIRED_KEYS).safeParse(normalized);
  if (!parsed.success) return { ok: false, issues: formatIssues(parsed.error) };
  const extra = extraChecks(key, parsed.data);
  if (extra.length) return { ok: false, issues: extra };
  return { ok: true, value: parsed.data };
}

const KEEP_REVISIONS = 30;

async function snapshot(tx: Prisma.TransactionClient, key: SectionKey, admin: { id: string; name: string }, note: string) {
  const current = await tx.contentBlock.findUnique({ where: { key } });
  await tx.contentRevision.create({
    data: {
      key,
      value: (current?.value ?? SECTION_DEFAULTS[key]) as Prisma.InputJsonValue,
      createdById: admin.id,
      createdByName: admin.name,
      note,
    },
  });
  const old = await tx.contentRevision.findMany({ where: { key }, orderBy: { createdAt: "desc" }, skip: KEEP_REVISIONS, select: { id: true } });
  if (old.length) await tx.contentRevision.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}

export async function saveSection(key: SectionKey, raw: unknown, admin: { id: string; name: string }): Promise<SaveResult> {
  const v = validateSection(key, raw);
  if (!v.ok) return v;
  await db.$transaction(async (tx) => {
    await snapshot(tx, key, admin, "Before edit");
    await tx.contentBlock.upsert({
      where: { key },
      create: { key, value: v.value as Prisma.InputJsonValue, updatedById: admin.id },
      update: { value: v.value as Prisma.InputJsonValue, updatedById: admin.id },
    });
  });
  await audit(admin.id, "content.update", "content_block", key);
  return { ok: true };
}

export async function resetSection(key: SectionKey, admin: { id: string; name: string }) {
  await db.$transaction(async (tx) => {
    await snapshot(tx, key, admin, "Before reset to original");
    await tx.contentBlock.deleteMany({ where: { key } });
  });
  await audit(admin.id, "content.reset", "content_block", key);
}

export async function restoreRevision(revisionId: string, admin: { id: string; name: string }): Promise<SaveResult & { key?: SectionKey }> {
  const rev = await db.contentRevision.findUnique({ where: { id: revisionId } });
  if (!rev || !(rev.key in SECTION_DEFAULTS)) return { ok: false, issues: [{ path: "", message: "Version not found" }] };
  const key = rev.key as SectionKey;
  const res = await saveSection(key, mergeOver(SECTION_DEFAULTS[key], rev.value), admin);
  if (res.ok) await audit(admin.id, "content.restore", "content_block", key, { revisionId });
  return { ...res, key };
}
