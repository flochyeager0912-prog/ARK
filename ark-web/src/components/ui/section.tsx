import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/**
 * A page section: a frosted glass panel floating over the 3D scene (reference layout).
 * `plain` drops the panel for content that brings its own cards.
 */
export function Section({
  children,
  className,
  panelClassName,
  id,
  plain = false,
  width = "wide",
}: {
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  id?: string;
  plain?: boolean;
  width?: "wide" | "narrow";
}) {
  return (
    <section id={id} className={cn("scroll-mt-24 py-5 sm:py-7", className)}>
      <Reveal className={cn("container-page", width === "narrow" && "max-w-4xl")}>
        {plain ? children : <div className={cn("panel p-6 sm:p-10 lg:p-12", panelClassName)}>{children}</div>}
      </Reveal>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  action,
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-5 sm:mb-10 md:flex-row md:items-end md:justify-between", align === "center" && "items-center text-center md:flex-col md:items-center", className)}>
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <Tag className="section-title">{title}</Tag>
        {lead && <p className="lead mt-4">{lead}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-3">{action}</div>}
    </div>
  );
}

export type Crumb = { href: string; label: string };

/** Top-of-page hero: a glass card on the left with the 3D scene visible to its right on desktop. */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  crumbs,
  wide = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  crumbs?: Crumb[];
  wide?: boolean;
}) {
  return (
    <section className="container-page pb-5 pt-24 sm:pb-7 sm:pt-32">
      <div className={cn("panel stagger overflow-hidden p-7 sm:p-10 lg:p-12", wide ? "max-w-5xl" : "max-w-3xl")}>
        <span aria-hidden className="absolute left-8 top-0 h-px w-40 bg-gradient-to-r from-glow-blue/70 to-transparent" />
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        {eyebrow && <p className="eyebrow mb-5">{eyebrow}</p>}
        <h1 className="font-display text-[2.4rem] font-medium leading-[1.04] text-white sm:text-6xl">{title}</h1>
        {lead && <p className="lead mt-6 max-w-2xl">{lead}</p>}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        <li><Link href="/" className="hover:text-white">Home</Link></li>
        {items.map((c) => (
          <li key={c.href} className="flex items-center gap-2">
            <span aria-hidden className="text-white/25">/</span>
            <Link href={c.href} className="hover:text-white">{c.label}</Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * "A → B → C" chip flow (reference style). Items can be links.
 * Each arrow trails the chip before it, so a wrapped line ends with "→" and the next line
 * always starts with a chip — never with a lone arrow.
 */
export function Flow({ items, className }: { items: (string | { label: string; href: string })[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-2 gap-y-2.5", className)}>
      {items.map((it, i) => (
        <li key={typeof it === "string" ? it : it.href} className="flex items-center gap-2 whitespace-nowrap">
          {typeof it === "string" ? (
            <span className="chip text-ink/85">{it}</span>
          ) : (
            <Link href={it.href} className="chip text-ink/85 transition-colors hover:border-white/30 hover:text-white">{it.label}</Link>
          )}
          {i < items.length - 1 && <span aria-hidden className="font-mono text-xs text-accent">→</span>}
        </li>
      ))}
    </ul>
  );
}

/** An email address that may only wrap after the "@", never mid-word. */
export function EmailText({ email }: { email: string }) {
  const at = email.indexOf("@");
  if (at < 0) return <>{email}</>;
  return (
    <>
      {email.slice(0, at + 1)}
      <wbr />
      {email.slice(at + 1)}
    </>
  );
}

/** Numbered tile — "01  Title / text" */
export function NumberedTile({ n, title, children, className }: { n: number; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("tile flex gap-3 p-5", className)}>
      <span className="num pt-1">{String(n).padStart(2, "0")}</span>
      <div>
        <h3 className="text-[17px] text-ink">{title}</h3>
        {children && <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>}
      </div>
    </div>
  );
}

/** Small mono label + value, used inside tiles. */
export function Meta({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{label}</p>
      <div className="mt-1.5 font-medium text-ink">{children}</div>
    </div>
  );
}
