"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HabitEntry,
  HabitStore,
  addDays,
  avgMood,
  currentStreak,
  emptyEntry,
  filledCount,
  hasAnyValue,
  loadStore,
  parseLocalDate,
  saveStore,
  toLocalISODate,
} from "@/lib/habits";

const HABITS = [
  { key: "ate_well", label: "Bien mangé" },
  { key: "alcohol", label: "Alcool" },
  { key: "screens_before_bed", label: "Écrans avant de dormir" },
] as const;

type BoolKey = (typeof HABITS)[number]["key"];

function formatLongDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function moodTone(mood: number | null): string {
  if (mood === null) return "bg-(--color-bg-muted)";
  if (mood <= 2) return "bg-(--color-fg-disabled)";
  if (mood <= 4) return "bg-(--color-fg-subtle)";
  if (mood <= 6) return "bg-(--color-fg-muted)";
  if (mood <= 8) return "bg-(--color-fg)/70";
  return "bg-(--color-fg)";
}

/* ── Rating row (1-10) ──────────────────────────────────────── */

function RatingRow({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Note ${n}`}
            aria-pressed={active}
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-sm) border font-mono text-xs tabular-nums",
              "transition-colors duration-[--duration-base]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
              active
                ? "border-(--color-accent) bg-(--color-accent-bg) text-(--color-accent)"
                : "border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg-muted) hover:border-(--color-border-strong) hover:text-(--color-fg)"
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

/* ── Yes/No segmented control ──────────────────────────────── */

function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="inline-flex h-8 items-center gap-0.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-subtle) p-0.5">
      {[
        { v: true, label: "Oui" },
        { v: false, label: "Non" },
      ].map((opt) => {
        const active = value === opt.v;
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.v)}
            aria-pressed={active}
            className={cn(
              "flex h-full min-w-12 items-center justify-center rounded-[3px] px-3 text-xs font-medium",
              "transition-colors duration-[--duration-base]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
              active
                ? "bg-(--color-bg-elevated) text-(--color-accent)"
                : "text-(--color-fg-muted) hover:text-(--color-fg)"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Date carousel (past 14 days, no future) ───────────────── */

function DateCarousel({
  selected,
  today,
  onChange,
  store,
}: {
  selected: string;
  today: string;
  onChange: (iso: string) => void;
  store: HabitStore;
}) {
  const isAtToday = selected === today;
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  return (
    <div className="flex items-center gap-2 border-b border-(--color-border) px-4 py-3">
      <button
        type="button"
        onClick={() => onChange(addDays(selected, -1))}
        aria-label="Jour précédent"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none [touch-action:pan-x]">
        {days.map((day) => {
          const d = parseLocalDate(day);
          const isSelected = day === selected;
          const isTodayDay = day === today;
          const filled = hasAnyValue(store[day]);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onChange(day)}
              className={cn(
                "relative flex shrink-0 flex-col items-center gap-0.5 rounded-(--radius-md) px-3 py-1.5 transition-colors duration-[--duration-base] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                isSelected ? "bg-(--color-accent-bg)" : "hover:bg-(--color-bg-muted)"
              )}
              aria-current={isSelected ? "date" : undefined}
            >
              <span
                className={cn(
                  "font-mono text-2xs uppercase tracking-[0.06em]",
                  isSelected ? "text-(--color-accent)" : "text-(--color-fg-subtle)"
                )}
              >
                {d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3)}
              </span>
              <span
                className={cn(
                  "font-mono text-sm font-medium tabular-nums",
                  isSelected ? "text-(--color-accent)" : "text-(--color-fg)"
                )}
              >
                {d.getDate()}
              </span>
              {(filled || (isTodayDay && !isSelected)) && (
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    filled ? "bg-(--color-success)" : "bg-(--color-accent)"
                  )}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onChange(addDays(selected, 1))}
        disabled={isAtToday}
        aria-label="Jour suivant"
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
          isAtToday ? "cursor-not-allowed opacity-30" : "hover:bg-(--color-bg-muted) hover:text-(--color-fg)"
        )}
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) hover:bg-(--color-bg-muted) hover:text-(--color-fg)">
        <CalendarDays className="h-4 w-4 pointer-events-none" strokeWidth={1.5} />
        <input
          type="date"
          max={today}
          value={selected}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Choisir une date"
        />
      </label>
    </div>
  );
}

/* ── Heatmap (52 weeks × 7 days) ───────────────────────────── */

function Heatmap({ store, today }: { store: HabitStore; today: string }) {
  const weeks = 52;
  const totalDays = weeks * 7;

  // Align last column on today's weekday. Build columns left→right ending today.
  const todayDate = parseLocalDate(today);
  const todayDow = (todayDate.getDay() + 6) % 7; // Mon=0..Sun=6
  const startOffset = -(totalDays - 1 - (6 - todayDow));

  const cells: { iso: string; entry: HabitEntry | undefined }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const iso = addDays(today, startOffset + i);
    cells.push({ iso, entry: store[iso] });
  }

  // Group into columns of 7 (Mon→Sun)
  const columns: typeof cells[] = [];
  for (let c = 0; c < weeks; c++) {
    columns.push(cells.slice(c * 7, c * 7 + 7));
  }

  // Month labels: show first column where month changes
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  columns.forEach((col, idx) => {
    const firstDate = parseLocalDate(col[0].iso);
    if (firstDate.getMonth() !== lastMonth) {
      lastMonth = firstDate.getMonth();
      monthLabels.push({
        col: idx,
        label: firstDate.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      });
    }
  });

  const dayLabels = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="overflow-x-auto scrollbar-none">
      <div className="inline-flex flex-col gap-1 pb-1">
        {/* Month labels row */}
        <div className="ml-5 flex gap-[3px]">
          {columns.map((_, idx) => {
            const lbl = monthLabels.find((m) => m.col === idx);
            return (
              <div
                key={idx}
                className="w-[10px] font-mono text-2xs uppercase tracking-wider text-(--color-fg-subtle)"
              >
                {lbl?.label ?? ""}
              </div>
            );
          })}
        </div>

        {/* Grid with day labels */}
        <div className="flex gap-1">
          <div className="flex flex-col gap-[3px] pr-1">
            {dayLabels.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "flex h-[10px] w-3 items-center font-mono text-2xs text-(--color-fg-subtle)",
                  i % 2 === 1 ? "opacity-0" : ""
                )}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {columns.map((col, idx) => (
              <div key={idx} className="flex flex-col gap-[3px]">
                {col.map((cell) => {
                  const cellDate = parseLocalDate(cell.iso);
                  const isFuture = cell.iso > today;
                  const isToday = cell.iso === today;
                  const mood = cell.entry?.mood ?? null;
                  return (
                    <div
                      key={cell.iso}
                      title={
                        isFuture
                          ? ""
                          : mood !== null
                            ? `${formatLongDate(cell.iso)} · ${mood}/10`
                            : formatLongDate(cell.iso)
                      }
                      className={cn(
                        "h-[10px] w-[10px] rounded-[2px]",
                        isFuture ? "opacity-0" : moodTone(mood),
                        isToday && "ring-1 ring-(--color-accent) ring-inset"
                      )}
                      aria-hidden={isFuture}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="ml-5 mt-2 flex items-center gap-2 font-mono text-2xs text-(--color-fg-subtle)">
          <span>1</span>
          <div className={cn("h-[10px] w-[10px] rounded-[2px]", moodTone(2))} />
          <div className={cn("h-[10px] w-[10px] rounded-[2px]", moodTone(4))} />
          <div className={cn("h-[10px] w-[10px] rounded-[2px]", moodTone(6))} />
          <div className={cn("h-[10px] w-[10px] rounded-[2px]", moodTone(8))} />
          <div className={cn("h-[10px] w-[10px] rounded-[2px]", moodTone(10))} />
          <span>10</span>
        </div>
      </div>
    </div>
  );
}

/* ── KPI Card ──────────────────────────────────────────────── */

function KpiCard({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-5">
      <p className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {label}
      </p>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-medium tabular-nums leading-tight text-(--color-fg)">
          {value}
        </span>
        {unit && <span className="text-sm text-(--color-fg-muted)">{unit}</span>}
      </div>
      {hint && (
        <p className="mt-1 font-mono text-2xs tabular-nums text-(--color-fg-subtle)">{hint}</p>
      )}
    </div>
  );
}

/* ── Recent entries list ───────────────────────────────────── */

function RecentList({ store, today }: { store: HabitStore; today: string }) {
  const entries: HabitEntry[] = [];
  for (let i = 0; i < 30; i++) {
    const iso = addDays(today, -i);
    const e = store[iso];
    if (e && hasAnyValue(e)) entries.push(e);
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-(--radius-md) border border-dashed border-(--color-border) py-12 text-center">
        <p className="text-sm font-medium text-(--color-fg)">Aucune entrée pour le moment</p>
        <p className="mt-1 max-w-[280px] text-sm text-(--color-fg-muted)">
          Renseigne ta première journée pour commencer le suivi.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)">
      {entries.map((e, i) => {
        const d = parseLocalDate(e.date);
        const dateLabel = d.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        const flags: { label: string; tone: "success" | "danger" | "neutral" }[] = [];
        if (e.ate_well !== null) {
          flags.push({
            label: e.ate_well ? "bien mangé" : "mal mangé",
            tone: e.ate_well ? "success" : "danger",
          });
        }
        if (e.alcohol !== null) {
          flags.push({
            label: e.alcohol ? "alcool" : "pas d'alcool",
            tone: e.alcohol ? "danger" : "success",
          });
        }
        if (e.screens_before_bed !== null) {
          flags.push({
            label: e.screens_before_bed ? "écrans" : "pas d'écrans",
            tone: e.screens_before_bed ? "danger" : "success",
          });
        }

        return (
          <div
            key={e.date}
            className={cn(
              "flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4",
              i < entries.length - 1 && "border-b border-(--color-border)"
            )}
          >
            <div className="flex w-32 shrink-0 items-baseline gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-(--color-fg-muted)">
                {dateLabel}
              </span>
            </div>

            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-mono text-sm tabular-nums text-(--color-fg)">
                {e.mood !== null ? `${e.mood}/10` : "—"}
                <span className="ml-1 text-2xs uppercase tracking-wider text-(--color-fg-subtle)">
                  jour
                </span>
              </span>
              <span className="font-mono text-sm tabular-nums text-(--color-fg)">
                {e.productivity !== null ? `${e.productivity}/10` : "—"}
                <span className="ml-1 text-2xs uppercase tracking-wider text-(--color-fg-subtle)">
                  prod
                </span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {flags.map((f) => (
                  <span
                    key={f.label}
                    className={cn(
                      "inline-flex h-5 items-center rounded-[2px] px-1.5 text-2xs font-medium uppercase tracking-wider",
                      f.tone === "success" && "bg-(--color-success)/10 text-(--color-success)",
                      f.tone === "danger" && "bg-(--color-danger)/10 text-(--color-danger)",
                      f.tone === "neutral" && "bg-(--color-bg-muted) text-(--color-fg-muted)"
                    )}
                  >
                    {f.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function HabitsPage() {
  const [today, setToday] = useState("");
  const [selected, setSelected] = useState("");
  const [store, setStore] = useState<HabitStore>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const iso = toLocalISODate(new Date());
    setToday(iso);
    setSelected(iso);
    setStore(loadStore());
    setHydrated(true);
  }, []);

  const entry = useMemo<HabitEntry>(
    () => store[selected] ?? emptyEntry(selected),
    [store, selected]
  );

  function update(patch: Partial<HabitEntry>) {
    const next: HabitStore = {
      ...store,
      [selected]: { ...entry, ...patch, date: selected },
    };
    setStore(next);
    saveStore(next);
  }

  const stats = useMemo(() => {
    if (!hydrated) return { avg7: null, streak: 0, filled30: 0 };
    return {
      avg7: avgMood(store, 7, today),
      streak: currentStreak(store, today),
      filled30: filledCount(store, 30, today),
    };
  }, [store, today, hydrated]);

  if (!hydrated) {
    return <div className="flex flex-1 flex-col" />;
  }

  const selectedLabel = formatLongDate(selected);
  const isToday = selected === today;

  return (
    <div className="flex flex-1 flex-col">
      <DateCarousel selected={selected} today={today} onChange={setSelected} store={store} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-[860px]">
          <header className="mb-8">
            <h1 className="text-[2rem] font-semibold tracking-[-0.03em] leading-none text-(--color-fg) sm:text-[2.5rem]">
              Habitudes
            </h1>
            <p
              className="mt-2 text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)"
              suppressHydrationWarning
            >
              {isToday ? "Aujourd'hui · " : ""}
              {selectedLabel}
            </p>
          </header>

          {/* Form card */}
          <section className="mb-8 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-5 sm:p-6">
            <div className="flex flex-col gap-6">
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                    Note du jour
                  </span>
                  <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                    {entry.mood !== null ? `${entry.mood}/10` : "—"}
                  </span>
                </div>
                <RatingRow
                  value={entry.mood}
                  onChange={(v) => update({ mood: v })}
                />
              </div>

              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                    Productivité
                  </span>
                  <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                    {entry.productivity !== null ? `${entry.productivity}/10` : "—"}
                  </span>
                </div>
                <RatingRow
                  value={entry.productivity}
                  onChange={(v) => update({ productivity: v })}
                />
              </div>

              <div className="flex flex-col divide-y divide-(--color-border) border-y border-(--color-border)">
                {HABITS.map((h) => (
                  <div
                    key={h.key}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm font-medium text-(--color-fg)">{h.label}</span>
                    <YesNo
                      value={entry[h.key as BoolKey]}
                      onChange={(v) => update({ [h.key]: v } as Partial<HabitEntry>)}
                    />
                  </div>
                ))}
              </div>

              <p className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                Enregistré localement · sauvegarde automatique
              </p>
            </div>
          </section>

          {/* KPIs */}
          <section className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
            <KpiCard
              label="Note moy. 7 jours"
              value={stats.avg7 !== null ? stats.avg7.toFixed(1) : "—"}
              unit={stats.avg7 !== null ? "/10" : undefined}
              hint="moyenne des notes du jour"
            />
            <KpiCard
              label="Streak"
              value={stats.streak.toString()}
              unit={stats.streak > 1 ? "jours" : "jour"}
              hint="jours consécutifs renseignés"
            />
            <KpiCard
              label="Complétés 30j"
              value={`${stats.filled30}`}
              unit="/ 30"
              hint={`${Math.round((stats.filled30 / 30) * 100)}% des jours`}
            />
          </section>

          {/* Heatmap */}
          <section className="mb-8 rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                Historique 12 mois
              </span>
              <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                note du jour
              </span>
            </div>
            <Heatmap store={store} today={today} />
          </section>

          {/* Recent list */}
          <section className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                Entrées récentes
              </span>
              <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                30 derniers jours
              </span>
            </div>
            <RecentList store={store} today={today} />
          </section>
        </div>
      </div>
    </div>
  );
}
