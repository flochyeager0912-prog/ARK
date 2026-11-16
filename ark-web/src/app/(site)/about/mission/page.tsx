import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { getSection, getSite } from "@/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const { missionStatement } = await getSection("mission");
  return { title: "Our mission", description: missionStatement.statement, alternates: { canonical: "/about/mission" } };
}

export default async function MissionPage() {
  const [site, { localMissions, ministryTeams, missionStatement, missions }] = await Promise.all([getSite(), getSection("mission")]);
  return (
    <>
      <PageHero eyebrow="Our mission statement" title={missionStatement.statement} lead={missionStatement.vision}>
        <Link href="/services" className="btn-light">Explore more</Link>
      </PageHero>

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Missions</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Called to Chennai — and to the ends of the earth</h2>
            <div className="prose-ark mt-5">
              <p>{missions.body}</p>
              <p>{missions.supportNote}</p>
            </div>
          </div>
          <Photo src={missionStatement.image} alt="Celebrating God's faithfulness together" ratio="1/1" />
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">{missions.missionalTitle}</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{missions.missionalSubtitle}</h2>
            <p className="mt-5 leading-relaxed text-muted">{missions.missionalBody}</p>
            <Link href="/contact?purpose=ministerial-opportunities" className="btn-primary mt-6">Join our mission</Link>
          </div>
          <figure className="card flex flex-col justify-center p-8">
            <blockquote className="font-display text-xl leading-relaxed text-navy-800">“{missions.quote.text}”</blockquote>
            <figcaption className="mt-4 text-sm font-semibold text-brand-600">— {missions.quote.author}</figcaption>
          </figure>
        </div>
      </Section>

      <Section>
        <div className="mb-10 max-w-3xl">
          <p className="eyebrow mb-3">Local missions</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">{localMissions.title}</h2>
          <p className="mt-4 text-lg text-muted">{localMissions.body}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="card overflow-hidden">
            <Photo src="/images/about-church.webp" alt="The Petras building" ratio="16/9" className="rounded-none" />
            <div className="p-6">
              <h3 className="text-xl font-semibold">{localMissions.petras.title}</h3>
              <p className="mt-2 text-muted">{localMissions.petras.body}</p>
            </div>
          </article>
          <article className="card overflow-hidden">
            <Photo src="/images/rakshak.webp" alt="Rakshak children" ratio="16/9" className="rounded-none" />
            <div className="p-6">
              <h3 className="text-xl font-semibold">Rakshak</h3>
              <p className="mt-2 text-muted">
                Our NGO, founded in 2004, creating an environment for underprivileged children in informal settlements — one little heartbeat at a time.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/ministries/rakshak" className="btn-outline">Learn more</Link>
                <a href={site.external.rakshak} target="_blank" rel="noopener noreferrer" className="btn-primary">Donate</a>
              </div>
            </div>
          </article>
        </div>
      </Section>

      <Section tone="navy">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 text-brand-300">{ministryTeams.eyebrow}</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{ministryTeams.title}</h2>
            <p className="mt-5 leading-relaxed text-white/80">{ministryTeams.body}</p>
            <Link href="/get-involved/volunteer" className="btn-light mt-6">Volunteer with us</Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {ministryTeams.images.map((src, i) => (
              <Photo key={src} src={src} alt="Ministry team members serving at church" ratio="4/5" className={i === 1 ? "mt-10" : undefined} sizes="(min-width:1024px) 25vw, 50vw" />
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
