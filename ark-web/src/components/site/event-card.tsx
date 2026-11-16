import Link from "next/link";
import Image from "next/image";
import type { Event } from "@prisma/client";
import { formatDate, formatTime, istParts, relativeDay } from "@/lib/time";
import { AVAILABILITY_LABEL, AVAILABILITY_TONE, type EventAvailability } from "@/lib/events";
import { IconArrowRight, IconClock, IconPin } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type CardEvent = Pick<Event, "slug" | "title" | "summary" | "venue" | "imageUrl" | "startsAt" | "status"> & { availability?: EventAvailability };

export function AvailabilityBadge({ availability, className }: { availability: EventAvailability; className?: string }) {
  return (
    <span className={cn("badge px-3 py-1 shadow-sm", AVAILABILITY_TONE[availability], className)}>
      {availability === "open" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
      {AVAILABILITY_LABEL[availability]}
    </span>
  );
}

function DateChip({ date }: { date: Date }) {
  const p = istParts(date);
  return (
    <div className="rounded-xl bg-white/95 px-3 py-2 text-center shadow-lg backdrop-blur">
      <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">{MONTHS[p.month]}</p>
      <p className="font-display text-2xl font-semibold leading-none text-navy-900">{p.day}</p>
    </div>
  );
}

export function EventCard({ event, tag, href, featured = false }: { event: CardEvent; tag?: string; href?: string; featured?: boolean }) {
  const availability = event.availability ?? (event.status === "CANCELLED" ? "cancelled" : undefined);
  const soon = availability !== "ended" && availability !== "cancelled" ? relativeDay(event.startsAt) : null;
  const link = href ?? `/events/${event.slug}`;

  return (
    <Link
      href={link}
      className={cn(
        "card card-hover group flex h-full overflow-hidden",
        featured ? "flex-col md:grid md:grid-cols-[1.25fr_1fr]" : "flex-col",
        availability === "ended" && "opacity-80 hover:opacity-100",
      )}
    >
      <div className={cn("relative overflow-hidden bg-navy-900", featured ? "aspect-[16/9] md:aspect-auto md:min-h-80" : "aspect-[16/9]")}>
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes={featured ? "(min-width:768px) 60vw, 100vw" : "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"}
            className="object-cover transition duration-500 ease-(--ease-out-soft) group-hover:scale-105"
          />
        ) : (
          <div className="hero-bg absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 via-transparent to-transparent" />
        <div className="absolute left-4 top-4"><DateChip date={event.startsAt} /></div>
        {availability && <AvailabilityBadge availability={availability} className="absolute right-4 top-4" />}
        {soon && <span className="badge absolute bottom-4 left-4 bg-navy-950/70 px-3 py-1 text-white backdrop-blur">{soon}</span>}
      </div>
      <div className={cn("flex flex-1 flex-col", featured ? "p-6 sm:p-8" : "p-5")}>
        {tag && <p className="eyebrow mb-2">{tag}</p>}
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
          <IconClock size={14} /> {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
        </p>
        <h3 className={cn("mt-2 font-semibold text-ink transition-colors group-hover:text-brand-600", featured ? "text-2xl sm:text-3xl" : "text-lg")}>{event.title}</h3>
        <p className={cn("mt-2 text-sm text-muted", featured ? "line-clamp-4 sm:text-base" : "line-clamp-2")}>{event.summary}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
            <IconPin size={14} className="shrink-0" /> <span className="truncate">{event.venue}</span>
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600">
            {featured ? (availability === "open" || availability === "waitlist" ? "Register" : "Details") : null}
            <IconArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
