import type { MetadataRoute } from "next";
import { getMinistries } from "@/server/content";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const staticPaths = [
    "/", "/about", "/about/mission", "/about/journey", "/gallery", "/services", "/services/special", "/watch",
    "/ministries", "/events", "/get-involved", "/get-involved/volunteer", "/give", "/contact", "/privacy",
  ];
  const ministries = await getMinistries();
  const events = await db.event
    .findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, orderBy: { startsAt: "desc" }, take: 500 })
    .catch(() => []);
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...ministries.map((m) => ({ url: `${base}/ministries/${m.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...events.map((e) => ({ url: `${base}/events/${e.slug}`, lastModified: e.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
