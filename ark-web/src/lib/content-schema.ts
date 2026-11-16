/**
 * Shape inference + validation for editable content sections.
 *
 * The admin editor is generated from the *shape* of each section's default value:
 * strings → text inputs, string[] → lists, object[] → repeatable cards, etc.
 * The same shape builds the Zod schema used to validate saves on the server.
 * Shared by client (editor) and server (validation).
 */
import { z } from "zod";

export type Shape =
  | { kind: "string" }
  | { kind: "number" }
  | { kind: "boolean" }
  | { kind: "stringArray" }
  | { kind: "object"; fields: Record<string, { shape: Shape; optional: boolean }> }
  | { kind: "objectArray"; item: Extract<Shape, { kind: "object" }> };

type ObjectShape = Extract<Shape, { kind: "object" }>;

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Merge two inferred shapes (used to combine the shapes of array items). */
function mergeShapes(a: Shape, b: Shape): Shape {
  if (a.kind === "object" && b.kind === "object") {
    const fields: ObjectShape["fields"] = {};
    const keys = new Set([...Object.keys(a.fields), ...Object.keys(b.fields)]);
    for (const k of keys) {
      const fa = a.fields[k];
      const fb = b.fields[k];
      if (fa && fb) fields[k] = { shape: mergeShapes(fa.shape, fb.shape), optional: fa.optional || fb.optional };
      else fields[k] = { shape: (fa ?? fb)!.shape, optional: true };
    }
    return { kind: "object", fields };
  }
  if (a.kind === "objectArray" && b.kind === "objectArray") {
    return { kind: "objectArray", item: mergeShapes(a.item, b.item) as ObjectShape };
  }
  return a;
}

/** Infer a Shape from a sample value. */
export function shapeOf(value: unknown): Shape {
  if (typeof value === "string") return { kind: "string" };
  if (typeof value === "number") return { kind: "number" };
  if (typeof value === "boolean") return { kind: "boolean" };
  if (Array.isArray(value)) {
    if (value.length === 0 || value.every((v) => typeof v === "string")) return { kind: "stringArray" };
    const objects = value.filter(isPlainObject);
    let item = shapeOf(objects[0]) as ObjectShape;
    for (const o of objects.slice(1)) item = mergeShapes(item, shapeOf(o)) as ObjectShape;
    return { kind: "objectArray", item };
  }
  if (isPlainObject(value)) {
    const fields: ObjectShape["fields"] = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      fields[k] = { shape: shapeOf(v), optional: false };
    }
    return { kind: "object", fields };
  }
  return { kind: "string" };
}

/**
 * Mark fields optional by path (e.g. "milestones.image"), for fields that are optional
 * by design even if every current item happens to have them. Array levels are skipped.
 */
export function withOptional(shape: Shape, paths: string[]): Shape {
  const clone = structuredClone(shape);
  for (const path of paths) {
    let node: Shape = clone;
    const parts = path.split(".");
    parts.forEach((part, i) => {
      if (node.kind === "objectArray") node = node.item;
      if (node.kind !== "object") return;
      const f = node.fields[part];
      if (!f) return;
      if (i === parts.length - 1) f.optional = true;
      else node = f.shape;
    });
  }
  return clone;
}

// ---------------------------------------------------------------------------
// Field semantics by key
// ---------------------------------------------------------------------------

const IMAGE_KEYS = new Set(["src", "image"]);
const IMAGE_ARRAY_KEYS = new Set(["images"]);
const LINK_KEYS = new Set(["href", "url", "linkUrl", "youtube", "instagram", "facebook", "rakshak"]);
const EMAIL_KEYS = new Set(["email", "secondaryEmail"]);
const LONG_TEXT_KEYS = new Set(["body", "description", "summary", "intro", "outro", "statement", "vision", "text", "quote", "missionalBody", "supportNote", "instructions", "formIntro"]);

export type FieldKind = "text" | "textarea" | "image" | "link" | "email" | "number" | "boolean" | "select";

export function fieldKind(key: string, sample: unknown, options?: readonly string[]): FieldKind {
  if (options) return "select";
  if (IMAGE_KEYS.has(key)) return "image";
  if (LINK_KEYS.has(key)) return "link";
  if (EMAIL_KEYS.has(key)) return "email";
  if (typeof sample === "number") return "number";
  if (typeof sample === "boolean") return "boolean";
  if (LONG_TEXT_KEYS.has(key) || (typeof sample === "string" && sample.length > 90)) return "textarea";
  return "text";
}

export const isImageArrayKey = (key: string) => IMAGE_ARRAY_KEYS.has(key);

