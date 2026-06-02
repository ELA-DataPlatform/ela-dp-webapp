import { cn } from "@/lib/utils";
import { Card } from "./card";
import { fmtPace } from "./utils";
import type { ActivityDetail } from "./mock-data";

interface KpiSpec {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}

function buildKpis(a: ActivityDetail): KpiSpec[] {
  return [
    { label: "FC max",       value: `${a.maxHrBpm}`,                      unit: "bpm", hint: `${Math.round((a.maxHrBpm / a.hrMax) * 100)} % FCmax` },
    { label: "Cadence moy.", value: `${a.cadenceAvg}`,                    unit: "spm" },
    { label: "Dénivelé",     value: `+${a.elevGainM} / −${a.elevLossM}`,  unit: "m"   },
    { label: "GAP",          value: fmtPace(a.gapSecPerKm),               unit: "/km", hint: "allure ajustée" },
    { label: "Charge entr.", value: `${a.trainingLoad}`,                               hint: "TRIMP" },
    { label: "Eff. aérobie", value: `${a.decouplingPct.toFixed(1)}`,      unit: "%",   hint: "decoupling" },
  ];
}

export function SecondaryKpis({ activity }: { activity: ActivityDetail }) {
  const kpis = buildKpis(activity);

  return (
    <Card>
      <div className="grid grid-cols-3 md:grid-cols-6">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className={cn(
              "flex flex-col gap-1 px-4 py-3 sm:px-5",
              // Mobile (grid-cols-3) : border-left si pas en col 0, border-top si row 1
              i % 3 !== 0 && "border-l border-(--color-border)",
              i >= 3 && "border-t border-(--color-border)",
              // Desktop (grid-cols-6) : reset les borders du mobile et applique une seule rangée
              "md:border-l md:border-t-0",
              i === 0 && "md:border-l-0"
            )}
          >
            <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
              {k.label}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-base font-medium tabular-nums leading-tight text-(--color-fg)">
                {k.value}
              </span>
              {k.unit && <span className="text-xs text-(--color-fg-muted)">{k.unit}</span>}
            </div>
            {k.hint && <span className="text-2xs text-(--color-fg-subtle)">{k.hint}</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}
