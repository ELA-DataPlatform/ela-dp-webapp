"use client";

import { ChevronUp, ChevronDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./card";
import { useActivityFocus } from "./focus-context";
import { fmtPace } from "./utils";
import type { Lap, ActivityDetail } from "./mock-data";

function PaceBar({
  value,
  min,
  max,
  delta,
}: {
  value: number;
  min: number;
  max: number;
  delta: number;
}) {
  // Inverse l'échelle : plus l'allure est rapide (sec/km bas) plus la barre est longue
  const range = max - min || 1;
  const pct = ((max - value) / range) * 100;
  const tone =
    delta < -4 ? "bg-(--color-success)" : delta > 4 ? "bg-(--color-danger)" : "bg-(--color-fg-muted)";

  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-(--color-bg-muted)">
      <div
        className={cn("h-full rounded-full transition-all", tone)}
        style={{ width: `${Math.max(4, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export function SplitsTable({ activity }: { activity: ActivityDetail }) {
  const { laps, hrMax } = activity;
  const { hoveredKm, setHoveredKm } = useActivityFocus();

  const avgPace = Math.round(laps.reduce((s, l) => s + l.paceSecPerKm, 0) / laps.length);
  const bestPace = Math.min(...laps.map((l) => l.paceSecPerKm));
  const worstPace = Math.max(...laps.map((l) => l.paceSecPerKm));

  // Trouve le km le plus proche du hover pour highlight
  const hoveredLapKm = hoveredKm == null ? null : Math.max(1, Math.min(laps.length, Math.round(hoveredKm)));

  return (
    <Card>
      <CardHeader label="Splits par km" meta={`moy. ${fmtPace(avgPace)}`} />

      {/* Column headers — masque GAP et Cadence sur mobile */}
      <div className="grid grid-cols-[2.5rem_1fr_3rem_3rem] gap-2 border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2 sm:grid-cols-[2.5rem_1.4fr_3.5rem_3.5rem_3.5rem_3.5rem] sm:gap-3 sm:px-5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">Km</span>
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">Allure</span>
        <span className="hidden text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted) sm:block">GAP</span>
        <span className="text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">FC</span>
        <span className="hidden text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted) sm:block">Cad.</span>
        <span className="text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">D+</span>
      </div>

      <div className="divide-y divide-(--color-border)">
        {laps.map((lap: Lap) => {
          const isBest = lap.paceSecPerKm === bestPace;
          const delta = lap.paceSecPerKm - avgPace;
          const isFast = delta < -4;
          const isSlow = delta > 4;
          const isHovered = hoveredLapKm === lap.km;
          const hrPct = Math.round((lap.hrBpm / hrMax) * 100);

          return (
            <div
              key={lap.km}
              onMouseEnter={() => setHoveredKm(lap.km - 0.5)}
              onMouseLeave={() => setHoveredKm(null)}
              className={cn(
                "grid cursor-default grid-cols-[2.5rem_1fr_3rem_3rem] items-center gap-2 px-4 py-2.5 transition-colors sm:grid-cols-[2.5rem_1.4fr_3.5rem_3.5rem_3.5rem_3.5rem] sm:gap-3 sm:px-5",
                isHovered
                  ? "bg-(--color-bg-muted)"
                  : isBest
                    ? "bg-(--color-accent-bg)"
                    : "hover:bg-(--color-bg-muted)"
              )}
            >
              <span className="font-mono text-xs font-medium tabular-nums text-(--color-fg-subtle)">
                {lap.km}
              </span>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-12 shrink-0 font-mono text-sm tabular-nums sm:w-14",
                    isFast && "text-(--color-success)",
                    isSlow && "text-(--color-danger)",
                    !isFast && !isSlow && "text-(--color-fg)"
                  )}
                >
                  {fmtPace(lap.paceSecPerKm)}
                </span>
                <div className="min-w-0 flex-1">
                  <PaceBar value={lap.paceSecPerKm} min={bestPace} max={worstPace} delta={delta} />
                </div>
              </div>

              <span className="hidden text-right font-mono text-sm tabular-nums text-(--color-fg-subtle) sm:block">
                {fmtPace(lap.gapSecPerKm)}
              </span>

              <div className="text-right">
                <span className="font-mono text-sm tabular-nums text-(--color-fg)">{lap.hrBpm}</span>
                <span className="ml-0.5 font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                  · {hrPct}%
                </span>
              </div>

              <span className="hidden text-right font-mono text-sm tabular-nums text-(--color-fg-subtle) sm:block">
                {lap.cadenceSpm}
              </span>

              <div className="flex items-center justify-end gap-0.5">
                {lap.elevGainM > 0 ? (
                  <ChevronUp className="h-3 w-3 shrink-0 text-(--color-fg-subtle)" strokeWidth={2} />
                ) : lap.elevGainM < 0 ? (
                  <ChevronDown className="h-3 w-3 shrink-0 text-(--color-fg-subtle)" strokeWidth={2} />
                ) : (
                  <Minus className="h-3 w-3 shrink-0 text-(--color-fg-subtle)" strokeWidth={2} />
                )}
                <span className="font-mono text-sm tabular-nums text-(--color-fg-subtle)">
                  {Math.abs(lap.elevGainM)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
