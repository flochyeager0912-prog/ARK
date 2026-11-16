import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, description, actions, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-8">
      {back && <Link href={back.href} className="text-sm font-medium text-brand-600 hover:underline">← {back.label}</Link>}
      <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Panel({ children, className, title }: { children: ReactNode; className?: string; title?: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-white", className)}>
      {title && <h2 className="border-b border-line px-5 py-3 text-sm font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

const TONES: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800",
  amber: "bg-amber-100 text-amber-900",
  red: "bg-red-100 text-red-700",
  blue: "bg-brand-100 text-brand-800",
  gray: "bg-slate-100 text-slate-700",
};

export function StatusBadge({ status }: { status: string }) {
  const tone =
    ({
      PUBLISHED: "green", CONFIRMED: "green", APPROVED: "green", RESOLVED: "green",
      DRAFT: "gray", CANCELLED: "red", DECLINED: "red",
      WAITLISTED: "amber", ON_HOLD: "amber", IN_PROGRESS: "amber",
      NEW: "blue", SUBMITTED: "blue",
    } as Record<string, string>)[status] ?? "gray";
  return <span className={cn("badge", TONES[tone])}>{status.replace("_", " ").toLowerCase()}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-muted">{children}</p>;
}

export function Notice({ tone = "green", children }: { tone?: "green" | "red" | "amber"; children: ReactNode }) {
  return <div className={cn("mb-6 rounded-xl px-4 py-3 text-sm", TONES[tone])} role="status">{children}</div>;
}

export const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted";
export const td = "px-4 py-3 align-top text-sm";
