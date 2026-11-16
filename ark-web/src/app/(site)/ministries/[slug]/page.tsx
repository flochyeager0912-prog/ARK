import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMinistries, getMinistry } from "@/server/content";
import { getServices, getUpcomingEvents } from "@/server/queries";
import { PageHero, Section } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { ServiceCard } from "@/components/site/service-list";
import { EventCard } from "@/components/site/event-card";
import { IconExternal } from "@/components/ui/icons";

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
      <PageHero eyebrow={m.group} title={m.name} lead={m.tagline}>
        {m.cta.external ? (
          <a href={m.cta.href} target="_blank" rel="noopener noreferrer" className="btn-light">{m.cta.label} <IconExternal size={16} /></a>
        ) : (
          <Link href={m.cta.href} className="btn-light">{m.cta.label}</Link>
        )}
      </PageHero>

      <Section>
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            {(m.ageRange || m.schedule) && (
              <dl className="mb-6 grid gap-3 sm:grid-cols-2">
                {m.ageRange && (
                  <div className="rounded-2xl bg-surface p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Age group</dt>
                    <dd className="mt-1 font-semibold">{m.ageRange}</dd>
                  </div>
                )}
                {m.schedule && (
                  <div className="rounded-2xl bg-surface p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">When</dt>
                    <dd className="mt-1 font-semibold">{m.schedule}</dd>
                  </div>
                )}
              </dl>
            )}
            <div className="prose-ark">
              {m.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </div>
            {m.highlights && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {m.highlights.map((h) => <li key={h} className="badge bg-brand-50 px-3 py-1 text-sm text-brand-700">{h}</li>)}
              </ul>
            )}
          </div>
          <div className="space-y-4">
            <Photo src={m.image.src} alt={m.image.alt} ratio="4/3" priority />
            {m.gallery && (
              <div className="grid grid-cols-2 gap-4">
                {m.gallery.map((g) => <Photo key={g.src} src={g.src} alt={g.alt} ratio="4/3" sizes="(min-width:1024px) 25vw, 50vw" />)}
              </div>
            )}
          </div>
        </div>
      </Section>

      {linked.length > 0 && (
        <Section tone="surface">
          <h2 className="mb-8 text-2xl font-semibold sm:text-3xl">Meeting times</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {linked.map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        </Section>
      )}

      {related.length > 0 && (
        <Section>
          <h2 className="mb-8 text-2xl font-semibold sm:text-3xl">Upcoming {m.name} events</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        </Section>
      )}

      {others.length > 0 && (
        <Section tone={linked.length ? "white" : "surface"}>
          <h2 className="mb-6 text-2xl font-semibold">More {m.group.toLowerCase()}</h2>
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
