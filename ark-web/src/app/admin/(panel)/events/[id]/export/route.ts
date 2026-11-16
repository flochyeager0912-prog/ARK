import { db } from "@/server/db";
import { getAdmin } from "@/server/auth";
import { audit } from "@/server/audit";
import { formatDateTime } from "@/lib/time";

/** Neutralise spreadsheet formula injection and quote for CSV. */
function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id } }).catch(() => null);
  if (!event) return new Response("Not found", { status: 404 });
  const regs = await db.registration.findMany({ where: { eventId: id }, orderBy: [{ status: "asc" }, { createdAt: "asc" }] });
  const header = ["Reference", "Status", "Name", "Email", "Phone", "Seats", "Notes", "Registered (IST)", "Checked in (IST)", "Cancelled (IST)"];
  const rows = regs.map((r) => [
    r.refCode, r.status, r.name, r.email, r.phone, r.seats, r.notes,
    formatDateTime(r.createdAt), r.checkedInAt ? formatDateTime(r.checkedInAt) : "", r.cancelledAt ? formatDateTime(r.cancelledAt) : "",
  ]);
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  await audit(admin.id, "registration.export", "event", id, { rows: regs.length });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-registrations.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
