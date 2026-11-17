import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { getSection } from "@/server/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Other services",
  description: "Dawn service, night prayer, fasting prayer, 7 and 21 days of prayer and Special Sundays at The Ark Victory Church.",
  alternates: { canonical: "/services/special" },
};

export default async function OtherServicesPage() {
  const { otherServices, specialSundays } = await getSection("services");
  return (
    <>
      <PageHero
        eyebrow="Other services"
        title="Seek ye first the kingdom of God"
        lead="Dawn services, nights of prayer, seasons of fasting and Special Sundays — gatherings that shape our life together."
        crumbs={[{ href: "/services", label: "Services" }, { href: "/services/special", label: "Other services" }]}
      >
        {otherServices.map((s) => (
          <a key={s.slug} href={`#${s.slug}`} className="chip transition-colors hover:border-white/30 hover:text-white">{s.title}</a>
        ))}
        <a href="#special-sundays" className="chip transition-colors hover:border-white/30 hover:text-white">{specialSundays.title}</a>
      </PageHero>

      {otherServices.map((s, i) => (
        <Section key={s.slug} id={s.slug}>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className={cn(i % 2 && "lg:order-2")}>
              {s.when ? <p className="eyebrow mb-4">{s.when}</p> : <p className="num mb-4">{String(i + 1).padStart(2, "0")}</p>}
              <h2 className="section-title">{s.title}</h2>
              {s.verse && <p className="mt-4 font-display text-xl italic text-glow-gold">“{s.verse}”</p>}
              <div className="prose-ark mt-5">
                {s.body.map((p, j) => <p key={j}>{p}</p>)}
              </div>
              <Link href="/contact?purpose=general#form" className="btn-primary mt-6">Join {s.title}</Link>
            </div>
            {s.image ? (
              <Photo src={s.image.src} alt={s.image.alt} ratio={s.slug === "21-days-of-prayer" ? "1/1" : "4/3"} />
            ) : (
              <div className="tile hidden aspect-[4/3] items-center justify-center p-10 text-center lg:flex">
                <p className="text-gradient font-display text-4xl font-medium">{s.title}</p>
              </div>
            )}
          </div>
        </Section>
      ))}

      <Section id="special-sundays">
        <div className="max-w-3xl">
          <p className="eyebrow mb-4">Celebrations</p>
          <h2 className="section-title">{specialSundays.title}</h2>
          <p className="lead mt-5">{specialSundays.intro}</p>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {specialSundays.items.map((it, i) => (
            <article key={`${i}-${it.title}`} className="tile p-6">
              <p className="num">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-xl text-white">{it.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{it.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 max-w-3xl leading-relaxed text-muted">{specialSundays.outro}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {specialSundays.images.map((img, i) => <Photo key={`${i}-${img.src}`} src={img.src} alt={img.alt} ratio="16/9" />)}
        </div>
      </Section>
    </>
  );
}
