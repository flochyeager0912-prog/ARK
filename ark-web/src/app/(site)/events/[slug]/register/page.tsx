import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicEvent } from "@/server/queries";
import { formatEventWhen } from "@/lib/time";
import { Breadcrumbs, Section } from "@/components/ui/section";
import { RegisterForm } from "@/components/forms/register-form";
import { IconCalendar, IconPin } from "@/components/ui/icons";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicEvent((await params).slug);
  return data ? { title: `Register · ${data.event.title}`, robots: { index: false } } : {};
}

export default async function RegisterPage({ params }: Props) {
  const data = await getPublicEvent((await params).slug);
  if (!data) notFound();
  const { event, availability } = data;
  const canRegister = availability === "open" || availability === "waitlist";

  return (
    <Section width="narrow" className="pt-24 sm:pt-32">
      <Breadcrumbs items={[{ href: "/events", label: "Events" }, { href: `/events/${event.slug}`, label: event.title }]} />
      <div className="tile flex items-center gap-4 p-3 pr-5">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-navy-900 sm:w-32">
          {event.imageUrl ? <Image src={event.imageUrl} alt="" fill sizes="128px" className="object-cover" /> : <div className="hero-bg absolute inset-0" />}
        </div>
        <div className="min-w-0">
          <p className="eyebrow">Registering for</p>
          <h1 className="mt-1.5 font-display text-2xl font-medium text-white sm:text-3xl">{event.title}</h1>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted"><IconCalendar size={14} className="mt-0.5 shrink-0" />{formatEventWhen(event.startsAt, event.endsAt)}</p>
          <p className="flex items-start gap-1.5 text-sm text-muted"><IconPin size={14} className="mt-0.5 shrink-0" />{event.venue}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-line pt-8">
        {canRegister ? (
          <RegisterForm eventId={event.id} maxSeats={event.maxSeatsPerBooking} waitlist={availability === "waitlist"} />
        ) : (
          <div className="py-6 text-center">
            <p className="text-lg font-semibold text-white">Registration is not available</p>
            <p className="mt-2 text-muted">
              {availability === "full" ? "This event is fully booked." : availability === "dropin" ? "No registration is needed — just come along!" : availability === "cancelled" ? "This event has been cancelled." : availability === "ended" ? "This event has already taken place." : "Registration for this event is closed."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href={`/events/${event.slug}`} className="btn-outline">Event details</Link>
              <Link href="/events" className="btn-primary">See other events</Link>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
