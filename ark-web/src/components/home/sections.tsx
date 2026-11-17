import Link from "next/link";
import Image from "next/image";
import type { Announcement, Service } from "@prisma/client";
import type { PublicEvent } from "@/server/queries";
import type { Sections } from "@/content/sections";
import type { Ministry } from "@/content/ministries";
import { ministryGroups } from "@/content/ministries";
import { mapsDirectionsUrl, type SiteContent } from "@/content/site";
import { formatLongDate, formatTime, relativeDay } from "@/lib/time";
import { safeHref, slugify } from "@/lib/utils";
import { EmailText, Flow, Meta, NumberedTile, Section, SectionHeading } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { Tabs } from "@/components/ui/tabs";
import { ServiceCard } from "@/components/site/service-list";
import { EventCard } from "@/components/site/event-card";
import { IconArrowRight, IconExternal, IconMail, IconPhone, IconPin, IconPlay, IconWhatsApp } from "@/components/ui/icons";

/* ------------------------------------------------------------------ hero */

export function Hero({
  site,
  home,
  pillarsTitle,
  next,
}: {
  site: SiteContent;
  home: Sections["home"];
  pillarsTitle: string;
  next: { service: Service; at: Date } | null;
}) {
  const soon = next ? relativeDay(next.at) : null;
  return (
    <section id="top" className="container-page flex min-h-[100svh] items-center pb-10 pt-24 sm:pt-28">
      <div className="panel stagger w-full max-w-[42rem] p-7 sm:p-10 lg:p-12">
        <span aria-hidden className="absolute -top-3 left-6 h-1.5 w-2/5 rounded-full bg-gradient-to-r from-glow-blue/50 to-glow-blue/0" />
        <p className="eyebrow">{site.denomination} · {site.address.locality}, {site.address.city}</p>
        <h1 className="text-gradient mt-5 pb-2 font-display text-[2.7rem] font-medium leading-[1.02] min-[400px]:text-[3rem] tracking-[-0.03em] sm:text-7xl lg:text-[4.9rem]">
          {home.whereChurchIsFamily.title}
        </h1>
        <p className="mt-4 text-xl font-semibold text-white sm:text-2xl">{site.name}</p>
        <p className="mt-2 font-mono text-sm text-accent">{pillarsTitle} · {site.anniversaryYears} years of faithfulness</p>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink/85 sm:text-lg">{home.whereChurchIsFamily.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#services" className="btn-primary px-6">Join this Sunday <IconArrowRight size={16} /></a>
          <Link href="/watch" className="btn-outline px-6"><IconPlay size={16} /> Watch live</Link>
        </div>
        {next && (
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5">
            <Meta label="Next service">
              {next.service.name} · {formatLongDate(next.at)}, {formatTime(next.at)}
            </Meta>
            {soon && <span className="chip border-glow-blue/30 text-glow-blue">{soon}</span>}
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-muted">
          <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-white">YouTube</a>
          <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>
          <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a>
          <span className="ml-auto hidden font-mono text-[11px] uppercase tracking-[0.24em] text-muted/70 sm:inline">Scroll — discover The Ark</span>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- announcements */

export function Announcements({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;
  return (
    <Section plain className="pt-0 sm:pt-0">
      <div aria-label="Announcements" role="region" className="panel divide-y divide-line px-6 sm:px-8">
        {items.map((a) => {
          const href = safeHref(a.linkUrl);
          return (
            <div key={a.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[15px]">
                <span className="mr-3 font-mono text-[10px] uppercase tracking-[0.2em] text-glow-gold">Notice</span>
                <span className="font-semibold text-white">{a.title}</span>
                {a.body && <span className="text-muted"> — {a.body}</span>}
              </p>
              {href && (
                <Link href={href} className="shrink-0 text-sm font-semibold text-accent hover:underline">
                  {a.linkLabel || "Learn more"} →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ about */

export function About({ home, about }: { home: Sections["home"]; about: Sections["about"] }) {
  const { anniversary, welcome } = home;
  const { loveGodLovePeople: lglp, pastors } = about;
  return (
    <Section id="about">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
        <div>
          <p className="eyebrow mb-4">About us · {anniversary.eyebrow}</p>
          <h2 className="section-title">{anniversary.title}</h2>
          <p className="lead mt-5">{anniversary.body}</p>
          <h3 className="mt-10 text-xl text-white">{welcome.title}</h3>
          <div className="prose-ark mt-4">
            {welcome.body.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
        <article className="tile self-start overflow-hidden">
          <Photo src={pastors.image} alt={`${pastors.names}, senior pastors of ${anniversary.eyebrow}`} ratio="4/3" className="rounded-none border-0 border-b" sizes="(min-width:1024px) 40vw, 100vw" />
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="eyebrow">{pastors.eyebrow}</p>
              <span className="chip">{pastors.title}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-medium text-balance text-white">{pastors.names}</p>
            <blockquote className="mt-4 border-l border-glow-gold/50 pl-4 font-display text-lg italic leading-snug text-ink/85">“{pastors.quote}”</blockquote>
            <p className="mt-4 text-sm font-semibold text-white">{pastors.tagline}</p>
            <p className="text-sm text-muted">{pastors.subTagline}</p>
          </div>
        </article>
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <p className="mb-5 text-lg text-ink">{lglp.intro}…</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {lglp.pillars.map((p, i) => <NumberedTile key={`${i}-${p.title}`} n={i + 1} title={p.title}>{p.body}</NumberedTile>)}
        </div>
      </div>

      <Flow
        className="mt-10"
        items={[
          { label: "About us", href: "/about" },
          { label: "Our mission", href: "/about/mission" },
          { label: "Our journey", href: "/about/journey" },
          { label: "Gallery", href: "/gallery" },
        ]}
      />
    </Section>
  );
}

/* ---------------------------------------------------------------- journey */

export function Journey({ journey }: { journey: Sections["journey"] }) {
  const { intro, milestones } = journey;
  return (
    <Section id="journey">
      <SectionHeading
        eyebrow="Our journey"
        title={intro.title}
        lead={<>“{intro.verse.text}” <span className="font-mono text-sm text-accent">— {intro.verse.reference}</span></>}
        action={<Link href="/about/journey" className="btn-outline">The full story</Link>}
      />
      <Tabs
        label="Milestones in our journey"
        items={milestones.map((m, i) => ({
          key: `${i}-${m.year}`,
          label: m.year,
          hint: m.title,
          panel: (
            <article className="tile overflow-hidden">
              {m.image && <Photo src={m.image.src} alt={m.image.alt} ratio="16/9" fit="contain" className="rounded-none border-0 border-b" sizes="(min-width:1024px) 40vw, 100vw" />}
              <div className="p-6">
                <p className="font-mono text-sm text-glow-gold">{m.year}</p>
                <h3 className="mt-1 text-xl text-white">{m.title}</h3>
                <div className="prose-ark mt-3 text-[15px]">
                  {m.body.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            </article>
          ),
        }))}
      />
    </Section>
  );
}

/* --------------------------------------------------------------- services */

const CATEGORIES: { key: Service["category"]; label: string; hint: string }[] = [
  { key: "SUNDAY", label: "Sunday services", hint: "Every Sunday" },
  { key: "FELLOWSHIP", label: "Language fellowships", hint: "Heart language" },
  { key: "CHILDREN", label: "Children & youth", hint: "Ages 3 and up" },
  { key: "MONTHLY", label: "Monthly gatherings", hint: "Dawn & night prayer" },
];

export function Services({ site, services, intro }: { site: SiteContent; services: Service[]; intro: Sections["services"]["intro"] }) {
  const groups = CATEGORIES.map((c) => ({ ...c, items: services.filter((s) => s.category === c.key) })).filter((g) => g.items.length > 0);
  return (
    <Section id="services">
      <SectionHeading
        eyebrow={intro.title}
        title={intro.lead}
        lead={intro.body}
        action={
          <a href={mapsDirectionsUrl(site)} target="_blank" rel="noopener noreferrer" className="btn-outline">
            <IconPin size={16} /> Get directions
          </a>
        }
      />
      {groups.length > 0 ? (
        <Tabs
          layout="top"
          label="Service categories"
          items={groups.map((g) => ({
            key: g.key,
            label: g.label,
            panel: (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {g.items.map((s) => <ServiceCard key={s.id} s={s} />)}
              </div>
            ),
          }))}
        />
      ) : (
        <p className="tile p-6 text-muted">Service times will be published soon. Call us on {site.contact.phoneDisplay}.</p>
      )}

      <div className="mt-10 grid items-center gap-8 border-t border-line pt-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-4">Live worship</p>
          <h3 className="font-display text-3xl font-medium text-white">{intro.online.title}</h3>
          <p className="lead mt-4">{intro.online.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/watch" className="btn-primary"><IconPlay size={16} /> Watch online</Link>
            <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" className="btn-outline">YouTube channel <IconExternal size={14} /></a>
          </div>
        </div>
        <Link href="/watch" className="group relative block" aria-label="Watch our services online">
          <Photo src="/images/collage-sunday.webp" alt="Sunday worship at The Ark" ratio="16/9" zoom />
          <span className="absolute inset-0 grid place-items-center rounded-2xl bg-night-950/30 transition-colors duration-500 group-hover:bg-night-950/45">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-transform duration-500 ease-(--ease-out-soft) group-hover:scale-110">
              <IconPlay size={26} />
            </span>
          </span>
        </Link>
      </div>

      <Flow
        className="mt-10"
        items={[
          { label: "All service times", href: "/services" },
          { label: "Other services", href: "/services/special" },
          { label: "Live worship", href: "/watch" },
        ]}
      />
    </Section>
  );
}

/* ------------------------------------------------------------- ministries */

/**
 * Ministry card. A subgrid of its parent grid, so the label, title, summary and links of cards
 * sitting side by side line up exactly even when one label or title wraps to two lines.
 */
export function MinistryCard({ m }: { m: Ministry }) {
  return (
    <Link href={`/ministries/${m.slug}`} className="tile-link group row-span-6 grid grid-rows-subgrid gap-0 overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden border-b border-line">
        <Image src={m.image.src} alt={m.image.alt} fill sizes="(min-width:1024px) 30vw, (min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 ease-(--ease-out-soft) group-hover:scale-[1.04]" />
      </div>
      <p className="px-5 pt-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.16em] text-accent">{m.ageRange ?? m.tagline}</p>
      <h3 className="mt-1.5 px-5 text-lg text-white">{m.name}</h3>
      <p className="mt-2 px-5 text-sm leading-relaxed text-muted">{m.summary}</p>
      <p className="px-5 pt-4 text-xs text-ink/75 empty:pt-0">{m.schedule}</p>
      <span className="inline-flex items-center gap-1 px-5 pb-5 pt-4 text-sm font-semibold text-accent">
        Explore <IconArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function Ministries({ ministries }: { ministries: Ministry[] }) {
  const groups = ministryGroups.map((g) => ({ group: g, items: ministries.filter((m) => m.group === g) })).filter((g) => g.items.length > 0);
  return (
    <Section id="ministries">
      <SectionHeading
        eyebrow="Different ministries"
        title="There’s a place for you at The Ark"
        lead="From kids church to language fellowships, discipleship groups to missions — find where you belong, grow and serve."
        action={<Link href="/ministries" className="btn-outline">All ministries</Link>}
      />
      <Tabs
        layout="top"
        label="Ministry groups"
        items={groups.map((g) => ({
          key: slugify(g.group),
          label: g.group,
          panel: (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((m) => <MinistryCard key={m.slug} m={m} />)}
            </div>
          ),
        }))}
      />
    </Section>
  );
}

/* ----------------------------------------------------------------- events */

export function Events({ events, ministries }: { events: PublicEvent[]; ministries: Ministry[] }) {
  const name = (slug: string | null) => (slug ? ministries.find((m) => m.slug === slug)?.name : undefined);
  return (
    <Section id="events">
      <SectionHeading
        eyebrow="What’s coming up"
        title="Upcoming events"
        lead="Youth nights, camps, special Sundays and outreach — register online in under a minute."
        action={<Link href="/events" className="btn-outline">All events</Link>}
      />
      {events.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => <EventCard key={e.id} event={e} tag={name(e.ministrySlug)} />)}
        </div>
      ) : (
        <p className="tile p-8 text-center text-muted">New events will be announced soon. Follow us on Instagram for updates.</p>
      )}
    </Section>
  );
}

/* ----------------------------------------------------------- get involved */

export function GetInvolved({ site, getInvolved, giving, hasRakshak }: { site: SiteContent; getInvolved: Sections["getInvolved"]; giving: Sections["giving"]; hasRakshak: boolean }) {
  return (
    <Section id="involved">
      <SectionHeading eyebrow="Reach out in faith" title={getInvolved.title} lead={getInvolved.intro} action={<Link href="/get-involved" className="btn-outline">Ways to serve</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {getInvolved.cards.map((c, i) => (
          <Link key={`${i}-${c.key}`} href={c.cta.href} className="tile-link group row-span-5 grid grid-rows-subgrid gap-0 overflow-hidden">
            <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
              <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width:1024px) 22vw, (min-width:640px) 45vw, 100vw" className="object-cover transition-transform duration-700 ease-(--ease-out-soft) group-hover:scale-[1.04]" />
            </div>
            <p className="num px-5 pt-5 leading-relaxed">{String(c.number).padStart(2, "0")} · {c.subtitle ?? "Serve"}</p>
            <h3 className="mt-1.5 px-5 text-lg text-white">{c.title}</h3>
            <p className="mt-2 px-5 text-sm leading-relaxed text-muted">{c.body}</p>
            <span className="inline-flex items-center gap-1 px-5 pb-5 pt-4 text-sm font-semibold text-accent">
              {c.cta.label} <IconArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      <div className={`mt-10 grid gap-4 border-t border-line pt-10 ${hasRakshak ? "lg:grid-cols-2" : ""}`}>
        <div className="tile flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="relative mx-auto aspect-[579/475] w-40 shrink-0 overflow-hidden rounded-xl bg-white sm:mx-0">
            <Image src={giving.qr.src} alt={giving.qr.alt} fill sizes="160px" className="object-contain" />
          </div>
          <div>
            <p className="eyebrow">{giving.eyebrow}</p>
            <h3 className="mt-3 font-display text-2xl font-medium text-white">{giving.title}</h3>
            <p className="mt-2 text-sm text-muted">{giving.headline}. “{giving.subline}.” <span className="whitespace-nowrap font-mono text-xs text-accent">{giving.verseRef}</span></p>
            <Link href="/give" className="btn-primary mt-5 px-5 py-2.5">Give online</Link>
          </div>
        </div>
        {hasRakshak && (
          <div className="tile relative overflow-hidden">
            <Image src={giving.rakshak.image} alt="Rakshak children" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover opacity-30" />
            <div className="relative bg-gradient-to-r from-night-950/90 to-night-950/40 p-6 sm:p-8">
              <p className="eyebrow">{giving.rakshak.title}</p>
              <h3 className="mt-3 font-display text-2xl font-medium text-white">{giving.rakshak.tagline}</h3>
              <p className="mt-2 max-w-md text-sm text-ink/80">{giving.rakshak.body}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={site.external.rakshak} target="_blank" rel="noopener noreferrer" className="btn-primary px-5 py-2.5">Donate to Rakshak <IconExternal size={14} /></a>
                <Link href="/ministries/rakshak" className="btn-outline px-5 py-2.5">Learn more</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- contact */

export function Contact({ site, contact }: { site: SiteContent; contact: Sections["contact"] }) {
  const channels = [
    { label: "Call us", value: site.contact.phoneDisplay, href: `tel:${site.contact.phoneE164}`, Icon: IconPhone },
    { label: "WhatsApp", value: "Message us", href: `https://wa.me/${site.contact.whatsappE164}`, Icon: IconWhatsApp, external: true },
    { label: "Email", value: site.contact.email, href: `mailto:${site.contact.email}`, Icon: IconMail },
    { label: "Visit", value: `${site.address.locality}, ${site.address.city}`, href: mapsDirectionsUrl(site), Icon: IconPin, external: true },
  ];
  return (
    <Section id="contact">
      <SectionHeading eyebrow={contact.newToArk.eyebrow} title={contact.newToArk.title} lead={contact.newToArk.body} />
      {/* Two wide columns up to xl; on xl the icon sits above the text and the email column is wider,
          so every value stays on one line. */}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.15fr)]">
        {channels.map(({ label, value, href, Icon, external }) => (
          <li key={label} className="min-w-0">
            <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="tile-link group flex h-full items-start gap-4 p-5 xl:flex-col xl:gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-glow-blue transition-colors group-hover:border-glow-blue/40">
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{label}</span>
                <span className="mt-1.5 block break-words font-semibold text-white">{label === "Email" ? <EmailText email={value} /> : value}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">{site.address.full}</p>

      <div className="mt-10 border-t border-line pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-lg text-ink">Find your place</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact#form" className="btn-primary">Send us a message</Link>
            <Link href="/contact?purpose=prayer-request#form" className="btn-outline">Prayer request</Link>
          </div>
        </div>
        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {contact.pillars.map((p, i) => (
            <li key={`${i}-${p.title}`}>
              <Link href={p.href} className="tile-link group flex h-full flex-col p-5">
                <h3 className="text-[17px] text-white">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.body}</p>
                <IconArrowRight size={16} className="mt-4 text-accent transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
