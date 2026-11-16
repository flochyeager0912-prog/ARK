import Link from "next/link";
import { mapsDirectionsUrl } from "@/content/site";
import { getSite } from "@/server/content";

export async function VisitCta() {
  const site = await getSite();
  return (
    <section className="hero-bg text-white">
      <div className="container-page flex flex-col items-start justify-between gap-8 py-16 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="eyebrow mb-3 text-brand-300">You are not here by accident</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">Join us this Sunday</h2>
          <p className="mt-3 text-white/75">{site.address.full}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/services" className="btn-light">Service times</Link>
          <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="btn-ghost-light">Get directions</a>
        </div>
      </div>
    </section>
  );
}
