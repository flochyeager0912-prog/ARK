import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { slugify } from "@/lib/utils";
import { PageHero, Section, SectionHeading } from "@/components/ui/section";
import { ministryGroups } from "@/content/ministries";
import { getMinistries } from "@/server/content";

export const metadata: Metadata = {
  title: "Ministries",
  description: "Victory Kids, Tweens, Ark Arise, Hindi Church, Telugu Fellowship, International Fellowship, discipleship groups, missions, Rakshak and evangelistic events.",
  alternates: { canonical: "/ministries" },
};

export default async function MinistriesPage() {
  const ministries = await getMinistries();
  return (
    <>
      <PageHero eyebrow="Different ministries" title="There's a place for you at The Ark" lead="From kids church to language fellowships, discipleship groups to missions — find where you belong, grow and serve." />
      {ministryGroups.map((group, gi) => (
        <Section key={group} id={slugify(group)} tone={gi % 2 ? "surface" : "white"}>
          <SectionHeading title={group} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ministries
              .filter((m) => m.group === group)
              .map((m) => (
                <Link key={m.slug} href={`/ministries/${m.slug}`} className="card card-hover group flex flex-col overflow-hidden">
                  <div className="relative aspect-[16/10] bg-brand-50">
                    <Image src={m.image.src} alt={m.image.alt} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-300 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{m.ageRange ?? m.tagline}</p>
                    <h3 className="mt-2 text-xl font-semibold group-hover:text-brand-600">{m.name}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted">{m.summary}</p>
                    {m.schedule && <p className="mt-4 text-sm font-medium text-navy-800">{m.schedule}</p>}
                  </div>
                </Link>
              ))}
          </div>
        </Section>
      ))}
    </>
  );
}
