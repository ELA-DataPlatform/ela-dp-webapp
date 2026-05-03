type TrainingState =
  | "detraining"
  | "recovery"
  | "productive"
  | "maintaining"
  | "overreaching";

const STATE_CONFIG: Record<
  TrainingState,
  { label: string; position: number; color: string }
> = {
  detraining:   { label: "Désentraînement", position: 8,  color: "var(--color-danger)" },
  recovery:     { label: "Récupération",    position: 28, color: "var(--color-warning)" },
  productive:   { label: "Productif",       position: 55, color: "var(--color-success)" },
  maintaining:  { label: "Maintien",        position: 75, color: "var(--color-fg-muted)" },
  overreaching: { label: "Surcharge",       position: 92, color: "var(--color-danger)" },
};

interface TrainingMetric {
  label: string;
  value: string;
  detail?: string;
}

interface TrainingStateCardProps {
  state: TrainingState;
  metrics: TrainingMetric[];
  goal?: string;
  goalDaysLeft?: number;
}

function Gauge({ position }: { position: number }) {
  return (
    <div className="relative py-2">
      <div className="h-(--border-width-strong) w-full rounded-full bg-(--color-border)" />
      <div
        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--color-fg) ring-2 ring-(--color-bg-elevated)"
        style={{ left: `${position}%` }}
      />
      <div className="mt-2.5 flex justify-between">
        <span className="text-2xs text-(--color-fg-subtle)">Désentraîn.</span>
        <span className="text-2xs text-(--color-fg-subtle)">Surcharge</span>
      </div>
    </div>
  );
}

export function TrainingStateCard({
  state,
  metrics,
  goal,
  goalDaysLeft,
}: TrainingStateCardProps) {
  const config = STATE_CONFIG[state];

  return (
    <div className="flex h-full flex-col justify-between rounded-[--radius-md] border border-(--color-border) bg-(--color-bg-elevated) p-4 lg:p-6">
      {/* Section 1 — titre + état */}
      <div>
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          État d'entraînement
        </span>
        <p
          className="mt-3 text-xl font-semibold tracking-[-0.02em]"
          style={{ color: config.color }}
        >
          {config.label}
        </p>
      </div>

      {/* Section 2 — jauge (centrée verticalement) */}
      <div>
        <Gauge position={config.position} />
      </div>

      {/* Section 3 — métriques + objectif */}
      <div>
        <div className="flex flex-wrap gap-4 border-t border-(--color-border) pt-4 lg:gap-6 lg:pt-5">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                {m.label}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-sm font-medium tabular-nums text-(--color-fg)">
                  {m.value}
                </span>
                {m.detail && (
                  <span className="text-2xs text-(--color-fg-subtle)">{m.detail}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {goal && goalDaysLeft !== undefined && (
          <div className="mt-4 flex items-center justify-between border-t border-(--color-border) pt-3">
            <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
              {goal}
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-(--color-fg)">
              J‑{goalDaysLeft}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
