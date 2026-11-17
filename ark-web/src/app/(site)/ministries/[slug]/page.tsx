import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMinistries, getMinistry } from "@/server/content";
import { getServices, getUpcomingEvents } from "@/server/queries";
import { Meta, PageHero, Section, SectionHeading } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { ServiceCard } from "@/components/site/service-list";
import { EventCard } from "@/components/site/event-card";
import { IconExternal } from "@/components/ui/icons";
import { slugify } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await getMinistry((await params).slug);
  if (!m) return {};
  return {
    title: m.name,
    description: m.summary,
    alternates: { canonical: `/ministries/${m.slug}` },
    openGraph: { images: [m.image.src] },
  };
}

export default async function MinistryPage({ params }: Props) {
  const m = await getMinistry((await params).slug);
  if (!m) notFound();
  const [services, events] = await Promise.all([getServices(), getUpcomingEvents(50)]);
  const linked = services.filter((s) => m.serviceSlugs?.includes(s.slug));
  const related = events.filter((e) => e.ministrySlug === m.slug).slice(0, 3);
  const others = (await getMinistries()).filter((x) => x.group === m.group && x.slug !== m.slug);

  return (
    <>
      <PageHero
        eyebrow={m.group}
        title={m.name}
        lead={m.tagline}
        crumbs={[{ href: "/ministries", label: "Ministries" }, { href: `/ministries#${slugify(m.group)}`, label: m.group }]}
      >
        {m.cta.external ? (
          <a href={m.cta.href} target="_blank" rel="noopener noreferrer" className="btn-primary">{m.cta.label} <IconExternal size={14} /></a>
        ) : (
          <Link href={m.cta.href} className="btn-primary">{m.cta.label}</Link>
        )}
        <Link href={`/contact?purpose=join-ministry&ministry=${m.slug}#form`} className="btn-outline">Ask about {m.name}</Link>
      </PageHero>

      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            {(m.ageRange || m.schedule) && (
              <div className="mb-8 grid gap-3 sm:grid-cols-2">
                {m.ageRange && (
                  <div className="tile p-4">
                    <Meta label="Age group">{m.ageRange}</Meta>
                  </div>
                )}
                {m.schedule && (
                  <div className="tile p-4">
                    <Meta label="When">{m.schedule}</Meta>
                  </div>
                )}
              </div>
            )}
            <div className="prose-ark text-[17px]">
              {m.body.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            {m.highlights && m.highlights.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2">
                {m.highlights.map((h, i) => <li key={`${i}-${h}`} className="chip text-ink/85">{h}</li>)}
              </ul>
            )}
          </div>
          <div className="space-y-4">
            <Photo src={m.image.src} alt={m.image.alt} ratio="4/3" priority />
            {m.gallery && m.gallery.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {m.gallery.map((g, i) => <Photo key={`${i}-${g.src}`} src={g.src} alt={g.alt} ratio="4/3" sizes="(min-width:1024px) 25vw, 50vw" />)}
              </div>
            )}
          </div>
        </div>
      </Section>

      {linked.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Meeting times" title="When we meet" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {linked.map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Events" title={`Upcoming ${m.name} events`} action={<Link href={`/events?ministry=${m.slug}`} className="btn-outline">All {m.name} events</Link>} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </Section>
      )}

      {others.length > 0 && (
        <Section>
          <p className="eyebrow mb-5">More {m.group.toLowerCase()}</p>
          <ul className="flex flex-wrap gap-3">
            {others.map((o) => (
              <li key={o.slug}><Link href={`/ministries/${o.slug}`} className="btn-outline">{o.name}</Link></li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
