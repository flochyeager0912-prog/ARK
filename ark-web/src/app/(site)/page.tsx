import Link from "next/link";
import Image from "next/image";
import { getActiveAnnouncements, getNextService, getServices, getUpcomingEvents } from "@/server/queries";
import { formatLongDate, formatTime } from "@/lib/time";
import { safeHref } from "@/lib/utils";
import { Section, SectionHeading } from "@/components/ui/section";
import { Photo } from "@/components/ui/photo";
import { ServiceCard } from "@/components/site/service-list";
import { EventCard } from "@/components/site/event-card";
import { VisitCta } from "@/components/site/cta-band";
import { IconArrowRight, IconClock, IconPlay, IconYouTube } from "@/components/ui/icons";
import { getSection, getSite } from "@/server/content";

export default async function HomePage() {
  const [site, home, ministriesSection, servicesContent, giving] = await Promise.all([getSite(), getSection("home"), getSection("ministries"), getSection("services"), getSection("giving")]);
  const { anniversary, welcome, whereChurchIsFamily } = home;
  const ministries = ministriesSection.items;
  const servicesIntro = servicesContent.intro;
  const [services, next, events, announcements] = await Promise.all([
    getServices(),
    getNextService(),
    getUpcomingEvents(3),
    getActiveAnnouncements(),
  ]);
  const sunday = services.filter((s) => s.category === "SUNDAY");
  const fellowships = ministries.filter((m) => m.group === "Language fellowships");
  const kidsYouth = ministries.filter((m) => m.group === "Children & youth");
  const rakshak = ministries.find((m) => m.slug === "rakshak");

  return (
    <>
      {/* Hero */}
      <section className="hero-bg relative overflow-hidden text-white">
        <div aria-hidden className="hero-glow pointer-events-none absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-brand-500/30 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 pb-16 pt-28 sm:pt-36 lg:grid-cols-[1.15fr_1fr] lg:pb-24">
          <div className="stagger">
            <p className="eyebrow mb-4 text-brand-300">{anniversary.eyebrow} · Sembakkam, Chennai</p>
            <h1 className="text-4xl font-semibold leading-[1.05] sm:text-6xl">
              Where church <span className="text-brand-300">is family</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{whereChurchIsFamily.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services" className="btn-light">
                Join this Sunday <IconArrowRight size={16} />
              </Link>
              <Link href="/watch" className="btn-ghost-light">
                <IconPlay size={18} /> Watch live
              </Link>
            </div>
            {next && (
              <div className="mt-10 inline-flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 px-5 py-4 backdrop-blur">
                <IconClock size={22} className="text-brand-300" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-white/60">Next service</p>
                  <p className="font-semibold">
                    {next.service.name} · {formatLongDate(next.at)}, {formatTime(next.at)}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="relative hidden sm:block">
            <div className="grid grid-cols-2 gap-4 animate-[page-in_0.9s_var(--ease-out-soft)_0.25s_both]">
              <Photo src="/images/sunday-worship-1.webp" alt="Ps. Jay Kumar preaching at a Sunday service" ratio="4/5" priority sizes="(min-width:1024px) 22vw, 45vw" />
              <div className="mt-12 space-y-4">
                <Photo src="/images/kids-church-worship-2.webp" alt="Kids church worship leaders" ratio="4/5" sizes="(min-width:1024px) 22vw, 45vw" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section aria-label="Announcements" className="border-b border-line bg-brand-50">
          <div className="container-page divide-y divide-brand-100">
            {announcements.map((a) => {
              const href = safeHref(a.linkUrl);
              return (
                <div key={a.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-navy-800">
                    <span className="font-semibold">{a.title}</span>
                    {a.body && <span className="text-muted"> — {a.body}</span>}
                  </p>
                  {href && (
                    <Link href={href} className="shrink-0 text-sm font-semibold text-brand-600 hover:underline">
                      {a.linkLabel || "Learn more"} →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 21 years */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Photo src="/images/church-family-1-wide.webp" alt="Pastors Jay Kumar and Anjali leading the church" ratio="16/9" />
          <div>
            <p className="eyebrow mb-3">{anniversary.eyebrow}</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{anniversary.title}</h2>
            <p className="mt-5 leading-relaxed text-muted">{anniversary.body}</p>
          </div>
        </div>
      </Section>

      {/* Welcome */}
      <Section tone="surface">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <p className="eyebrow mb-3">Together we can glorify God</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{welcome.title}</h2>
            <div className="prose-ark mt-5">
              {welcome.body.map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
            </div>
            <Link href="/about" className="btn-primary mt-6">Know more about us</Link>
          </div>
          <div className="order-1 grid grid-cols-2 gap-4 lg:order-2">
            <Photo src="/images/church-family-2.webp" alt="Worship leaders at The Ark" ratio="4/5" sizes="(min-width:1024px) 25vw, 50vw" />
            <Photo src="/images/church-family-4.webp" alt="Church family in prayer" ratio="4/5" className="mt-10" sizes="(min-width:1024px) 25vw, 50vw" />
          </div>
        </div>
      </Section>

      {/* Sunday services */}
      <Section tone="navy" id="services">
        <SectionHeading tone="dark" eyebrow="Church services" title={servicesIntro.lead} lead={servicesIntro.body} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sunday.map((s) => (
            <ServiceCard key={s.id} s={s} tone="dark" />
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/services" className="btn-light">All services & fellowships</Link>
          <Link href="/services/special" className="btn-ghost-light">Other services</Link>
        </div>
      </Section>

      {/* Online */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Live worship</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{servicesIntro.online.title}</h2>
            <p className="mt-5 leading-relaxed text-muted">{servicesIntro.online.body}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/watch" className="btn-primary"><IconPlay size={18} /> Watch online</Link>
              <a href={site.social.youtube} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <IconYouTube size={18} className="text-red-600" /> YouTube channel
              </a>
            </div>
          </div>
          <Link href="/watch" className="group relative block overflow-hidden rounded-3xl">
            <Photo src="/images/collage-sunday.webp" alt="Sunday worship collage" ratio="16/9" />
            <span className="absolute inset-0 flex items-center justify-center bg-navy-950/30 transition group-hover:bg-navy-950/45">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-600 shadow-xl">
                <IconPlay size={30} />
              </span>
            </span>
          </Link>
        </div>
      </Section>

      {/* Fellowships */}
      <Section tone="surface">
        <SectionHeading eyebrow="Growing together in faith" title="Worship in your heart language" lead="Alongside our Tamil, English and bilingual services, The Ark is home to Hindi, Telugu and International fellowships." />
        <div className="grid gap-6 md:grid-cols-3">
          {fellowships.map((m) => (
            <Link key={m.slug} href={`/ministries/${m.slug}`} className="card card-hover group overflow-hidden">
              <div className="relative aspect-[16/10]">
                <Image src={m.image.src} alt={m.image.alt} fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition duration-300 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">{m.schedule}</p>
                <h3 className="mt-2 text-xl font-semibold">{m.name}</h3>
                <p className="mt-2 text-sm text-muted">{m.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Kids & youth */}
      <Section>
        <SectionHeading eyebrow="Our Ark church" title="Children & youth" lead="From age 3 to young adults — every generation has a place at The Ark." />
        <div className="grid gap-6 md:grid-cols-3">
          {kidsYouth.map((m) => (
            <Link key={m.slug} href={`/ministries/${m.slug}`} className="group">
              <Photo src={m.image.src} alt={m.image.alt} ratio="4/3" sizes="(min-width:768px) 33vw, 100vw" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-brand-600">{m.ageRange ?? m.tagline}</p>
              <h3 className="mt-1 text-xl font-semibold group-hover:text-brand-600">{m.name}</h3>
              <p className="mt-2 text-sm text-muted">{m.summary}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Events */}
      <Section tone="surface">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading eyebrow="What's coming up" title="Upcoming events" />
          <Link href="/events" className="btn-outline mb-10 self-start sm:self-auto">All events</Link>
        </div>
        {events.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <p className="card p-8 text-center text-muted">New events will be announced soon. Follow us on Instagram for updates.</p>
        )}
      </Section>

      {/* Rakshak (only if the ministry still exists in Admin → Content → Ministries) */}
      {rakshak && (
      <Section>
        <div className="grid items-center gap-12 overflow-hidden rounded-3xl bg-navy-900 text-white lg:grid-cols-2">
          <div className="relative min-h-72 lg:min-h-full lg:self-stretch">
            <Image src={rakshak.image.src} alt={rakshak.image.alt} fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="p-8 sm:p-12">
            <p className="eyebrow mb-3 text-brand-300">{giving.rakshak.title}</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">{rakshak.tagline}</h2>
            <p className="mt-5 leading-relaxed text-white/75">{rakshak.body[0]}</p>
            {rakshak.body[1] && <p className="mt-3 leading-relaxed text-white/75">{rakshak.body[1]}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={site.external.rakshak} target="_blank" rel="noopener noreferrer" className="btn-light">Donate to Rakshak</a>
              <Link href="/ministries/rakshak" className="btn-ghost-light">Learn more</Link>
            </div>
          </div>
        </div>
      </Section>
      )}

      <VisitCta />
    </>
  );
}
