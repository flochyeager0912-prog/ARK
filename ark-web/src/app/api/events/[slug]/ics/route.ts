import { db } from "@/server/db";
import { eventIcs } from "@/server/registrations";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.event.findUnique({ where: { slug } });
  if (!event || event.status === "DRAFT") return new Response("Not found", { status: 404 });
  const body = eventIcs(event, event.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED");
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
