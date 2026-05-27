import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./card";
import { fmtPace, fmtDurationHm } from "./utils";
import type { HistoricalActivity, ActivityDetail } from "./mock-data";

export function HistoryPanel({ activity }: { activity: ActivityDetail }) {
  const { history, paceSecPerKm } = activity;

  // Inclut la séance courante pour comparer l'échelle
  const allPaces = [paceSecPerKm, ...history.map((h) => h.avgPaceSec)];
  const minPace = Math.min(...allPaces);
  const maxPace = Math.max(...allPaces);
  const range = maxPace - minPace || 1;
  const pacePct = (p: number) => ((maxPace - p) / range) * 100;

  const meta = `${history.length} dernières · ~${activity.distanceKm.toFixed(0)} km`;

  return (
    <Card>
      <CardHeader label="Comparaison historique" meta={meta} />

      {/* Ligne courante */}
      <ComparisonRow
        label="Aujourd'hui"
        date={activity.dateDisplay.split(" ").slice(-3).join(" ")}
        distanceKm={activity.distanceKm}
        durationSec={activity.durationSec}
        paceSec={paceSecPerKm}
        hrBpm={activity.avgHrBpm}
        pacePct={pacePct(paceSecPerKm)}
        highlight
      />

      <div className="divide-y divide-(--color-border)">
        {history.map((h: HistoricalActivity) => (
          <ComparisonRow
            key={h.id}
            label={h.dateDisplay}
            distanceKm={h.distanceKm}
            durationSec={h.durationSec}
            paceSec={h.avgPaceSec}
            hrBpm={h.avgHrBpm}
            pacePct={pacePct(h.avgPaceSec)}
            isPB={h.isPB}
          />
        ))}
      </div>
    </Card>
  );
}

function ComparisonRow({
  label,
  date,
  distanceKm,
  durationSec,
  paceSec,
  hrBpm,
  pacePct,
  highlight,
  isPB,
}: {
  label: string;
  date?: string;
  distanceKm: number;
  durationSec: number;
  paceSec: number;
  hrBpm: number;
  pacePct: number;
  highlight?: boolean;
  isPB?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[4.5rem_1fr_4rem] items-center gap-3 px-4 py-3 sm:grid-cols-[5.5rem_1fr_4.5rem_3.5rem] sm:gap-4 sm:px-5",
        highlight && "border-b border-(--color-border) bg-(--color-accent-bg)"
      )}
    >
      <div className="min-w-0">
        <div
          className={cn(
            "truncate text-xs font-medium",
            highlight ? "text-(--color-accent)" : "text-(--color-fg)"
          )}
        >
          {label}
        </div>
        {date && (
          <div className="truncate font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
            {date}
          </div>
        )}
        {isPB && (
          <div className="mt-0.5 inline-flex h-4 items-center rounded-full bg-(--color-bg-muted) px-1.5 text-[10px] font-medium uppercase tracking-[0.04em] text-(--color-fg-muted)">
            PB
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-12 shrink-0 font-mono text-xs tabular-nums sm:w-14 sm:text-sm",
            highlight ? "font-medium text-(--color-fg)" : "text-(--color-fg-muted)"
          )}
        >
          {fmtPace(paceSec)}
        </span>
        <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-(--color-bg-muted)">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              highlight ? "bg-(--color-accent)" : "bg-(--color-fg-muted)"
            )}
            style={{ width: `${Math.max(4, Math.min(100, pacePct))}%` }}
          />
        </div>
      </div>

      <span className="hidden text-right font-mono text-xs tabular-nums text-(--color-fg-subtle) sm:block">
        {fmtDurationHm(durationSec)}
      </span>

      <div className="text-right">
        <div className="font-mono text-xs tabular-nums text-(--color-fg)">
          {distanceKm.toFixed(1)}
          <span className="ml-0.5 text-2xs text-(--color-fg-subtle)">km</span>
        </div>
        <div className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">{hrBpm} bpm</div>
      </div>
    </div>
  );
}
