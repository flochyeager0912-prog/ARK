import { withBase } from "@/lib/preview";
import type { Metadata } from "next";
import Image from "next/image";
import { PageHero, Section } from "@/components/ui/section";
import { IconInstagram } from "@/components/ui/icons";
import { getSection, getSite } from "@/server/content";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Moments from the life of our Ark church family.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const [site, { photos: gallery }] = await Promise.all([getSite(), getSection("gallery")]);
  return (
    <>
      <PageHero eyebrow="Gallery" title="Our Ark church family" lead="Moments of worship, celebration and fellowship." crumbs={[{ href: "/about", label: "About" }, { href: "/gallery", label: "Gallery" }]}>
        <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-primary">
          <IconInstagram size={18} /> More on Instagram
        </a>
      </PageHero>
      <Section panelClassName="p-3 sm:p-4 lg:p-5">
        {gallery.length > 0 ? (
          <ul className="columns-1 gap-3 sm:columns-2 lg:columns-3 [&>li]:mb-3">
            {gallery.map((g, i) => (
              <li key={`${i}-${g.src}`} className="group break-inside-avoid overflow-hidden rounded-xl border border-line bg-white/5">
                <a href={withBase(g.src)} target="_blank" rel="noopener" className="block">
                  <Image
                    src={g.src}
                    alt={g.alt}
                    width={800}
                    height={1000}
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    className="h-auto w-full transition-[transform,opacity] duration-700 ease-(--ease-out-soft) group-hover:scale-[1.03] group-hover:opacity-90"
                  />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-muted">Photos are coming soon.</p>
        )}
      </Section>
    </>
  );
}
