"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { mainNav } from "@/content/site";
import { cn } from "@/lib/utils";
import { IconMenu, IconX } from "@/components/ui/icons";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer on navigation (state adjusted during render, per React guidance).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-300",
        scrolled || open ? "bg-navy-950/95 shadow-lg shadow-black/10 backdrop-blur" : "bg-transparent",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-6 sm:h-20">
        <Link href="/" className="flex shrink-0 items-center" aria-label="The Ark Victory Church — home">
          <Image src="/images/logo-white.webp" alt="The Ark Victory Church" width={140} height={75} priority className="h-11 w-auto sm:h-14" />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white",
                    isActive(item.href) && "text-white",
                  )}
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="min-w-52 rounded-2xl border border-white/10 bg-navy-900 p-2 shadow-2xl">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white">
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/give" className="btn-light hidden px-4 py-2 sm:inline-flex">
            Give
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconX size={24} /> : <IconMenu size={24} />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Mobile"
        inert={!open}
        className={cn(
          "absolute inset-x-0 top-full h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-y-auto border-t border-white/10 bg-navy-950 px-4 pb-10 pt-4 transition-[opacity,transform,visibility] duration-300 ease-(--ease-out-soft) lg:hidden",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0",
        )}
      >
          <ul className="space-y-1">
            {mainNav.map((item, i) => (
              <li
                key={item.href}
                className={cn("transition-[opacity,transform] duration-500 ease-(--ease-out-soft)", open ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0")}
                style={{ transitionDelay: open ? `${60 + i * 35}ms` : "0ms" }}
              >
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn("block rounded-xl px-3 py-3 text-lg font-semibold text-white hover:bg-white/10", isActive(item.href) && "bg-white/10")}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="mb-2 ml-3 border-l border-white/10 pl-3">
                    {item.children
                      .filter((c) => c.href !== item.href)
                      .map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="block rounded-lg px-3 py-2 text-white/70 hover:text-white">
                            {c.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/give" className="btn-light">Give</Link>
            <Link href="/watch" className="btn-ghost-light">Watch live</Link>
          </div>
      </nav>
    </header>
  );
}
