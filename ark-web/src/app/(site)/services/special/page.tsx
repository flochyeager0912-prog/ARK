import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { getSection } from "@/server/content";

export const metadata: Metadata = {
  title: "Other services",
  description: "Dawn service, night prayer, fasting prayer, 7 and 21 days of prayer and Special Sundays at The Ark Victory Church.",
  alternates: { canonical: "/services/special" },
};

export default async function OtherServicesPage() {
  const { otherServices, specialSundays } = await getSection("services");
  return (
    <>
      <PageHero eyebrow="Other services" title="Seek ye first the kingdom of God" lead="Dawn services, nights of prayer, seasons of fasting and Special Sundays — gatherings that shape our life together." />

      {otherServices.map((s, i) => (
        <Section key={s.slug} id={s.slug} tone={i % 2 ? "surface" : "white"}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className={i % 2 ? "lg:order-2" : undefined}>
              {s.when && <p className="eyebrow mb-3">{s.when}</p>}
              <h2 className="text-3xl font-semibold sm:text-4xl">{s.title}</h2>
              {s.verse && <p className="mt-3 font-display text-lg italic text-brand-600">“{s.verse}”</p>}
              <div className="prose-ark mt-5">
                {s.body.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
              </div>
              <Link href={`/contact?purpose=general`} className="btn-primary mt-6">Join {s.title}</Link>
            </div>
            {s.image ? (
              <Photo src={s.image.src} alt={s.image.alt} ratio={s.slug === "21-days-of-prayer" ? "1/1" : "4/3"} />
            ) : (
              <div className="hero-bg hidden aspect-[4/3] items-center justify-center rounded-3xl p-10 text-center text-white lg:flex">
                <p className="font-display text-3xl font-semibold">{s.title}</p>
              </div>
            )}
          </div>
        </Section>
      ))}

      <Section tone="navy" id="special-sundays">
        <div className="max-w-3xl">
          <p className="eyebrow mb-3 text-brand-300">Celebrations</p>
          <h2 className="text-3xl font-semibold sm:text-4xl">{specialSundays.title}</h2>
          <p className="mt-5 leading-relaxed text-white/80">{specialSundays.intro}</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {specialSundays.items.map((it) => (
            <article key={it.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold">{it.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{it.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 max-w-3xl leading-relaxed text-white/80">{specialSundays.outro}</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {specialSundays.images.map((img) => <Photo key={img.src} src={img.src} alt={img.alt} ratio="16/9" />)}
        </div>
      </Section>
    </>
  );
}
