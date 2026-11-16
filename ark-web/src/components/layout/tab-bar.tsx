"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const I = ({ children }: { children: ReactNode }) => (
  <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const TABS = [
  { href: "/", label: "Home", icon: <I><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></I> },
  { href: "/services", label: "Services", icon: <I><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I> },
  { href: "/events", label: "Events", icon: <I><rect x="3" y="4.5" width="18" height="16.5" rx="2" /><path d="M16 2.5v4M8 2.5v4M3 10h18" /></I> },
  { href: "/watch", label: "Watch", icon: <I><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" /></I> },
  { href: "/give", label: "Give", icon: <I><path d="M20.4 4.6a5.4 5.4 0 0 0-7.6 0L12 5.4l-.8-.8a5.4 5.4 0 0 0-7.6 7.6l.8.8L12 20.6l7.6-7.6.8-.8a5.4 5.4 0 0 0 0-7.6z" /></I> },
];

/** App-style bottom navigation on phones and tablets. */
export function TabBar() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((t) => {
          const on = active(t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors active:scale-95",
                  on ? "text-brand-600" : "text-muted hover:text-ink",
                )}
              >
                <span className={cn("absolute top-0 h-0.5 w-8 rounded-full bg-brand-600 transition-opacity", on ? "opacity-100" : "opacity-0")} />
                {t.icon}
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
