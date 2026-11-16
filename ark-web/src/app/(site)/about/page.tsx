import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
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
      <PageHero eyebrow="About us" title="Where church is family" lead={welcome.body[0]}>
        <Link href="/services" className="btn-light">Join this Sunday</Link>
        <Link href="/about/journey" className="btn-ghost-light">Our journey</Link>
      </PageHero>

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <Photo src="/images/collage-sunday.webp" alt="Sunday service at The Ark" ratio="4/5" sizes="(min-width:1024px) 25vw, 50vw" />
            <Photo src="/images/marriage-celebration.webp" alt="Celebrating marriage at The Ark Victory Church" ratio="4/5" className="mt-10" sizes="(min-width:1024px) 25vw, 50vw" />
          </div>
          <div>
            <p className="eyebrow mb-3">Who we are</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{loveGodLovePeople.title}</h2>
            <div className="prose-ark mt-5">
              <p>{loveGodLovePeople.body}</p>
              <p>{welcome.body[1]}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="surface">
        <div className="mb-10 max-w-3xl">
          <p className="eyebrow mb-3">Our mission</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">{loveGodLovePeople.intro}…</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loveGodLovePeople.pillars.map((p, i) => (
            <div key={p.title} className="card p-6">
              <p className="font-display text-4xl font-semibold text-brand-200">0{i + 1}</p>
              <h3 className="mt-3 text-xl font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          ))}
        </div>
        <Link href="/about/mission" className="btn-outline mt-8">Read our mission statement</Link>
      </Section>

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <Photo src={pastors.image} alt={`${pastors.names}, senior pastors of The Ark Victory Church`} ratio="4/3" />
          <div>
            <p className="eyebrow mb-3">{pastors.eyebrow}</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{pastors.title}</h2>
            <p className="mt-3 font-display text-2xl text-brand-600">{pastors.names}</p>
            <blockquote className="mt-6 border-l-4 border-brand-500 pl-5 text-lg italic text-muted">“{pastors.quote}”</blockquote>
            <p className="mt-6 font-semibold">{pastors.tagline}</p>
            <p className="text-muted">{pastors.subTagline}</p>
          </div>
        </div>
      </Section>

      <Section tone="navy">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 text-brand-300">{arkTeam.eyebrow}</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{arkTeam.title}</h2>
            <figure className="mt-6">
              <blockquote className="text-lg italic text-white/80">“{arkTeam.verse.text}”</blockquote>
              <figcaption className="mt-2 text-sm text-brand-300">— {arkTeam.verse.reference}</figcaption>
            </figure>
          </div>
          <div>
            <p className="leading-relaxed text-white/80">{arkTeam.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/get-involved/volunteer" className="btn-light">Join the Ark team</Link>
              <Link href="/ministries" className="btn-ghost-light">Our ministries</Link>
            </div>
          </div>
        </div>
      </Section>

      <VisitCta />
    </>
  );
}
