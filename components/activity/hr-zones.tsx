import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./card";
import { fmtHmsCompact } from "./utils";
import type { HRZone } from "./mock-data";

const ZONE_BG: Record<number, string> = {
  1: "bg-(--color-fg-disabled)",
  2: "bg-(--color-fg-subtle)",
  3: "bg-(--color-fg-muted)",
  4: "bg-(--color-fg)",
  5: "bg-(--color-danger)",
};

export function HRZonesPanel({ zones, totalSec }: { zones: HRZone[]; totalSec: number }) {
  return (
    <Card className="flex flex-col">
      <CardHeader label="Zones cardiaques" meta={`${fmtHmsCompact(totalSec)} total`} />

      <div className="flex flex-1 flex-col divide-y divide-(--color-border)">
        {zones.map((z) => {
          const pct = (z.timeSec / totalSec) * 100;
          return (
            <div key={z.zone} className="flex flex-1 items-center gap-3 px-4 py-2.5 sm:px-5">
              <div className="flex w-7 items-center gap-1.5">
                <div className={cn("h-2 w-2 shrink-0 rounded-full", ZONE_BG[z.zone])} />
                <span className="font-mono text-xs font-medium tabular-nums text-(--color-fg-subtle)">
                  Z{z.zone}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-(--color-fg)">{z.label}</div>
                <div className="truncate font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                  {z.minBpm}–{z.maxBpm} bpm
                </div>
              </div>
              <span className="shrink-0 font-mono text-sm tabular-nums text-(--color-fg)">
                {fmtHmsCompact(z.timeSec)}
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-(--color-fg-muted)">
                {pct.toFixed(0)} %
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
