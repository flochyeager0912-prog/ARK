import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { IconExternal, IconHeart } from "@/components/ui/icons";
import { getSection, getSite } from "@/server/content";

export const metadata: Metadata = {
  title: "Givings",
  description: "Give your tithes and offerings to The Ark Victory Church by scanning our QR code, support the building fund, or donate to Rakshak.",
  alternates: { canonical: "/give" },
};

export default async function GivePage() {
  const [site, giving] = await Promise.all([getSite(), getSection("giving")]);
  return (
    <>
      <PageHero eyebrow={giving.eyebrow} title={giving.title} lead={`${giving.headline}. ${giving.subline}.`} />

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Tithes & offerings</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">Excitement in sowing, giving & obeying</h2>
            <p className="mt-3 font-display text-xl italic text-brand-600">“Obedience is better than sacrifice.” <span className="text-sm not-italic text-muted">— {giving.verseRef}</span></p>
            <ol className="mt-8 space-y-4">
              {["Open any UPI / bank app and scan the QR code.", "Enter the amount you wish to give.", "Mention “tithe” or “offering” in the note."].map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{i + 1}</span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-muted">
              Payments go to <strong>{giving.qr.payee}</strong>. For questions about giving, call {site.contact.phoneDisplay} or{" "}
              <Link href="/contact?purpose=building-fund" className="underline">contact the church office</Link>.
            </p>
          </div>
          <div className="card mx-auto w-full max-w-md p-4">
            <Image src={giving.qr.src} alt={giving.qr.alt} width={579} height={475} className="h-auto w-full" priority />
            <p className="mt-3 text-center text-sm text-muted">{giving.qr.instructions}</p>
          </div>
        </div>
      </Section>

      <Section tone="surface" id="building-fund">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Photo src={giving.buildingFund.image} alt="The Ark Victory Church building" ratio="4/3" />
          <div>
            <p className="eyebrow mb-3">Building fund</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{giving.buildingFund.title}</h2>
            <p className="mt-5 leading-relaxed text-muted">{giving.buildingFund.body}</p>
            <p className="mt-4 text-sm text-muted">Use the QR code above and mention “building fund” in the note, or tell us you&apos;d like to give.</p>
            <Link href="/contact?purpose=building-fund" className="btn-primary mt-6"><IconHeart size={18} /> Donate to the building fund</Link>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid items-center gap-12 overflow-hidden rounded-3xl bg-navy-900 text-white lg:grid-cols-2">
          <div className="relative min-h-72 lg:self-stretch">
            <Image src={giving.rakshak.image} alt="Rakshak children" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="p-8 sm:p-12">
            <p className="eyebrow mb-3 text-brand-300">{giving.rakshak.title}</p>
            <h2 className="text-3xl font-semibold">{giving.rakshak.tagline}</h2>
            <p className="mt-4 text-white/75">{giving.rakshak.body}</p>
            <a href={site.external.rakshak} target="_blank" rel="noopener noreferrer" className="btn-light mt-6">
              Donate at rakshak.org.in <IconExternal size={16} />
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
