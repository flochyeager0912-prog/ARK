import type { MetadataRoute } from "next";
import { isStaticPreview } from "@/lib/preview";

export default function robots(): MetadataRoute.Robots {
  // The review preview must never compete with the real site in search results.
  if (isStaticPreview) return { rules: [{ userAgent: "*", disallow: "/" }] };
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/booking", "/api", "/events/*/register"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
