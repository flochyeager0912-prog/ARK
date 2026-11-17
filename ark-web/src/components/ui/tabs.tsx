"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = { key: string; label: ReactNode; hint?: ReactNode; panel: ReactNode };

/**
 * "Select a layer to explore" control: a grid of options with a detail pane that swaps in.
 * Panels are rendered on the server and passed in, so all content stays in the HTML (SEO) —
 * inactive panels are simply hidden. Keyboard: arrow keys / Home / End (WAI-ARIA tabs pattern).
 */
export function Tabs({
  items,
  layout = "side",
  label,
  className,
}: {
  items: TabItem[];
  layout?: "side" | "top";
  label: string;
  className?: string;
}) {
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const [moreRight, setMoreRight] = useState(false);

  // Top layout scrolls sideways on small screens: fade the edge only while items are hidden there.
  useEffect(() => {
    const rail = railRef.current;
    if (layout !== "top" || !rail) return;
    const check = () => setMoreRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4);
    check();
    rail.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      rail.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [layout, items.length]);

  if (items.length === 0) return null;
  const current = Math.min(active, items.length - 1);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = items.length - 1;
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const n = (next + items.length) % items.length;
    setActive(n);
    refs.current[n]?.focus();
  };

  return (
    <div className={cn(layout === "side" ? "grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10" : "space-y-6", className)}>
      <div
        ref={railRef}
        role="tablist"
        aria-label={label}
        aria-orientation={layout === "side" ? "vertical" : "horizontal"}
        className={cn(
          layout === "side" ? "grid content-start gap-3 sm:grid-cols-2" : "no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1",
          layout === "top" && moreRight && "rail-fade",
        )}
      >
        {items.map((it, i) => {
          const on = i === current;
          return (
            <button
              key={it.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-t${i}`}
              aria-selected={on}
              aria-controls={`${base}-p${i}`}
              tabIndex={on ? 0 : -1}
              onClick={() => {
                setActive(i);
                refs.current[i]?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
              }}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "group relative rounded-2xl border text-left transition-[border-color,background-color,color,box-shadow] duration-300 ease-(--ease-out-soft)",
                layout === "side" ? "flex flex-col justify-start px-5 py-4" : "shrink-0 rounded-full px-4 py-2 text-sm",
                on
                  ? "border-glow-blue/50 bg-glow-blue/[0.08] text-white shadow-[inset_0_0_0_1px_rgb(157_177_255/0.12),0_10px_30px_-18px_rgb(157_177_255/0.6)]"
                  : "border-line bg-white/[0.02] text-ink/80 hover:border-white/20 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <span className={cn("block", layout === "side" && "text-[17px] font-medium")}>{it.label}</span>
              {it.hint && layout === "side" && <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-muted">{it.hint}</span>}
            </button>
          );
        })}
      </div>
      <div className="min-w-0">
        {items.map((it, i) => (
          <div
            key={it.key}
            role="tabpanel"
            id={`${base}-p${i}`}
            aria-labelledby={`${base}-t${i}`}
            hidden={i !== current}
            tabIndex={0}
            className={cn("rounded-2xl outline-none", i === current && "swap-in")}
          >
            {it.panel}
          </div>
        ))}
      </div>
    </div>
  );
}
