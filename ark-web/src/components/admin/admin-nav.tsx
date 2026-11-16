"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; exact?: boolean; badge?: "enquiries" | "volunteers" };

const ITEMS: Item[] = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/events", label: "Events & registrations" },
  { href: "/admin/enquiries", label: "Enquiries & prayer", badge: "enquiries" },
  { href: "/admin/volunteers", label: "Volunteers", badge: "volunteers" },
  { href: "/admin/content", label: "Page content" },
  { href: "/admin/media", label: "Photo library" },
  { href: "/admin/services", label: "Service timings" },
  { href: "/admin/announcements", label: "Announcements" },
];
const ADMIN_ITEMS: Item[] = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/audit", label: "Audit log" },
];

export function AdminNav({ isAdmin, badges }: { isAdmin: boolean; badges: { enquiries: number; volunteers: number } }) {
  const pathname = usePathname();
  const items = isAdmin ? [...ITEMS, ...ADMIN_ITEMS] : ITEMS;
  return (
    <nav aria-label="Admin" className="overflow-x-auto px-3 pb-3 lg:pb-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          const count = it.badge ? badges[it.badge] : 0;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm",
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {it.label}
                {count > 0 && <span className="rounded-full bg-brand-500 px-2 text-xs font-semibold text-white">{count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
