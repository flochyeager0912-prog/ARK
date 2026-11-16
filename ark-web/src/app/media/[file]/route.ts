import { db } from "@/server/db";

const ID_RE = /^([0-9a-f-]{36})\.(webp|png|jpg|gif)$/i;

/** Serves uploaded images from the media table. URLs are content-addressed by id → cache forever. */
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = ID_RE.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  const id = m[1]!;
  const etag = `"${id}"`;
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  const media = await db.media.findUnique({ where: { id }, select: { data: true, mimeType: true } }).catch(() => null);
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
