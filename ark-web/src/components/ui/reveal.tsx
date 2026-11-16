"use client";

import { useEffect } from "react";

/**
 * Progressive scroll-reveal for elements marked [data-reveal].
 *
 * Safety rules (content must never get stuck invisible):
 *  - CSS only hides elements that this script has explicitly marked `.reveal-pending`.
 *  - A MutationObserver picks up sections added later (client-side navigation, streaming).
 *  - Anything already on screen, or when IntersectionObserver / motion is unavailable, is shown at once.
 *  - A failsafe timer reveals every pending element after 2.5s regardless.
 */
export function RevealObserver() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    const show = (el: Element) => {
      el.classList.add("is-revealed");
      el.classList.remove("reveal-pending");
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );

    const register = (root: ParentNode) => {
      const els = root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed):not(.reveal-pending)");
      els.forEach((el) => {
        // Already visible on screen → show immediately, no animation flash.
        if (el.getBoundingClientRect().top < window.innerHeight * 0.95) {
          show(el);
          return;
        }
        el.classList.add("reveal-pending");
        io.observe(el);
      });
    };

    register(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) {
            if (n.matches("[data-reveal]")) register(n.parentElement ?? document);
            else register(n);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Failsafe: never leave anything hidden.
    const failsafe = window.setInterval(() => {
      document.querySelectorAll(".reveal-pending").forEach((el) => {
        const top = el.getBoundingClientRect().top;
        if (top < window.innerHeight) show(el);
      });
    }, 1500);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearInterval(failsafe);
      document.querySelectorAll(".reveal-pending").forEach(show);
    };
  }, []);
  return null;
}
