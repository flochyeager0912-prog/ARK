import "server-only";
import { db } from "./db";

/**
 * Fixed-window rate limiter backed by Postgres (works with multiple app instances).
 * Returns true if the action is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const windowMs = windowSeconds * 1000;
  const windowEnd = new Date(Math.ceil(Date.now() / windowMs) * windowMs);
  const row = await db.rateLimitHit.upsert({
    where: { key_windowEnd: { key, windowEnd } },
    create: { key, windowEnd, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  // Opportunistic cleanup of expired windows (~1% of calls).
  if (Math.random() < 0.01) {
    await db.rateLimitHit.deleteMany({ where: { windowEnd: { lt: new Date() } } }).catch(() => undefined);
  }
  return row.count <= limit;
}
