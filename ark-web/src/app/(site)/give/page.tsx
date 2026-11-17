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

const STEPS = ["Open any UPI / bank app and scan the QR code.", "Enter the amount you wish to give.", "Mention “tithe” or “offering” in the note."];

export default async function GivePage() {
  const [site, giving] = await Promise.all([getSite(), getSection("giving")]);
  return (
    <>
      <PageHero eyebrow={giving.eyebrow} title={giving.title} lead={`${giving.headline}. ${giving.subline}.`} crumbs={[{ href: "/get-involved", label: "Get involved" }, { href: "/give", label: "Givings" }]}>
        <a href="#tithes" className="btn-primary">Give now</a>
        <a href="#building-fund" className="btn-outline">Building fund</a>
      </PageHero>

      <Section id="tithes">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="eyebrow mb-4">Tithes & offerings</p>
            <h2 className="section-title">Excitement in sowing, giving & obeying</h2>
            <p className="mt-4 font-display text-xl italic text-glow-gold">“Obedience is better than sacrifice.” <span className="font-mono text-xs not-italic text-muted">— {giving.verseRef}</span></p>
            <ol className="mt-8 space-y-3">
              {STEPS.map((step, i) => (
                <li key={step} className="tile flex items-center gap-4 p-4">
                  <span className="num w-6">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-ink">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-muted">
              Payments go to <strong className="text-white">{giving.qr.payee}</strong>. For questions about giving, call{" "}
              <a href={`tel:${site.contact.phoneE164}`} className="text-white underline underline-offset-4">{site.contact.phoneDisplay}</a> or{" "}
              <Link href="/contact?purpose=building-fund#form" className="text-white underline underline-offset-4">contact the church office</Link>.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md rounded-2xl border border-line bg-white p-4 shadow-[0_30px_80px_-30px_rgb(157_177_255/0.45)]">
            <Image src={giving.qr.src} alt={giving.qr.alt} width={579} height={475} className="h-auto w-full" priority />
            <p className="mt-3 text-center text-sm text-slate-600">{giving.qr.instructions}</p>
          </div>
        </div>
      </Section>

      <Section id="building-fund">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Photo src={giving.buildingFund.image} alt="The Ark Victory Church building" ratio="4/3" />
          <div>
            <p className="eyebrow mb-4">Building fund</p>
            <h2 className="section-title">{giving.buildingFund.title}</h2>
            <p className="mt-5 leading-relaxed text-muted">{giving.buildingFund.body}</p>
            <p className="mt-4 text-sm text-muted">Use the QR code above and mention “building fund” in the note, or tell us you&apos;d like to give.</p>
            <Link href="/contact?purpose=building-fund#form" className="btn-primary mt-6"><IconHeart size={16} /> Donate to the building fund</Link>
          </div>
        </div>
      </Section>

      <Section id="rakshak" panelClassName="overflow-hidden p-0 sm:p-0 lg:p-0">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-72 lg:min-h-full">
            <Image src={giving.rakshak.image} alt="Rakshak children" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="p-8 sm:p-12">
            <p className="eyebrow mb-4">{giving.rakshak.title}</p>
            <h2 className="section-title">{giving.rakshak.tagline}</h2>
            <p className="mt-4 text-muted">{giving.rakshak.body}</p>
            <a href={site.external.rakshak} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6">
              Donate at rakshak.org.in <IconExternal size={14} />
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}
