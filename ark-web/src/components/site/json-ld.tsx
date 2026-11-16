import { getServices } from "@/server/queries";
import { getSite } from "@/server/content";

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Safely serialise JSON for a <script> tag (prevents </script> injection). */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export async function ChurchJsonLd() {
  const site = await getSite();
  const services = await getServices().catch(() => []);
  const baseUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const data = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: site.name,
    alternateName: site.alternateNames,
    description: site.description,
    url: baseUrl,
    logo: `${baseUrl}/images/logo-white.webp`,
    image: `${baseUrl}/images/church-family-1-wide.webp`,
    telephone: site.contact.phoneE164,
    email: site.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.line1,
      addressLocality: `${site.address.locality}, ${site.address.city}`,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    sameAs: Object.values(site.social),
    event: services
      .filter((s) => s.recurrence === "WEEKLY" && s.startTime && s.category !== "CHILDREN")
      .map((s) => ({
        "@type": "Event",
        name: s.name,
        eventSchedule: {
          "@type": "Schedule",
          repeatFrequency: "P1W",
          byDay: `https://schema.org/${DAY[s.dayOfWeek]}`,
          startTime: s.startTime,
          scheduleTimezone: "Asia/Kolkata",
        },
        location: { "@type": "Place", name: site.name, address: site.address.full },
      })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
