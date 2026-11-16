import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * Best-effort client IP. Uses X-Forwarded-For, honouring TRUSTED_PROXY_COUNT so
 * clients can't spoof their IP by prepending addresses.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    const idx = Math.max(0, parts.length - Math.max(1, env().TRUSTED_PROXY_COUNT));
    if (parts[idx]) return parts[idx];
  }
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "unknown";
}
