import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DayHeroCardProps {
  summary?: string;
  extraCard?: ReactNode;
}

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  subtitle?: string;
  delta?: string;
  deltaPositive?: boolean;
  valueClassName?: string;
}

function KpiCard({ label, value, unit, subtitle, delta, deltaPositive, valueClassName }: KpiCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) px-5 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-(--color-fg-subtle)">
        {label}
      </p>
      <div className="mt-3">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-mono text-[22px] font-medium leading-none tabular-nums text-(--color-fg)",
              valueClassName
            )}
          >
            {value}
          </span>
          {unit && (
            <span className="text-xs text-(--color-fg-muted)">{unit}</span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-(--color-fg-muted)">{subtitle}</p>
        )}
        {delta && (
          <p
            className={cn(
              "mt-1 font-mono text-[11px] tabular-nums",
              deltaPositive ? "text-(--color-success)" : "text-(--color-danger)"
            )}
          >
            {delta}
          </p>
        )}
      </div>
    </div>
  );
}

export function DayHeroCard({ summary, extraCard }: DayHeroCardProps) {
  const text =
    summary ??
    "Hier, 17,6 km sur le Trail de Boulogne en 1h32. Sommeil solide à 8h21, score 84/100. HRV matin à 66 ms (+8 vs moyenne). Énergie à 96/100 — le meilleur niveau de la semaine. Charge 7 jours à 361, dans la cible productive. La météo est bonne cet après-midi. C'est une fenêtre idéale pour une séance de qualité : fractionné court ou allure spécifique semi.";

  const cols = extraCard
    ? "lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
    : "lg:grid-cols-[2fr_1fr_1fr_1fr]";

  return (
    <div className={cn("mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4", cols)}>
      {/* Résumé — full width mobile, pleine largeur tablet, 2fr desktop */}
      <div className="sm:col-span-2 lg:col-span-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) px-5 py-4">
        <p className="mb-2.5 text-[10px] font-medium uppercase tracking-[0.1em] text-(--color-fg-subtle)">
          Le résumé
        </p>
        <p className="text-sm leading-[1.65] text-(--color-fg)">
          {text}
        </p>
      </div>

      <KpiCard
        label="État"
        value="Productif"
        subtitle="VO2 52 · charge 361"
        valueClassName="!font-sans !text-[18px] !font-semibold !text-(--color-success)"
      />
      <KpiCard
        label="Énergie"
        value="96"
        unit="/100"
        delta="+22 vs moy."
        deltaPositive
      />
      <KpiCard
        label="Récup."
        value="66"
        unit="ms"
        delta="+8 vs moy."
        deltaPositive
      />

      {extraCard}
    </div>
  );
}