export function isSafeLink(v: string) {
  if (v === "") return true;
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  if (/^mailto:[^\s]+$/i.test(v) || /^tel:\+?[\d\s-]+$/i.test(v)) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export const isSafeImage = (v: string) => v === "" || (/^\/(images|media)\/[\w.\-/%]+$/.test(v) && !v.includes(".."));

// ---------------------------------------------------------------------------
// Zod schema from shape
// ---------------------------------------------------------------------------

const MAX_TEXT = 10_000;
const MAX_ITEMS = 200;

function stringSchema(key: string, required: boolean) {
  let s = z.string().trim().max(MAX_TEXT, "Too long (max 10,000 characters)");
  if (required) s = s.min(1, "This field is required");
  if (IMAGE_KEYS.has(key)) return s.refine(isSafeImage, "Choose an image from the library or upload one");
  if (LINK_KEYS.has(key)) return s.refine(isSafeLink, "Use a /page-path or a full https:// link");
  if (EMAIL_KEYS.has(key)) return s.refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address");
  return s;
}

export function schemaFor(shape: Shape, key = "", requiredKeys: Set<string> = new Set()): z.ZodType {
  switch (shape.kind) {
    case "string":
      return stringSchema(key, requiredKeys.has(key));
    case "number":
      return z.coerce.number().int().min(0).max(1_000_000);
    case "boolean":
      return z.boolean();
    case "stringArray": {
      const item = IMAGE_ARRAY_KEYS.has(key)
        ? z.string().trim().refine(isSafeImage, "Invalid image")
        : z.string().trim().max(MAX_TEXT);
      return z.array(item).max(MAX_ITEMS);
    }
    case "objectArray":
      return z.array(schemaFor(shape.item, key, requiredKeys)).max(MAX_ITEMS);
    case "object": {
      const fields: Record<string, z.ZodType> = {};
      for (const [k, f] of Object.entries(shape.fields)) {
        const s = schemaFor(f.shape, k, requiredKeys);
        fields[k] = f.optional ? s.optional() : s;
      }
      return z.object(fields).strip();
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers for the editor and for saving
// ---------------------------------------------------------------------------

/** A blank value for a shape (used when adding a new list item). */
export function blankFor(shape: Shape): unknown {
  switch (shape.kind) {
    case "string":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "stringArray":
    case "objectArray":
      return [];
    case "object": {
      const out: Record<string, unknown> = {};
      for (const [k, f] of Object.entries(shape.fields)) out[k] = blankFor(f.shape);
      return out;
    }
  }
}

const isEmpty = (v: unknown): boolean =>
  v === undefined ||
  v === null ||
  v === "" ||
  v === false ||
  (Array.isArray(v) && v.length === 0) ||
  (isPlainObject(v) && Object.values(v).every(isEmpty));

/**
 * Normalises editor output before validation:
 * trims strings, drops empty strings from lists, and removes OPTIONAL fields left empty
 * (e.g. a milestone without an image).
 */
export function normalize(value: unknown, shape: Shape): unknown {
  switch (shape.kind) {
    case "string":
      return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim() : "";
    case "number":
      return typeof value === "number" ? value : Number(value) || 0;
    case "boolean":
      return value === true;
    case "stringArray":
      return Array.isArray(value) ? value.map((v) => String(v ?? "").trim()).filter(Boolean) : [];
    case "objectArray":
      return Array.isArray(value) ? value.map((v) => normalize(v, shape.item)) : [];
    case "object": {
      const src = isPlainObject(value) ? value : {};
      const out: Record<string, unknown> = {};
      for (const [k, f] of Object.entries(shape.fields)) {
        const v = normalize(src[k], f.shape);
        if (f.optional && isEmpty(v)) continue;
        out[k] = v;
      }
      return out;
    }
  }
}

/** Deep-merge a stored value over the default: objects merge, everything else is replaced. */
export function mergeOver<T>(base: T, override: unknown): T {
  if (isPlainObject(base) && isPlainObject(override)) {
    const out: Record<string, unknown> = { ...base };
    for (const [k, v] of Object.entries(override)) out[k] = k in base ? mergeOver((base as Record<string, unknown>)[k], v) : v;
    return out as T;
  }
  return (override === undefined ? base : override) as T;
}

export function humanize(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bE164\b/, "")
    .trim();
}

/** Format a Zod error path for display, e.g. items › 3 › body › 1. */
export function formatIssues(error: z.ZodError) {
  return error.issues.slice(0, 8).map((i) => ({
    path: i.path.map((p) => (typeof p === "number" ? `#${p + 1}` : humanize(String(p)))).join(" › "),
    message: i.message,
  }));
}
