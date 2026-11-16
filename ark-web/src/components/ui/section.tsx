import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  tone = "white",
  id,
}: {
  children: ReactNode;
  className?: string;
  tone?: "white" | "surface" | "navy";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 py-16 sm:py-20 lg:py-24",
        tone === "surface" && "bg-surface",
        tone === "navy" && "hero-bg text-white",
        className,
      )}
    >
      <div className="container-page" data-reveal>{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  tone = "light",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  return (
    <div className={cn("mb-10 max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <p className={cn("eyebrow mb-3", tone === "dark" && "text-brand-300")}>{eyebrow}</p>}
      <h2 className={cn("text-3xl font-semibold sm:text-4xl", tone === "dark" ? "text-white" : "text-ink")}>{title}</h2>
      {lead && <p className={cn("mt-4 text-lg leading-relaxed", tone === "dark" ? "text-white/75" : "text-muted")}>{lead}</p>}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  image,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  image?: string;
}) {
  return (
    <section className="hero-bg relative overflow-hidden text-white">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
      )}
      <div className="container-page relative pb-14 pt-32 sm:pb-20 sm:pt-40">
        {eyebrow && <p className="eyebrow mb-4 text-brand-300">{eyebrow}</p>}
        <h1 className="max-w-4xl text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-6xl">{title}</h1>
        {lead && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{lead}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
