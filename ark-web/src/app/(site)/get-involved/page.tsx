import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { getSection } from "@/server/content";

export async function generateMetadata(): Promise<Metadata> {
  const { intro } = await getSection("getInvolved");
  return { title: "Reach out in faith", description: intro, alternates: { canonical: "/get-involved" } };
}

export default async function GetInvolvedPage() {
  const getInvolved = await getSection("getInvolved");
  return (
    <>
      <PageHero eyebrow="Reach out in faith" title={getInvolved.title} lead={getInvolved.intro}>
        <Link href="/get-involved/volunteer" className="btn-light">Volunteer with us</Link>
      </PageHero>

      {getInvolved.cards.map((c, i) => (
        <Section key={c.key} id={c.key} tone={i % 2 ? "surface" : "white"}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className={i % 2 ? "lg:order-2" : undefined}>
              <p className="eyebrow mb-3">{String(c.number).padStart(2, "0")} · {c.subtitle ?? "Serve"}</p>
              <h2 className="text-3xl font-semibold sm:text-4xl">{c.title}</h2>
              <p className="mt-5 leading-relaxed text-muted">{c.body}</p>
              <Link href={c.cta.href} className="btn-primary mt-6">{c.cta.label}</Link>
            </div>
            <Photo src={c.image.src} alt={c.image.alt} ratio="4/3" />
          </div>
        </Section>
      ))}

      <Section tone="navy">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Photo src={getInvolved.about.image.src} alt={getInvolved.about.image.alt} ratio="16/9" />
          <div>
            <h2 className="text-3xl font-semibold">{getInvolved.about.title}</h2>
            <p className="mt-4 text-white/80">{getInvolved.about.body}</p>
            <Link href="/about" className="btn-light mt-6">Know more about us</Link>
          </div>
        </div>
      </Section>
    </>
  );
}
