import type { Metadata } from "next";
import { slugify } from "@/lib/utils";
import { PageHero, Section, SectionHeading } from "@/components/ui/section";
import { MinistryCard } from "@/components/home/sections";
import { ministryGroups } from "@/content/ministries";
import { getMinistries } from "@/server/content";

export const metadata: Metadata = {
  title: "Ministries",
  description: "Victory Kids, Tweens, Ark Arise, Hindi Church, Telugu Fellowship, International Fellowship, discipleship groups, missions, Rakshak and evangelistic events.",
  alternates: { canonical: "/ministries" },
};

export default async function MinistriesPage() {
  const ministries = await getMinistries();
  const groups = ministryGroups.map((g) => ({ group: g, items: ministries.filter((m) => m.group === g) })).filter((g) => g.items.length > 0);
  return (
    <>
      <PageHero
        eyebrow="Different ministries"
        title="There's a place for you at The Ark"
        lead="From kids church to language fellowships, discipleship groups to missions — find where you belong, grow and serve."
        crumbs={[{ href: "/ministries", label: "Ministries" }]}
      >
        {groups.map((g) => (
          <a key={g.group} href={`#${slugify(g.group)}`} className="chip transition-colors hover:border-white/30 hover:text-white">
            {g.group} <span className="text-accent">{g.items.length}</span>
          </a>
        ))}
      </PageHero>
      {groups.map(({ group, items }, gi) => (
        <Section key={group} id={slugify(group)}>
          <SectionHeading eyebrow={`${String(gi + 1).padStart(2, "0")} · Ministries`} title={group} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((m) => <MinistryCard key={m.slug} m={m} />)}
          </div>
        </Section>
      ))}
    </>
  );
}
