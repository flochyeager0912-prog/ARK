import Link from "next/link";
import { mapsDirectionsUrl } from "@/content/site";
import { getSite } from "@/server/content";
import { Section } from "@/components/ui/section";

export async function VisitCta() {
  const site = await getSite();
  return (
    <Section>
      <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">You are not here by accident</p>
          <h2 className="section-title">Join us this Sunday</h2>
          <p className="lead mt-3">{site.address.full}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/services" className="btn-primary">Service times</Link>
          <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="btn-outline">Get directions</a>
        </div>
      </div>
    </Section>
  );
}
