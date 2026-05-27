import Link from "next/link";
import { Card, CardHeader } from "./card";
import { fmtPace, fmtDurationHm } from "./utils";
import type { HistoricalActivity } from "./mock-data";

export function RecentActivitiesPanel({ activities }: { activities: HistoricalActivity[] }) {
  return (
    <Card>
      <CardHeader label="Séances récentes" meta={`${activities.length} dernières`} />

      <div className="divide-y divide-(--color-border)">
        {activities.map((a) => (
          <Link
            key={a.id}
            href={`/activities/${a.id}`}
            className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-(--color-bg-muted) sm:px-5"
          >
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-medium text-(--color-fg)">
                  {a.dateDisplay}
                </span>
                {a.isPB && (
                  <span className="inline-flex h-4 items-center rounded-full bg-(--color-bg-muted) px-1.5 text-[10px] font-medium uppercase tracking-[0.04em] text-(--color-fg-muted)">
                    PB
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-mono text-xs tabular-nums text-(--color-fg-subtle)">
                <span>{a.distanceKm.toFixed(1)} km</span>
                <span>·</span>
                <span>{fmtPace(a.avgPaceSec)}/km</span>
                <span>·</span>
                <span>{a.avgHrBpm} bpm</span>
              </div>
            </div>
            <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-(--color-fg)">
              {fmtDurationHm(a.durationSec)}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
