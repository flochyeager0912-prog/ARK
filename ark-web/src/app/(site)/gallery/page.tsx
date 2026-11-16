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
      <PageHero eyebrow="Gallery" title="Our Ark church family" lead="Moments of worship, celebration and fellowship.">
        <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="btn-light">
          <IconInstagram size={18} /> More on Instagram
        </a>
      </PageHero>
      <Section>
        <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
          {gallery.map((g) => (
            <li key={g.src} className="break-inside-avoid overflow-hidden rounded-2xl bg-brand-50">
              <a href={g.src} target="_blank" rel="noopener" className="block">
                <Image src={g.src} alt={g.alt} width={800} height={1000} sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="h-auto w-full transition hover:opacity-90" />
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
