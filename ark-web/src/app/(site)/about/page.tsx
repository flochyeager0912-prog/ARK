import type { Metadata } from "next";
import Link from "next/link";
import { Flow, NumberedTile, PageHero, Section, SectionHeading } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { VisitCta } from "@/components/site/cta-band";
import { getSection } from "@/server/content";

export const metadata: Metadata = {
  title: "About us",
  description: "The Ark Victory Church is a passionate, Word-based church in South Chennai led by Ps. Jay Kumar & Ps. Anjali.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const [{ arkTeam, loveGodLovePeople, pastors }, { welcome }] = await Promise.all([getSection("about"), getSection("home")]);
  return (
    <>
      <PageHero eyebrow="About us" title="Where church is family" lead={welcome.body[0]} crumbs={[{ href: "/about", label: "About" }]}>
        <Link href="/services" className="btn-primary">Join this Sunday</Link>
        <Link href="/about/journey" className="btn-outline">Our journey</Link>
      </PageHero>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="grid grid-cols-2 gap-4">
            <Photo src="/images/collage-sunday.webp" alt="Sunday service at The Ark" ratio="4/5" sizes="(min-width:1024px) 25vw, 50vw" />
            <Photo src="/images/marriage-celebration.webp" alt="Celebrating marriage at The Ark Victory Church" ratio="4/5" className="mt-10" sizes="(min-width:1024px) 25vw, 50vw" />
          </div>
          <div>
            <p className="eyebrow mb-4">Who we are</p>
            <h2 className="section-title">{loveGodLovePeople.title}</h2>
            <div className="prose-ark mt-5">
              <p>{loveGodLovePeople.body}</p>
              <p>{welcome.body[1]}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Our mission" title={`${loveGodLovePeople.intro}…`} action={<Link href="/about/mission" className="btn-outline">Read our mission statement</Link>} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loveGodLovePeople.pillars.map((p, i) => <NumberedTile key={`${i}-${p.title}`} n={i + 1} title={p.title}>{p.body}</NumberedTile>)}
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <Photo src={pastors.image} alt={`${pastors.names}, senior pastors of The Ark Victory Church`} ratio="4/3" />
          <div>
            <p className="eyebrow mb-4">{pastors.eyebrow}</p>
            <h2 className="section-title">{pastors.title}</h2>
            <p className="mt-3 font-display text-2xl text-glow-gold">{pastors.names}</p>
            <blockquote className="mt-6 border-l border-glow-blue/50 pl-5 font-display text-xl italic leading-snug text-ink/85">“{pastors.quote}”</blockquote>
            <p className="mt-6 font-semibold text-white">{pastors.tagline}</p>
            <p className="text-muted">{pastors.subTagline}</p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="eyebrow mb-4">{arkTeam.eyebrow}</p>
            <h2 className="section-title">{arkTeam.title}</h2>
            <figure className="mt-6">
              <blockquote className="font-display text-xl italic text-ink/85">“{arkTeam.verse.text}”</blockquote>
              <figcaption className="mt-2 font-mono text-sm text-accent">— {arkTeam.verse.reference}</figcaption>
            </figure>
          </div>
          <div>
            <p className="leading-relaxed text-muted">{arkTeam.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/get-involved/volunteer" className="btn-primary">Join the Ark team</Link>
              <Link href="/ministries" className="btn-outline">Our ministries</Link>
            </div>
          </div>
        </div>
        <Flow className="mt-10" items={[{ label: "Our mission", href: "/about/mission" }, { label: "Our journey", href: "/about/journey" }, { label: "Gallery", href: "/gallery" }]} />
      </Section>

      <VisitCta />
    </>
  );
}
