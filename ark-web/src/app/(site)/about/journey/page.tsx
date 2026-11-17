import type { Metadata } from "next";
import { Photo } from "@/components/ui/photo";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
import { getSection } from "@/server/content";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Our journey",
  description: "From a small prayer gathering in 1999 to a vibrant church family in Sembakkam — the story of The Ark Victory Church.",
  alternates: { canonical: "/about/journey" },
};

export default async function JourneyPage() {
  const { intro: journeyIntro, milestones: journey } = await getSection("journey");
  return (
    <>
      <PageHero eyebrow="Our journey" title={journeyIntro.title} crumbs={[{ href: "/about", label: "About" }, { href: "/about/journey", label: "Our journey" }]}>
        <Link href="/services" className="btn-primary">Join this Sunday</Link>
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <figure>
            <blockquote className="font-display text-3xl italic leading-snug text-white sm:text-4xl">“{journeyIntro.verse.text}”</blockquote>
            <figcaption className="mt-4 font-mono text-sm text-accent">— {journeyIntro.verse.reference}</figcaption>
          </figure>
          <div className="prose-ark">
            {journeyIntro.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </Section>

      <Section>
        <p className="eyebrow mb-4">Timeline</p>
        <h2 className="section-title mb-12">The Ark Victory journey</h2>
        <ol className="relative space-y-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-gradient-to-b before:from-glow-blue/60 before:via-glow-blue/20 before:to-glow-gold/50 sm:space-y-8">
          {journey.map((m, i) => (
            <Reveal as="li" key={`${i}-${m.year}`} className="relative pl-10">
              <span className="absolute left-0 top-6 h-[15px] w-[15px] rounded-full border border-glow-blue/60 bg-night-950 shadow-[0_0_14px_rgb(157_177_255/0.6)]" aria-hidden>
                <span className="absolute inset-[4px] rounded-full bg-glow-blue" />
              </span>
              <article className="tile grid gap-6 p-6 md:grid-cols-[1fr_280px] md:items-start">
                <div>
                  <p className="font-mono text-sm text-glow-gold">{m.year}</p>
                  <h3 className="mt-1 text-xl text-white">{m.title}</h3>
                  <div className="prose-ark mt-3">
                    {m.body.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </div>
                {m.image && <Photo src={m.image.src} alt={m.image.alt} ratio="4/3" fit="contain" className="rounded-xl" sizes="(min-width:768px) 280px, 100vw" />}
              </article>
            </Reveal>
          ))}
        </ol>
      </Section>
    </>
  );
}
