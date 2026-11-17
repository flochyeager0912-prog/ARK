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
      <PageHero eyebrow="The Ark Victory Church Online" title={liveWorship.title} lead={liveWorship.body[0]} crumbs={[{ href: "/services", label: "Services" }, { href: "/watch", label: "Live worship" }]}>
        <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" className="btn-primary">
          <IconYouTube size={18} /> Let&apos;s worship on YouTube
        </a>
      </PageHero>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-night-950">
              {site.featuredVideoId ? (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${site.featuredVideoId}`}
                  title="The Ark Victory Church service"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" className="grid h-full w-full place-items-center text-muted hover:text-white">
                  <span className="flex items-center gap-2"><IconYouTube size={22} /> Watch on our YouTube channel</span>
                </a>
              )}
            </div>
            <p className="mt-4 text-sm text-muted">
              Live services appear on our{" "}
              <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-4">YouTube channel</a>{" "}
              every Sunday. Subscribe and turn on notifications so you never miss a service.
            </p>
          </div>
          <aside className="space-y-4">
            <div className="tile p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><IconBroadcast className="text-red-400" /> Streamed live</h2>
              {streamed.length > 0 ? (
                <ul className="mt-4 divide-y divide-line">
                  {streamed.map((s) => (
                    <li key={s.id} className="py-3">
                      <p className="font-semibold text-white">{s.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted">{describeSchedule(s)} · {describeTimeRange(s)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">Streamed services will be listed here soon.</p>
              )}
            </div>
            <div className="tile p-6">
              <h2 className="text-lg font-semibold text-white">{liveWorship.power.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{liveWorship.body[1]}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{liveWorship.power.body}</p>
              <Link href="/contact?purpose=prayer-request#form" className="btn-outline mt-5">Send a prayer request</Link>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
