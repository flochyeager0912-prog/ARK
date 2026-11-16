import type { Metadata } from "next";
import Link from "next/link";
import { getServices } from "@/server/queries";
import { PageHero, Section, SectionHeading } from "@/components/ui/section";
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

  return (
    <>
      <PageHero eyebrow={servicesIntro.title} title={servicesIntro.lead} lead={servicesIntro.body}>
        <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="btn-light">
          <IconPin size={18} /> Get directions
        </a>
        <Link href="/watch" className="btn-ghost-light"><IconPlay size={18} /> Watch online</Link>
      </PageHero>

      <Section>
        <SectionHeading eyebrow="Every Sunday" title="Sunday services" lead={`At ${site.address.full}.`} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {by("SUNDAY").map((s) => <ServiceCard key={s.id} s={s} />)}
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading eyebrow="Language fellowships" title="Church in your heart language" lead="Our Hindi Church, Telugu Fellowship and International Fellowship bring brothers and sisters together to worship in their own language." />
            <Photo src="/images/hindi-church.webp" alt="Hindi Church congregation" ratio="16/9" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {by("FELLOWSHIP").map((s) => <ServiceCard key={s.id} s={s} />)}
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="Children & youth" title="Kids and Tweens church" lead="Victory Kids (ages 3–12) meets during the 8 AM Tamil and 10 AM English services; Tweens meets every Sunday morning; Ark Arise is our youth service." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {by("CHILDREN").map((s) => <ServiceCard key={s.id} s={s} />)}
        </div>
        <Link href="/ministries#children-youth" className="btn-outline mt-8">About our children & youth ministries</Link>
      </Section>

      <Section tone="navy">
        <SectionHeading tone="dark" eyebrow="Monthly gatherings" title="Dawn service & night prayer" lead="Beyond Sundays, we gather to seek God together at the start and end of every month." />
        <div className="grid gap-5 sm:grid-cols-2">
          {by("MONTHLY").map((s) => <ServiceCard key={s.id} s={s} tone="dark" />)}
        </div>
        <Link href="/services/special" className="btn-light mt-8">Other services & seasons of prayer</Link>
      </Section>
    </>
  );
}
