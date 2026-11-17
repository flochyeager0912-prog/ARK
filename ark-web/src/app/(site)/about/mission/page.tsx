import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section, SectionHeading } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { IconExternal } from "@/components/ui/icons";
import { getSection, getSite } from "@/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const { missionStatement } = await getSection("mission");
  return { title: "Our mission", description: missionStatement.statement, alternates: { canonical: "/about/mission" } };
}

export default async function MissionPage() {
  const [site, { localMissions, ministryTeams, missionStatement, missions }] = await Promise.all([getSite(), getSection("mission")]);
  return (
    <>
      <PageHero
        eyebrow={missionStatement.title}
        title={missionStatement.statement}
        lead={missionStatement.vision}
        wide
        crumbs={[{ href: "/about", label: "About" }, { href: "/about/mission", label: "Our mission" }]}
      >
        <Link href="/services" className="btn-primary">Explore more</Link>
      </PageHero>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="eyebrow mb-4">{missions.title}</p>
            <h2 className="section-title">Called to Chennai — and to the ends of the earth</h2>
            <div className="prose-ark mt-5">
              <p>{missions.body}</p>
              <p>{missions.supportNote}</p>
            </div>
          </div>
          <Photo src={missionStatement.image} alt="Celebrating God's faithfulness together" ratio="1/1" />
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="eyebrow mb-4">{missions.missionalTitle}</p>
            <h2 className="section-title">{missions.missionalSubtitle}</h2>
            <p className="mt-5 leading-relaxed text-muted">{missions.missionalBody}</p>
            <Link href="/contact?purpose=ministerial-opportunities#form" className="btn-primary mt-6">Join our mission</Link>
          </div>
          <figure className="tile flex flex-col justify-center p-8">
            <blockquote className="font-display text-2xl italic leading-snug text-white">“{missions.quote.text}”</blockquote>
            <figcaption className="mt-4 font-mono text-sm text-accent">— {missions.quote.author}</figcaption>
          </figure>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Local missions" title={localMissions.title} lead={localMissions.body} />
        <div className="grid gap-4 md:grid-cols-2">
          <article className="tile overflow-hidden">
            <Photo src="/images/about-church.webp" alt="The Petras building" ratio="16/9" className="rounded-none border-0 border-b" />
            <div className="p-6">
              <h3 className="text-xl text-white">{localMissions.petras.title}</h3>
              <p className="mt-2 text-muted">{localMissions.petras.body}</p>
            </div>
          </article>
          <article className="tile overflow-hidden">
            <Photo src="/images/rakshak.webp" alt="Rakshak children" ratio="16/9" className="rounded-none border-0 border-b" />
            <div className="p-6">
              <h3 className="text-xl text-white">Rakshak</h3>
              <p className="mt-2 text-muted">
                Our NGO, founded in 2004, creating an environment for underprivileged children in informal settlements — one little heartbeat at a time.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/ministries/rakshak" className="btn-outline">Learn more</Link>
                <a href={site.external.rakshak} target="_blank" rel="noopener noreferrer" className="btn-primary">Donate <IconExternal size={14} /></a>
              </div>
            </div>
          </article>
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="eyebrow mb-4">{ministryTeams.eyebrow}</p>
            <h2 className="section-title">{ministryTeams.title}</h2>
            <p className="mt-5 leading-relaxed text-muted">{ministryTeams.body}</p>
            <Link href="/get-involved/volunteer" className="btn-primary mt-6">Volunteer with us</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {ministryTeams.images.map((src, i) => (
              <Photo key={`${i}-${src}`} src={src} alt="Ministry team members serving at church" ratio="4/5" className={i % 2 === 1 ? "mt-10" : undefined} sizes="(min-width:1024px) 25vw, 50vw" />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
