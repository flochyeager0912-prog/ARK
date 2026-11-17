"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll reveal: content below the fold fades and lifts in as it enters the viewport.
 *
 * Safety rules (content must never get stuck invisible):
 *  - Each element manages only itself, and only after it has hydrated (effects run post-hydration),
 *    so server and client HTML always match.
 *  - CSS only hides elements explicitly marked `data-reveal-state="pending"` by this component.
 *  - Already on screen, reduced motion, or no IntersectionObserver → never hidden.
 */
export function Reveal({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const ref = useRef<HTMLDivElement & HTMLLIElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) return;

    el.setAttribute("data-reveal-state", "pending");
    const show = () => el.setAttribute("data-reveal-state", "shown");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      show();
    };
  }, []);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
