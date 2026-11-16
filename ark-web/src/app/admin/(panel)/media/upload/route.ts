import { NextResponse } from "next/server";
import { getAdmin } from "@/server/auth";
import { rateLimit } from "@/server/rate-limit";
import { MAX_UPLOAD_BYTES, storeUpload } from "@/server/media";

/** Image upload endpoint for the admin (multipart/form-data, field "file"). */
export async function POST(req: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // CSRF: only accept same-origin requests.
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) return NextResponse.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });
  if (!(await rateLimit(`upload:${admin.id}`, 120, 3600))) return NextResponse.json({ error: "Too many uploads, try again later." }, { status: 429 });

  try {
    const fd = await req.formData();
    const file = fd.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
    const alt = typeof fd.get("alt") === "string" ? String(fd.get("alt")) : undefined;
    const item = await storeUpload(file, admin, alt);
    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
