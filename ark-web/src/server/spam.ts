import "server-only";
import { clientIp } from "./request";
import { rateLimit } from "./rate-limit";
import { verifyTurnstile } from "./turnstile";

export type GuardResult = { ok: true; ip: string } | { ok: false; message: string; silent?: boolean };

/**
 * Common protection for public forms: honeypot, minimum fill time, per-IP rate limit, Turnstile.
 * `silent` means a bot was detected: respond with fake success so bots learn nothing.
 */
export async function guardPublicForm(fd: FormData, bucket: string, limitPerHour: number): Promise<GuardResult> {
  const ip = await clientIp();
  const honeypot = fd.get("company_website");
  if (typeof honeypot === "string" && honeypot.trim() !== "") return { ok: false, message: "", silent: true };

  const startedAt = Number(fd.get("_ts"));
  if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 2500) {
    return { ok: false, message: "", silent: true };
  }

  if (!(await rateLimit(`${bucket}:${ip}`, limitPerHour, 3600))) {
    return { ok: false, message: "Too many submissions from your network. Please try again later." };
  }
  if (!(await verifyTurnstile(fd.get("cf-turnstile-response"), ip))) {
    return { ok: false, message: "We couldn't verify you're human. Please refresh and try again." };
  }
  return { ok: true, ip };
}
