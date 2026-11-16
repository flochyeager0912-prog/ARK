import type { Service } from "@prisma/client";
import { describeSchedule, describeTimeRange } from "@/lib/time";
import { IconBroadcast, IconClock } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function ServiceCard({ s, tone = "light" }: { s: Service; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl p-6",
        dark ? "border border-white/10 bg-white/5 backdrop-blur" : "card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-3xl font-semibold font-display", dark ? "text-white" : "text-navy-900")}>
            {describeTimeRange(s)}
          </p>
          <h3 className={cn("mt-2 text-lg font-semibold", dark ? "text-white" : "text-ink")}>{s.name}</h3>
          {s.subtitle && <p className={cn("text-sm", dark ? "text-white/70" : "text-muted")}>{s.subtitle}</p>}
        </div>
        {s.livestream && (
          <span className="badge shrink-0 bg-red-500/15 text-red-500" title="Streamed live on YouTube">
            <IconBroadcast size={14} /> Live
          </span>
        )}
      </div>
      <p className={cn("mt-4 flex items-center gap-2 text-sm", dark ? "text-white/70" : "text-muted")}>
        <IconClock size={16} /> {describeSchedule(s)}
        {s.language ? ` · ${s.language}` : ""}
      </p>
      {s.description && <p className={cn("mt-3 text-sm leading-relaxed", dark ? "text-white/70" : "text-muted")}>{s.description}</p>}
    </article>
  );
}
