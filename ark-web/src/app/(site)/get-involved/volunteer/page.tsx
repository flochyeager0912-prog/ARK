import type { Metadata } from "next";
import { Section } from "@/components/ui/section";
import { VolunteerForm } from "@/components/forms/volunteer-form";
import { getSection } from "@/server/content";

export const metadata: Metadata = {
  title: "Volunteer with us",
  description: "Join a ministry team at The Ark Victory Church — worship, media, hospitality, children's ministry, youth, prayer, outreach and more.",
  alternates: { canonical: "/get-involved/volunteer" },
};

export default async function VolunteerPage() {
  const getInvolved = await getSection("getInvolved");
  const card = getInvolved.cards.find((c) => c.key === "volunteer") ?? {
    subtitle: "Be the hands and feet of Christ",
    body: "Join our volunteer teams in hospitality, tech, worship, children’s ministry, and more. Every helping hand makes a difference.",
  };
  return (
    <>
      <div className="hero-bg h-24 sm:h-28" />
      <Section className="pt-10 sm:pt-14">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow mb-3">{card.subtitle}</p>
            <h1 className="text-4xl font-semibold">Volunteer with us</h1>
            <p className="mt-4 leading-relaxed text-muted">{card.body}</p>
            <p className="mt-4 leading-relaxed text-muted">
              Ministry Teams are a great way to get involved, meet others within our church body and serve together at ARK Victory Church.
            </p>
          </div>
          <div className="card p-6 sm:p-8">
            <VolunteerForm />
          </div>
        </div>
      </Section>
    </>
  );
}
