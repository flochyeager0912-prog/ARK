"use client";

import { getLenis } from "./smooth-scroll";

export function BackToTop() {
  return (
    <button
      type="button"
      className="hover:text-white"
      onClick={() => {
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(0, { duration: 1.4 });
        else window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }}
    >
      Back to top ↑
    </button>
  );
}
