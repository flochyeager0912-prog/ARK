import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
import { getSection } from "@/server/content";

export const metadata: Metadata = {
  title: "Our journey",
  description: "From a small prayer gathering in 1999 to a vibrant church family in Sembakkam — the story of The Ark Victory Church.",
  alternates: { canonical: "/about/journey" },
};

export default async function JourneyPage() {
  const { intro: journeyIntro, milestones: journey } = await getSection("journey");
  return (
    <>
      <PageHero eyebrow="Our journey" title={journeyIntro.title}>
        <Link href="/services" className="btn-light">Join this Sunday</Link>
      </PageHero>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <figure>
            <blockquote className="font-display text-2xl leading-snug text-navy-800 sm:text-3xl">“{journeyIntro.verse.text}”</blockquote>
            <figcaption className="mt-3 font-semibold text-brand-600">— {journeyIntro.verse.reference}</figcaption>
          </figure>
          <div className="prose-ark">
            {journeyIntro.body.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <h2 className="mb-12 text-3xl font-semibold sm:text-4xl">The Ark Victory journey</h2>
        <ol className="relative space-y-12 border-l-2 border-brand-200 pl-8 sm:pl-12">
          {journey.map((m) => (
            <li key={m.year} className="relative">
              <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-white bg-brand-600 ring-2 ring-brand-200 sm:-left-[57px]" aria-hidden />
              <div className="grid gap-6 md:grid-cols-[1fr_280px] md:items-start">
                <div>
                  <p className="font-display text-2xl font-semibold text-brand-600">{m.year}</p>
                  <h3 className="mt-1 text-xl font-semibold">{m.title}</h3>
                  <div className="prose-ark mt-3">
                    {m.body.map((p) => (
                      <p key={p.slice(0, 24)}>{p}</p>
                    ))}
                  </div>
                </div>
                {m.image && (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-50">
                    <Image src={m.image.src} alt={m.image.alt} fill sizes="(min-width:768px) 280px, 100vw" className="object-cover" />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
