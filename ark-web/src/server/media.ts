import "server-only";
import sharp, { type OutputInfo } from "sharp";
import { db } from "./db";
import { audit } from "./audit";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export type MediaItem = { id: string; url: string; filename: string; width: number; height: number; sizeBytes: number; alt: string | null; createdAt: Date };

export const mediaUrl = (id: string) => `/media/${id}.webp`;

/**
 * Validates and re-encodes an uploaded image:
 *  - real image check via sharp (not just the MIME header)
 *  - auto-rotate, resize to max 2000px, convert to WebP
 *  - strips ALL metadata (EXIF incl. GPS location — important for photos taken on phones)
 */
export async function storeUpload(file: File, admin: { id: string }, alt?: string): Promise<MediaItem> {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 10 MB or smaller.");
  if (!ALLOWED.has(file.type)) throw new Error("Upload a JPG, PNG, WebP, GIF or AVIF image.");
  const input = Buffer.from(await file.arrayBuffer());
  let out: { data: Buffer; info: OutputInfo };
  try {
    out = await sharp(input, { limitInputPixels: 80_000_000 })
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new Error("That file couldn't be read as an image.");
  }
  const media = await db.media.create({
    data: {
      filename: file.name.slice(0, 200),
      mimeType: "image/webp",
      width: out.info.width,
      height: out.info.height,
      sizeBytes: out.info.size,
      data: new Uint8Array(out.data),
      alt: alt?.slice(0, 300) || null,
      uploadedById: admin.id,
    },
    select: { id: true, filename: true, width: true, height: true, sizeBytes: true, alt: true, createdAt: true },
  });
  await audit(admin.id, "media.upload", "media", media.id, { filename: media.filename, bytes: media.sizeBytes });
  return { ...media, url: mediaUrl(media.id) };
}

export async function listMedia(limit = 200): Promise<MediaItem[]> {
  const rows = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, filename: true, width: true, height: true, sizeBytes: true, alt: true, createdAt: true },
  });
  return rows.map((r) => ({ ...r, url: mediaUrl(r.id) }));
}
