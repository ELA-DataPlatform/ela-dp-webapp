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
    <Card>
      <CardHeader label="Zones cardiaques" meta={`${fmtHmsCompact(totalSec)} total`} />

      {/* Bande de répartition horizontale */}
      <div className="border-b border-(--color-border) px-4 py-4 sm:px-5">
        <div className="flex h-3 w-full overflow-hidden rounded-full border border-(--color-border)">
          {zones.map((z) => {
            const pct = (z.timeSec / totalSec) * 100;
            if (pct < 0.5) return null;
            return (
              <div
                key={z.zone}
                className={cn(ZONE_BG[z.zone], "h-full")}
                style={{ width: `${pct}%` }}
                title={`Z${z.zone} ${z.label} — ${fmtHmsCompact(z.timeSec)}`}
              />
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
          <span>0</span>
          <span>{fmtHmsCompact(totalSec)}</span>
        </div>
      </div>

      {/* Détail par zone */}
      <div className="divide-y divide-(--color-border)">
        {[...zones].reverse().map((z) => {
          const pct = (z.timeSec / totalSec) * 100;
          return (
            <div key={z.zone} className="grid grid-cols-[1.75rem_1fr_4rem_3.5rem] items-center gap-3 px-4 py-2.5 sm:px-5">
              <div className="flex items-center gap-1.5">
                <div className={cn("h-2 w-2 shrink-0 rounded-full", ZONE_BG[z.zone])} />
                <span className="font-mono text-xs font-medium tabular-nums text-(--color-fg-subtle)">
                  Z{z.zone}
                </span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-(--color-fg)">{z.label}</div>
                <div className="truncate font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                  {z.minBpm}–{z.maxBpm} bpm
                </div>
              </div>
              <span className="text-right font-mono text-sm tabular-nums text-(--color-fg)">
                {fmtHmsCompact(z.timeSec)}
              </span>
              <span className="text-right font-mono text-xs tabular-nums text-(--color-fg-muted)">
                {pct.toFixed(0)} %
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
