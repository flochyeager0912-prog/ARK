import type { Metadata } from "next";
import { Breadcrumbs, Section } from "@/components/ui/section";
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
    <Section className="pt-24 sm:pt-32">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Breadcrumbs items={[{ href: "/get-involved", label: "Get involved" }, { href: "/get-involved/volunteer", label: "Volunteer" }]} />
          <p className="eyebrow mb-4">{card.subtitle}</p>
          <h1 className="section-title">Volunteer with us</h1>
          <p className="mt-5 leading-relaxed text-muted">{card.body}</p>
          <p className="mt-4 leading-relaxed text-muted">
            Ministry Teams are a great way to get involved, meet others within our church body and serve together at ARK Victory Church.
          </p>
        </div>
        <div className="tile p-6 sm:p-8">
          <VolunteerForm />
        </div>
      </div>
    </Section>
  );
}
