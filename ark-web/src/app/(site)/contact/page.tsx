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

  return (
    <>
      <PageHero eyebrow={contactPage.newToArk.eyebrow} title={contactPage.newToArk.title} lead={contactPage.newToArk.body} />

      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {contactPage.pillars.map((p) => (
            <Link key={p.title} href={p.href} className="card card-hover group p-6 hover:border-brand-300">
              <h2 className="text-lg font-semibold group-hover:text-brand-600">{p.title}</h2>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section tone="surface" id="form">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-semibold">Contact us</h2>
              <p className="mt-3 text-muted">{contactPage.formIntro}</p>
            </div>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><IconPhone /></span>
                <div>
                  <p className="text-sm text-muted">Call us</p>
                  <a href={`tel:${site.contact.phoneE164}`} className="font-semibold hover:text-brand-600">{site.contact.phoneDisplay}</a>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><IconWhatsApp /></span>
                <div>
                  <p className="text-sm text-muted">WhatsApp</p>
                  <a href={`https://wa.me/${site.contact.whatsappE164}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-brand-600">Message us on WhatsApp</a>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><IconMail /></span>
                <div className="min-w-0">
                  <p className="text-sm text-muted">Email</p>
                  <a href={`mailto:${site.contact.email}`} className="block break-all font-semibold hover:text-brand-600">{site.contact.email}</a>
                  <a href={`mailto:${site.contact.secondaryEmail}`} className="block break-all text-sm text-muted hover:text-brand-600">{site.contact.secondaryEmail}</a>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><IconPin /></span>
                <div>
                  <p className="text-sm text-muted">Visit us</p>
                  <address className="font-semibold not-italic">{site.address.full}</address>
                  <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-600 hover:underline">Get directions →</a>
                </div>
              </li>
            </ul>
          </div>
          <div className="card p-6 sm:p-8">
            <ContactForm defaultPurpose={purpose} ministry={m?.slug} ministryName={m?.name} />
          </div>
        </div>
      </Section>

      <section aria-label="Map" className="h-[420px] w-full bg-surface">
        <iframe
          title={`Map to ${site.name}`}
          src={mapsEmbedUrl(site)}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </section>
    </>
  );
}
