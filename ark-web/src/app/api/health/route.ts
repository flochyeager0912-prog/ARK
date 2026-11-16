import { db } from "@/server/db";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe for the load balancer / uptime monitor. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "ok", time: new Date().toISOString() });
  } catch {
    return Response.json({ status: "degraded", db: "unreachable" }, { status: 503 });
  }
}
