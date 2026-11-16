import type { Metadata } from "next";
import Link from "next/link";
import { getServices } from "@/server/queries";
import { describeSchedule, describeTimeRange } from "@/lib/time";
import { PageHero, Section } from "@/components/ui/section";
import { IconBroadcast, IconYouTube } from "@/components/ui/icons";
import { getSection, getSite } from "@/server/content";

export const metadata: Metadata = {
  title: "Live worship",
  description: "Join The Ark Victory Church online — our 8 AM Tamil and 10 AM English Sunday services are streamed live on YouTube.",
  alternates: { canonical: "/watch" },
};

export default async function WatchPage() {
  const [site, { liveWorship }] = await Promise.all([getSite(), getSection("services")]);
  const streamed = (await getServices()).filter((s) => s.livestream);
  return (
    <>
      <PageHero eyebrow="The Ark Victory Church Online" title={liveWorship.title} lead={liveWorship.body[0]}>
        <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" className="btn-light">
          <IconYouTube size={18} className="text-red-600" /> Let&apos;s worship on YouTube
        </a>
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="aspect-video overflow-hidden rounded-3xl bg-navy-950 shadow-card">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${site.featuredVideoId}`}
                title="The Ark Victory Church service"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <p className="mt-4 text-sm text-muted">
              Live services appear on our{" "}
              <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 underline">YouTube channel</a>{" "}
              every Sunday. Subscribe and turn on notifications so you never miss a service.
            </p>
          </div>
          <aside className="space-y-5">
            <div className="card p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold"><IconBroadcast className="text-red-500" /> Streamed live</h2>
              <ul className="mt-4 divide-y divide-line">
                {streamed.map((s) => (
                  <li key={s.id} className="py-3">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-muted">{describeSchedule(s)} · {describeTimeRange(s)}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-6">
              <h2 className="text-lg font-semibold">{liveWorship.power.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{liveWorship.body[1]}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{liveWorship.power.body}</p>
              <Link href="/contact?purpose=prayer-request" className="btn-outline mt-4">Send a prayer request</Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
