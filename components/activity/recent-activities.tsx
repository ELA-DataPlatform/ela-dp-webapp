import Link from "next/link";
import { Card, CardHeader } from "./card";
import { fmtPace, fmtDurationHm } from "./utils";
import type { HistoricalActivity } from "./mock-data";

export function RecentActivitiesPanel({ activities }: { activities: HistoricalActivity[] }) {
  const items = activities.slice(0, 5);
  return (
    <Card className="flex flex-col">
      <CardHeader label="Séances récentes" meta={`${items.length} dernières`} />

      <div className="flex flex-1 flex-col divide-y divide-(--color-border)">
        {items.map((a) => (
          <Link
            key={a.id}
            href={`/activities?id=${a.id}`}
            className="flex flex-1 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-(--color-bg-muted) sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-sm font-medium text-(--color-fg)">
                  {a.dateDisplay}
                </span>
                {a.isPB && (
                  <span className="inline-flex h-4 items-center rounded-full bg-(--color-success)/15 px-1.5 text-2xs font-medium uppercase tracking-[0.04em] text-(--color-success)">
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
