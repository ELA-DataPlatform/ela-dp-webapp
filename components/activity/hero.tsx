import { cn } from "@/lib/utils";
import { Card } from "./card";
import { RouteMap } from "./route-map";
import { fmtDurationHm, fmtPace } from "./utils";
import type { ActivityDetail } from "./mock-data";

interface KpiSpec {
  label: string;
  value: string;
  unit?: string;
}

function HeroKpi({ kpi, className }: { kpi: KpiSpec; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1 py-1.5 px-3", className)}>
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {kpi.label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-lg font-medium tabular-nums leading-tight text-(--color-fg)">
          {kpi.value}
        </span>
        {kpi.unit && <span className="text-2xs text-(--color-fg-muted)">{kpi.unit}</span>}
      </div>
    </div>
  );
}

export function Hero({ activity }: { activity: ActivityDetail }) {
  const kpis: KpiSpec[] = [
    { label: "Distance",       value: activity.distanceKm.toFixed(2),  unit: "km"   },
    { label: "Durée",          value: fmtDurationHm(activity.durationSec)            },
    { label: "Allure moy.",    value: fmtPace(activity.paceSecPerKm),  unit: "/km"  },
    { label: "FC moy.",        value: `${activity.avgHrBpm}`,          unit: "bpm"  },
    { label: "Dén. +",         value: `${activity.elevGainM}`,         unit: "m"    },
    { label: "Dén. −",         value: `${activity.elevLossM}`,         unit: "m"    },
    { label: "Cadence moy.",   value: `${activity.cadenceAvg}`,        unit: "spm"  },
    { label: "Charge entr.",   value: `${activity.trainingLoad}`,      unit: "AU"   },
    { label: "Ch. aérobie",    value: `${activity.aerobicLoad}`,       unit: "AU"   },
    { label: "Ch. anaérobie",  value: `${activity.anaerobicLoad}`,     unit: "AU"   },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:h-[280px]">
      <Card className="aspect-video lg:col-span-8 lg:aspect-auto">
        <RouteMap activity={activity} />
      </Card>

      <Card className="lg:col-span-4">
        <div className="grid grid-cols-2 lg:h-full">
          {kpis.map((kpi, i) => (
            <HeroKpi
              key={kpi.label}
              kpi={kpi}
              className={cn(
                i % 2 === 1 && "border-l border-(--color-border)",
                i >= 2 && "border-t border-(--color-border)"
              )}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
