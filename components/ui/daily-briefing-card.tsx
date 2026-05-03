import { cn } from "@/lib/utils";

interface MetricHighlight {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}

interface DailyBriefingCardProps {
  text: string;
  metrics?: MetricHighlight[];
  className?: string;
}

const toneClass: Record<string, string> = {
  neutral: "text-(--color-fg-muted)",
  success: "text-(--color-success)",
  warning: "text-(--color-warning)",
  danger:  "text-(--color-danger)",
};

export function DailyBriefingCard({ text, metrics, className }: DailyBriefingCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-[--radius-md] border border-(--color-border) bg-(--color-bg-elevated) p-5 lg:flex-row lg:gap-6",
        className
      )}
    >
      {/* Texte principal */}
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
            Briefing du jour
          </span>
          <span className="inline-flex items-center rounded-[--radius-xs] border border-(--color-border) bg-(--color-bg-muted) px-1.5 py-0.5 font-mono text-2xs font-medium text-(--color-fg-subtle)">
            IA
          </span>
        </div>

        <p className="text-sm leading-relaxed text-(--color-fg)">{text}</p>

        <p className="mt-auto text-2xs text-(--color-fg-subtle)">
          Garmin Connect · Spotify · Généré par Claude
        </p>
      </div>

      {/* Métriques clés (optionnel) */}
      {metrics && metrics.length > 0 && (
        <>
          <div className="h-px w-full bg-(--color-border) lg:h-auto lg:w-px lg:self-stretch" />
          <div className="flex flex-row flex-wrap gap-x-6 gap-y-4 lg:w-44 lg:shrink-0 lg:flex-col lg:justify-center lg:gap-5">
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col gap-0.5">
                <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                  {m.label}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-xl font-medium tabular-nums leading-tight text-(--color-fg)">
                    {m.value}
                  </span>
                  {m.unit && (
                    <span className="text-xs text-(--color-fg-muted)">{m.unit}</span>
                  )}
                </div>
                {m.delta && (
                  <span
                    className={cn(
                      "font-mono text-2xs tabular-nums",
                      toneClass[m.tone ?? "neutral"]
                    )}
                  >
                    {m.delta}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
