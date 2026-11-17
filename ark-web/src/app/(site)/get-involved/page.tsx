import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { getSection } from "@/server/content";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { intro } = await getSection("getInvolved");
  return { title: "Reach out in faith", description: intro, alternates: { canonical: "/get-involved" } };
}

export default async function GetInvolvedPage() {
  const getInvolved = await getSection("getInvolved");
  return (
    <>
      <PageHero eyebrow="Reach out in faith" title={getInvolved.title} lead={getInvolved.intro} crumbs={[{ href: "/get-involved", label: "Get involved" }]}>
        <Link href="/get-involved/volunteer" className="btn-primary">Volunteer with us</Link>
        {getInvolved.cards.map((c, i) => (
          <a key={`${i}-${c.key}`} href={`#${c.key}`} className="chip transition-colors hover:border-white/30 hover:text-white">{c.title}</a>
        ))}
      </PageHero>

      {getInvolved.cards.map((c, i) => (
        <Section key={`${i}-${c.key}`} id={c.key}>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className={cn(i % 2 && "lg:order-2")}>
              <p className="eyebrow mb-4">{String(c.number).padStart(2, "0")} · {c.subtitle ?? "Serve"}</p>
              <h2 className="section-title">{c.title}</h2>
              <p className="mt-5 leading-relaxed text-muted">{c.body}</p>
              <Link href={c.cta.href} className="btn-primary mt-6">{c.cta.label}</Link>
            </div>
            <Photo src={c.image.src} alt={c.image.alt} ratio="4/3" />
          </div>
        </Section>
      ))}

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Photo src={getInvolved.about.image.src} alt={getInvolved.about.image.alt} ratio="16/9" />
          <div>
            <p className="eyebrow mb-4">The Ark</p>
            <h2 className="section-title">{getInvolved.about.title}</h2>
            <p className="mt-4 text-muted">{getInvolved.about.body}</p>
            <Link href="/about" className="btn-outline mt-6">Know more about us</Link>
          </div>
        </div>
      </Section>
    </>
  );
}
