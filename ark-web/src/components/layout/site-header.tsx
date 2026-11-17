"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { footerNav, sectionNav } from "@/content/site";
import { cn } from "@/lib/utils";
import { IconMenu, IconX } from "@/components/ui/icons";
import { getLenis, scrollToId } from "./smooth-scroll";

type SectionId = (typeof sectionNav)[number]["id"];

/** Which nav entry a detail page belongs to (e.g. /about/journey → About). */
function sectionForPath(pathname: string): SectionId | null {
  for (const s of sectionNav) if (s.match.some((m) => pathname === m || pathname.startsWith(`${m}/`))) return s.id;
  return null;
}

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [spy, setSpy] = useState<SectionId | null>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const active = isHome ? spy : sectionForPath(pathname);
  const activeLabel = active ? sectionNav.find((s) => s.id === active)!.label : isHome ? "Welcome" : "The Ark";

  // Scroll state: header tint, progress hairline and (on the home page) the active section.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 8);
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (isHome) {
        const line = window.innerHeight * 0.4;
        let current: SectionId | null = null;
        for (const s of sectionNav) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top <= line) current = s.id;
        }
        setSpy(current);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isHome, pathname]);

  // Close the menu on navigation (state adjusted during render, per React guidance).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock the page behind the open menu; Escape closes it.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    getLenis()?.stop();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      getLenis()?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /** On the home page, glide to the section instead of a hard jump. */
  const goToSection = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!isHome || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    setOpen(false);
    // Let the menu release the scroll lock before scrolling.
    requestAnimationFrame(() => {
      if (scrollToId(id)) history.replaceState(null, "", `#${id}`);
    });
  };
  const goHome = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isHome) return;
    e.preventDefault();
    setOpen(false);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.2 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", "/");
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b pt-[env(safe-area-inset-top)] backdrop-blur-xl transition-[background-color,border-color] duration-500",
          scrolled || open ? "border-white/[0.08] bg-night-950/75" : "border-white/[0.05] bg-night-950/35",
        )}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-navy-900">
          Skip to content
        </a>
        <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-[72px]">
          <Link href="/" onClick={goHome} className="group flex shrink-0 items-center gap-3" aria-label="The Ark Victory Church — home">
            <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-glow-blue shadow-[0_0_12px_rgb(157_177_255/0.9)]" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.35rem] font-medium tracking-tight text-white">The Ark</span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.28em] text-muted transition-colors group-hover:text-white/80">Victory Church</span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {sectionNav.map((item) => {
                const on = active === item.id;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={(e) => goToSection(e, item.id)}
                      aria-current={on ? (isHome ? "location" : "page") : undefined}
                      className={cn(
                        "relative block rounded-full px-3.5 py-2 text-[15px] transition-colors duration-300",
                        on ? "text-white" : "text-muted hover:text-white",
                      )}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-3.5 -bottom-[3px] h-px origin-center bg-gradient-to-r from-glow-blue to-glow-gold transition-transform duration-500 ease-(--ease-out-soft)",
                          on ? "scale-x-100" : "scale-x-0",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/watch"
              className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:border-white/35 hover:bg-white/5 sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgb(248_113_113/0.9)]" /> Watch live
            </Link>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white transition-colors hover:bg-white/5 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <IconX size={20} /> : <IconMenu size={20} />}
            </button>
          </div>
        </div>
        {/* Reading progress */}
        <span aria-hidden className="absolute inset-x-0 -bottom-px h-px overflow-hidden">
          <span ref={barRef} className="block h-full origin-left scale-x-0 bg-gradient-to-r from-glow-blue/0 via-glow-blue to-glow-gold" />
        </span>

      </header>

      {/* Mobile menu: a sibling of the header (not a child) so the header's backdrop blur can't
          turn it see-through — nested backdrop-filters composite incorrectly in Chromium. */}
      <nav
        id="mobile-nav"
        aria-label="Mobile"
        inert={!open}
        data-lenis-prevent
        className={cn(
          "fixed inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top))] z-50 overflow-y-auto overscroll-contain bg-night-950/[0.97] px-4 pb-12 pt-6 backdrop-blur-xl transition-[opacity,transform,visibility] duration-400 ease-(--ease-out-soft) lg:hidden",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <ul className="space-y-1">
          {sectionNav.map((item, i) => (
            <li
              key={item.id}
              className={cn("transition-[opacity,transform] duration-500 ease-(--ease-out-soft)", open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}
              style={{ transitionDelay: open ? `${50 + i * 40}ms` : "0ms" }}
            >
              <Link
                href={item.href}
                onClick={(e) => goToSection(e, item.id)}
                className={cn("flex items-baseline gap-4 rounded-xl px-2 py-2.5 font-display text-3xl", active === item.id ? "text-white" : "text-white/70")}
              >
                <span className="num w-6">{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-8 border-t border-white/[0.06] pt-8 sm:grid-cols-3">
          {footerNav.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-3">{col.title}</p>
              <ul className="space-y-1">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} aria-current={pathname === l.href ? "page" : undefined} className="block py-1.5 text-white/75 hover:text-white aria-[current=page]:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link href="/watch" className="btn-outline">Watch live</Link>
          <Link href="/give" className="btn-primary">Give</Link>
        </div>
      </nav>

      {/* "Now viewing" marker, like a layer indicator — only where the side gutter is wide enough not to overlap content */}
      <div aria-hidden className="pointer-events-none fixed bottom-7 right-8 z-30 hidden text-right min-[1640px]:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted/70">Now viewing</p>
        <p key={activeLabel} className="swap-in mt-1.5 font-mono text-sm uppercase tracking-[0.2em] text-glow-blue">{activeLabel}</p>
      </div>
    </>
  );
}
