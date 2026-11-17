import type { Metadata } from "next";
import Link from "next/link";
import { getServices } from "@/server/queries";
import { Flow, PageHero, Section, SectionHeading } from "@/components/ui/section";
import { ServiceCard } from "@/components/site/service-list";
import { Photo } from "@/components/ui/photo";
import { IconPin, IconPlay } from "@/components/ui/icons";
import { mapsDirectionsUrl } from "@/content/site";
import { getSection, getSite } from "@/server/content";

export const metadata: Metadata = {
  title: "Service times",
  description:
    "Sunday services at The Ark Victory Church: 6 AM Bilingual, 8 AM Tamil, 10 AM English, 12:15 PM Ark Arise youth, 5 PM Hindi Church and Telugu Fellowship.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const [site, { intro: servicesIntro }] = await Promise.all([getSite(), getSection("services")]);
  const services = await getServices();
  const by = (c: string) => services.filter((s) => s.category === c);
  const sunday = by("SUNDAY");
  const fellowship = by("FELLOWSHIP");
  const children = by("CHILDREN");
  const monthly = by("MONTHLY");

  return (
    <>
      <PageHero eyebrow={servicesIntro.title} title={servicesIntro.lead} lead={servicesIntro.body} crumbs={[{ href: "/services", label: "Services" }]}>
        <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="btn-primary">
          <IconPin size={16} /> Get directions
        </a>
        <Link href="/watch" className="btn-outline"><IconPlay size={16} /> Watch online</Link>
      </PageHero>

      <Section id="sunday">
        <SectionHeading eyebrow="Every Sunday" title="Sunday services" lead={`At ${site.address.full}.`} />
        {sunday.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sunday.map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        ) : (
          <p className="tile p-6 text-muted">Sunday service times will be published soon. Call us on {site.contact.phoneDisplay}.</p>
        )}
      </Section>

      {fellowship.length > 0 && (
        <Section id="fellowships">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <SectionHeading eyebrow="Language fellowships" title="Church in your heart language" lead="Our Hindi Church, Telugu Fellowship and International Fellowship bring brothers and sisters together to worship in their own language." className="mb-6" />
              <Photo src="/images/hindi-church.webp" alt="Hindi Church congregation" ratio="16/9" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fellowship.map((s) => <ServiceCard key={s.id} s={s} />)}
            </div>
          </div>
        </Section>
      )}

      {children.length > 0 && (
        <Section id="children">
          <SectionHeading
            eyebrow="Children & youth"
            title="Kids and Tweens church"
            lead="Victory Kids (ages 3–12) meets during the 8 AM Tamil and 10 AM English services; Tweens meets every Sunday morning; Ark Arise is our youth service."
            action={<Link href="/ministries#children-youth" className="btn-outline">Children & youth ministries</Link>}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        </Section>
      )}

      {monthly.length > 0 && (
        <Section id="monthly">
          <SectionHeading
            eyebrow="Monthly gatherings"
            title="Dawn service & night prayer"
            lead="Beyond Sundays, we gather to seek God together at the start and end of every month."
            action={<Link href="/services/special" className="btn-outline">Other services & seasons of prayer</Link>}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {monthly.map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        </Section>
      )}

      <Section plain>
        <Flow className="justify-center" items={[{ label: "Other services", href: "/services/special" }, { label: "Live worship", href: "/watch" }, { label: "Events", href: "/events" }]} />
      </Section>
    </>
  );
}
