"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type Lenis from "lenis";

let instance: Lenis | null = null;
export const getLenis = () => instance;

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Smoothly scroll to an element id. Returns false when the element isn't on this page.
 * The space for the fixed header comes from the section's CSS `scroll-margin-top`, which Lenis,
 * `scrollIntoView` and the browser's own #hash navigation all honour — so every route lands alike.
 */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  if (instance) {
    // Lenis measures the page asynchronously; right after it starts (or after content streams in)
    // its scroll limit can still be 0, which would clamp the target to the top. Measure first.
    instance.resize();
    instance.scrollTo(el, { duration: 1.2 });
  }
  else el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  return true;
}

/**
 * Inertial wheel scrolling (Lenis) for the public site. Touch devices keep native scrolling,
 * and people who prefer reduced motion get the browser default.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    let lenis: Lenis | null = null;
    let cancelled = false;
    import("lenis").then(({ default: LenisCtor }) => {
      if (cancelled) return;
      lenis = new LenisCtor({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), anchors: true });
      instance = lenis;
      const tick = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenis?.destroy();
      instance = null;
    };
  }, []);

  // Arriving from another page at /#section: the target may not exist yet while the loading
  // skeleton streams in, so the router's own hash scroll falls back to the top. Wait (briefly)
  // for the section to render — and for Lenis to start, which would otherwise cancel a scroll begun
  // just before it — then glide to it.
  const pathname = usePathname();
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      const el = document.getElementById(id);
      // Not laid out yet (still being swapped in by streaming): its position would read 0.
      const rendered = el !== null && el.getBoundingClientRect().height > 0;
      const scrollerReady = instance !== null || reducedMotion() || tries > 20;
      if (rendered && scrollerReady) {
        if (Math.abs(el.getBoundingClientRect().top) > 160) scrollToId(id);
      } else if (tries++ < 50) timer = window.setTimeout(attempt, 75);
    };
    timer = window.setTimeout(attempt, 60);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
