import type { Service } from "@prisma/client";
import { describeSchedule, describeTimeRange } from "@/lib/time";
import { IconBroadcast } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** One service time. Big serif time, name, schedule chips. */
export function ServiceCard({ s, className }: { s: Service; className?: string }) {
  return (
    <article className={cn("tile flex h-full flex-col p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-[1.7rem] font-medium leading-tight text-white">{describeTimeRange(s)}</p>
        {s.livestream && (
          <span className="badge shrink-0 border border-red-400/30 bg-red-500/10 text-red-300" title="Streamed live on YouTube">
            <IconBroadcast size={13} /> Live
          </span>
        )}
      </div>
      <h3 className="mt-3 text-lg text-ink">{s.name}</h3>
      {s.subtitle && <p className="text-sm text-muted">{s.subtitle}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="chip">{describeSchedule(s)}</span>
        {s.language && <span className="chip">{s.language}</span>}
        {s.venue && <span className="chip">{s.venue}</span>}
      </div>
      {s.description && <p className="mt-4 text-sm leading-relaxed text-muted">{s.description}</p>}
    </article>
  );
}
