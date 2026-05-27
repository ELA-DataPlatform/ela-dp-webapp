import { Card, CardHeader } from "./card";
import { fmtPace } from "./utils";
import type { PaceBucket } from "./mock-data";

export function PaceDistribution({
  buckets,
  totalKm,
  avgPaceSec,
}: {
  buckets: PaceBucket[];
  totalKm: number;
  avgPaceSec: number;
}) {
  const maxKm = Math.max(...buckets.map((b) => b.distKm));

  return (
    <Card>
      <CardHeader label="Distribution allure" meta={`moy. ${fmtPace(avgPaceSec)}`} />

      <div className="flex flex-col gap-2 px-4 py-4 sm:px-5">
        {buckets.map((b) => {
          const widthPct = (b.distKm / maxKm) * 100;
          const sharePct = (b.distKm / totalKm) * 100;
          const containsAvg = avgPaceSec >= b.minPaceSec && avgPaceSec < b.maxPaceSec;
          return (
            <div key={b.minPaceSec} className="grid grid-cols-[5rem_1fr_3.5rem] items-center gap-3">
              <span className="font-mono text-xs tabular-nums text-(--color-fg-subtle)">
                {fmtPace(b.minPaceSec)}
              </span>
              <div className="relative h-5 w-full overflow-hidden rounded-(--radius-sm) bg-(--color-bg-muted)">
                <div
                  className={
                    containsAvg
                      ? "h-full rounded-(--radius-sm) bg-(--color-fg) transition-all"
                      : "h-full rounded-(--radius-sm) bg-(--color-fg-muted)/55 transition-all"
                  }
                  style={{ width: `${Math.max(2, widthPct)}%` }}
                />
              </div>
              <span className="text-right font-mono text-xs tabular-nums text-(--color-fg)">
                {b.distKm.toFixed(1)}
                <span className="ml-0.5 text-2xs text-(--color-fg-subtle)">
                  · {sharePct.toFixed(0)}%
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
