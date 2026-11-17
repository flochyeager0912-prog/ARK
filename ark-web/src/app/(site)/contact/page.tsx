import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
import { ContactForm } from "@/components/forms/contact-form";
import { IconMail, IconPhone, IconPin, IconWhatsApp } from "@/components/ui/icons";
import { mapsDirectionsUrl, mapsEmbedUrl } from "@/content/site";
import { getMinistry, getSection, getSite } from "@/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: "Contact us",
    description: `Contact ${site.name} — ${site.address.full}. Phone ${site.contact.phoneDisplay}.`,
    alternates: { canonical: "/contact" },
  };
}

type Props = { searchParams: Promise<{ purpose?: string; ministry?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const [site, contactPage] = await Promise.all([getSite(), getSection("contact")]);
  const { purpose, ministry } = await searchParams;
  const m = ministry ? await getMinistry(ministry) : undefined;

  const channels = [
    { label: "Call us", Icon: IconPhone, body: <a href={`tel:${site.contact.phoneE164}`} className="font-semibold text-white hover:text-accent">{site.contact.phoneDisplay}</a> },
    {
      label: "WhatsApp",
      Icon: IconWhatsApp,
      body: <a href={`https://wa.me/${site.contact.whatsappE164}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-accent">Message us on WhatsApp</a>,
    },
    {
      label: "Email",
      Icon: IconMail,
      body: (
        <>
          <a href={`mailto:${site.contact.email}`} className="block break-all font-semibold text-white hover:text-accent">{site.contact.email}</a>
          {site.contact.secondaryEmail && <a href={`mailto:${site.contact.secondaryEmail}`} className="block break-all text-sm text-muted hover:text-white">{site.contact.secondaryEmail}</a>}
        </>
      ),
    },
    {
      label: "Visit us",
      Icon: IconPin,
      body: (
        <>
          <address className="font-semibold not-italic text-white">{site.address.full}</address>
          <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent hover:underline">Get directions →</a>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHero eyebrow={contactPage.newToArk.eyebrow} title={contactPage.newToArk.title} lead={contactPage.newToArk.body} crumbs={[{ href: "/contact", label: "Contact" }]}>
        <a href="#form" className="btn-primary">Send us a message</a>
        <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="btn-outline">Get directions</a>
      </PageHero>

      <Section plain>
        <div className="grid gap-3 md:grid-cols-3">
          {contactPage.pillars.map((p, i) => (
            <Link key={`${i}-${p.title}`} href={p.href} className="panel group block p-6 transition-colors hover:border-white/20">
              <h2 className="text-lg font-semibold text-white group-hover:text-accent">{p.title}</h2>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section id="form">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <div className="space-y-8">
            <div>
              <p className="eyebrow mb-4">Contact</p>
              <h2 className="section-title">Contact us</h2>
              <p className="mt-4 text-muted">{contactPage.formIntro}</p>
            </div>
            <ul className="space-y-3">
              {channels.map(({ label, Icon, body }) => (
                <li key={label} className="tile flex gap-4 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-glow-blue"><Icon size={18} /></span>
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{label}</p>
                    <div className="mt-1">{body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="tile p-6 sm:p-8">
            <ContactForm defaultPurpose={purpose} ministry={m?.slug} ministryName={m?.name} />
          </div>
        </div>
      </Section>

      <Section panelClassName="overflow-hidden p-0 sm:p-0 lg:p-0">
        <div className="h-[420px] w-full">
          <iframe
            title={`Map to ${site.name}`}
            src={mapsEmbedUrl(site)}
            className="h-full w-full border-0 opacity-90 [filter:invert(0.9)_hue-rotate(180deg)_saturate(0.6)]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Section>
    </>
  );
}
