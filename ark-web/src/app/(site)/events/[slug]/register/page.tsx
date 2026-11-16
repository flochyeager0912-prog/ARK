import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicEvent } from "@/server/queries";
import { formatEventWhen } from "@/lib/time";
import { Section } from "@/components/ui/section";
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
    <>
      <div className="hero-bg h-24 sm:h-28" />
      <Section className="pt-8 sm:pt-12">
        <div className="mx-auto max-w-2xl">
          <Link href={`/events/${event.slug}`} className="text-sm font-medium text-brand-600 hover:underline">← Back to event</Link>

          <div className="card mt-5 flex items-center gap-4 p-3 pr-5">
            <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-navy-900 sm:w-32">
              {event.imageUrl ? <Image src={event.imageUrl} alt="" fill sizes="128px" className="object-cover" /> : <div className="hero-bg absolute inset-0" />}
            </div>
            <div className="min-w-0">
              <p className="eyebrow">Registering for</p>
              <h1 className="mt-1 text-xl font-semibold sm:text-2xl">{event.title}</h1>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted"><IconCalendar size={14} className="mt-0.5 shrink-0" />{formatEventWhen(event.startsAt, event.endsAt)}</p>
              <p className="flex items-start gap-1.5 text-sm text-muted"><IconPin size={14} className="mt-0.5 shrink-0" />{event.venue}</p>
            </div>
          </div>

          <div className="card mt-6 p-6 sm:p-8">
            {canRegister ? (
              <RegisterForm eventId={event.id} maxSeats={event.maxSeatsPerBooking} waitlist={availability === "waitlist"} />
            ) : (
              <div className="text-center">
                <p className="text-lg font-semibold">Registration is not available</p>
                <p className="mt-2 text-muted">
                  {availability === "full" ? "This event is fully booked." : availability === "dropin" ? "No registration is needed — just come along!" : "Registration for this event is closed."}
                </p>
                <Link href="/events" className="btn-primary mt-6">See other events</Link>
              </div>
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
