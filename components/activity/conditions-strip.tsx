import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ActivityConditions } from "./mock-data";

function Item({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5 px-4 py-2.5 sm:px-5", className)}>
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {label}
      </span>
      <span className="truncate text-xs text-(--color-fg)">{children}</span>
    </div>
  );
}

export function ConditionsStrip({ conditions }: { conditions: ActivityConditions }) {
  return (
    <div className="grid grid-cols-2 border-b border-(--color-border) sm:grid-cols-4">
      <Item
        label="Météo"
        className="border-(--color-border)"
      >
        <span className="font-mono tabular-nums">{conditions.tempC}°C</span>
        <span className="text-(--color-fg-subtle)"> · {conditions.weatherLabel}</span>
      </Item>
      <Item
        label="Ressenti"
        className="border-l border-(--color-border)"
      >
        <span className="font-mono tabular-nums">{conditions.feelsLikeC}°C</span>
        <span className="text-(--color-fg-subtle)">
          {" · "}
          <span className="font-mono tabular-nums">{conditions.humidityPct}%</span> humid.
        </span>
        <span className="hidden text-(--color-fg-subtle) lg:inline">
          {" · vent "}
          <span className="font-mono tabular-nums">{conditions.windKmh}</span> km/h {conditions.windDir}
        </span>
      </Item>
      <Item
        label="Chaussure"
        className="border-t border-(--color-border) sm:border-t-0 sm:border-l"
      >
        <span className="truncate">{conditions.shoeName}</span>
        <span className="text-(--color-fg-subtle)">
          {" · "}
          <span className="font-mono tabular-nums">{conditions.shoeTotalKm}</span> km
        </span>
      </Item>
      <Item
        label="RPE ressenti"
        className="border-l border-t border-(--color-border) sm:border-t-0"
      >
        <span className="font-mono tabular-nums">{conditions.rpe}</span>
        <span className="text-(--color-fg-subtle)"> / 10</span>
      </Item>
    </div>
  );
}
