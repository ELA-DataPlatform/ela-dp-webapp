"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Lightbulb } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

/* ── Date helpers ────────────────────────────────────────── */

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(iso: string, n: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + n);
  return toLocalISODate(d);
}

function formatDisplay(iso: string) {
  const d = parseLocalDate(iso);
  const today = toLocalISODate(new Date());
  const yesterday = addDays(today, -1);
  return {
    long: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    isToday: iso === today,
    isYesterday: iso === yesterday,
  };
}

function getScopeLabel(iso: string): string {
  const d = parseLocalDate(iso);
  const prev = new Date(d);
  prev.setDate(d.getDate() - 1);
  return `Nuit du ${prev.getDate()} au ${d.getDate()}`;
}

/* Replace SCREAMING_SNAKE_CASE fallbacks */
function humanizeScreaming(text: string): string {
  return text.replace(/\b[A-Z][A-Z_]*_[A-Z][A-Z_]*\b/g, (m) =>
    m.replace(/_/g, " ").toLowerCase()
  );
}

/* ── API types ───────────────────────────────────────────── */

interface StackedPhasesDef {
  type: "stacked_phases";
  title: string;
  unit: string;
  segments: { label: string; value: number; color: string }[];
}

interface FactorBreakdownDef {
  type: "factor_breakdown";
  title: string;
  total_label: string;
  total_value: number;
  factors: { label: string; contribution: number; color: string }[];
}

interface SparklineTrendDef {
  type: "sparkline_trend";
  title: string;
  unit: string;
  current_value: number;
  dates: string[];
  values: number[];
  baseline: number;
}

interface MetricGridDef {
  type: "metric_grid";
  title: string;
  metrics: { label: string; value: number; unit: string; delta: number | null }[];
}

interface DivergingBarsDef {
  type: "diverging_bars";
  title: string;
  unit: string;
  items: { label: string; value: number; baseline: number }[];
}

type ChartDef = StackedPhasesDef | FactorBreakdownDef | SparklineTrendDef | MetricGridDef | DivergingBarsDef;

interface ApiSection {
  id: string;
  title: string;
  summary: string;
  chart: ChartDef | null;
}

interface ApiResponse {
  generated_at: string;
  status: "feu_vert" | "vigilance" | "alerte";
  headline: string;
  subtitle: string;
  sections: ApiSection[];
}


/* ── Status mapping ──────────────────────────────────────── */

type Tone = "good" | "warning" | "danger";

const TONE_PILL: Record<Tone, string> = {
  good:    "border-[--color-success] bg-[--color-success]/10 text-[--color-success]",
  warning: "border-[--color-warning] bg-[--color-warning]/10 text-[--color-warning]",
  danger:  "border-[--color-danger]  bg-[--color-danger]/10  text-[--color-danger]",
};

const TONE_LABEL: Record<Tone, string> = {
  good: "Feu vert", warning: "Vigilance", danger: "Repos imposé",
};

function mapStatus(status: ApiResponse["status"]): Tone {
  if (status === "feu_vert") return "good";
  if (status === "vigilance") return "warning";
  return "danger";
}

/* ── Recharts shared styles ──────────────────────────────── */

const AXIS = {
  tick: { fontSize: 11, fill: "#969696", fontFamily: "var(--font-geist-mono,monospace)" },
  axisLine: false as const,
  tickLine: false as const,
};

const TT = {
  contentStyle: { background: "#fff", border: "1px solid #e8e8e8", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-geist-mono,monospace)", padding: "6px 10px", boxShadow: "none" },
  itemStyle: { color: "#232323" },
  labelStyle: { color: "#969696", fontSize: 10, marginBottom: 2 },
  cursor: { fill: "#f2f2f2" },
};

/* ── Chart: stacked_phases ───────────────────────────────── */

function StackedPhasesRenderer({ chart }: { chart: StackedPhasesDef }) {
  const total = chart.segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className="mt-5 rounded-(--radius-lg) bg-(--color-bg-subtle) px-5 py-[18px]">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{chart.title}</p>
      <div className="flex h-7 w-full overflow-hidden rounded-(--radius-sm)">
        {chart.segments.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
            title={`${seg.label} : ${seg.value} ${chart.unit}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {chart.segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: seg.color }} />
            <span className="text-[11px] text-(--color-fg-muted)">{seg.label}</span>
            <span className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
              {seg.value} {chart.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Chart: factor_breakdown ─────────────────────────────── */

function FactorBreakdownRenderer({ chart }: { chart: FactorBreakdownDef }) {
  return (
    <div className="mt-5 rounded-(--radius-lg) bg-(--color-bg-subtle) px-5 py-[18px]">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{chart.title}</p>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-medium tabular-nums leading-none text-(--color-fg)">
            {chart.total_value}
          </span>
          <span className="text-[11px] text-(--color-fg-subtle)">/ 100</span>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {chart.factors.map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-(--color-fg-muted)">{f.label}</span>
              <span className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">{f.contribution}%</span>
            </div>
            <div className="h-[5px] w-full overflow-hidden rounded-full bg-(--color-bg-muted)">
              <div
                className="h-full rounded-full"
                style={{ width: `${f.contribution}%`, background: f.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Chart: sparkline_trend ──────────────────────────────── */

function SparklineTrendRenderer({ chart }: { chart: SparklineTrendDef }) {
  const data = chart.dates.map((date, i) => {
    const [, m, d] = date.split("-");
    return { label: `${d}/${m}`, value: chart.values[i] };
  });

  return (
    <div className="mt-5 rounded-(--radius-lg) bg-(--color-bg-subtle) px-5 py-[18px]">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{chart.title}</p>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-medium tabular-nums leading-none text-(--color-fg)">
            {chart.current_value}
          </span>
          <span className="text-[11px] text-(--color-fg-subtle)">{chart.unit}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e8e8e8" />
          <XAxis dataKey="label" {...AXIS} interval={1} />
          <YAxis {...AXIS} domain={["auto", "auto"]} width={28} />
          <Tooltip {...TT} formatter={(v) => [`${v} ${chart.unit}`]} />
          <ReferenceLine
            y={chart.baseline}
            stroke="#aaaaaa"
            strokeDasharray="4 3"
            strokeWidth={1}
            label={{ value: `moy. ${chart.baseline}`, position: "insideTopLeft", fontSize: 10, fill: "#aaaaaa", fontFamily: "var(--font-geist-mono,monospace)" }}
          />
          <Line
            dataKey="value"
            stroke="#6c8ebf"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Chart: metric_grid ──────────────────────────────────── */

function MetricGridRenderer({ chart }: { chart: MetricGridDef }) {
  return (
    <div className="mt-5 rounded-(--radius-lg) bg-(--color-bg-subtle) px-5 py-[18px]">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{chart.title}</p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {chart.metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-[0.05em] text-(--color-fg-subtle)">{m.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-xl font-medium tabular-nums leading-tight text-(--color-fg)">
                {m.value}
              </span>
              {m.unit && (
                <span className="text-[11px] text-(--color-fg-muted)">{m.unit}</span>
              )}
            </div>
            {m.delta !== null && (
              <span className={cn(
                "font-mono text-[11px] tabular-nums",
                m.delta > 0 ? "text-(--color-danger)" : m.delta < 0 ? "text-(--color-success)" : "text-(--color-fg-subtle)"
              )}>
                {m.delta > 0 ? "+" : ""}{m.delta}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Chart: diverging_bars ───────────────────────────────── */

function DivergingBarsRenderer({ chart }: { chart: DivergingBarsDef }) {
  const maxDelta = Math.max(...chart.items.map((it) => Math.abs(it.value - it.baseline)));
  const scale = maxDelta > 0 ? maxDelta : 1;

  return (
    <div className="mt-5 rounded-(--radius-lg) bg-(--color-bg-subtle) px-5 py-[18px]">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{chart.title}</p>
      <div className="flex flex-col gap-3">
        {chart.items.map((it) => {
          const delta = it.value - it.baseline;
          const pct = Math.abs(delta) / scale * 45; // max 45% each side
          const positive = delta >= 0;
          const isNeutralMetric = it.label === "Léger"; // more light sleep vs baseline = neutral

          let barColor = "var(--color-fg-subtle)";
          if (!isNeutralMetric) {
            barColor = positive ? "var(--color-success)" : "var(--color-danger)";
          }

          return (
            <div key={it.label} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-right text-[11px] text-(--color-fg-muted)">{it.label}</span>
              <div className="relative flex flex-1 items-center">
                {/* Left side (below baseline) */}
                <div className="flex flex-1 justify-end">
                  {!positive && (
                    <div
                      className="h-[6px] rounded-l-sm"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  )}
                </div>
                {/* Center axis */}
                <div className="mx-px h-4 w-px shrink-0 bg-(--color-border-strong)" />
                {/* Right side (above baseline) */}
                <div className="flex flex-1">
                  {positive && (
                    <div
                      className="h-[6px] rounded-r-sm"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  )}
                </div>
              </div>
              <div className="w-20 shrink-0 font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
                <span className="text-(--color-fg)">{it.value}</span>
                <span className="mx-1 opacity-40">/</span>
                {it.baseline}<span className="ml-0.5">{chart.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Chart dispatcher ────────────────────────────────────── */

function ChartRenderer({ chart }: { chart: ChartDef }) {
  if (chart.type === "stacked_phases")   return <StackedPhasesRenderer chart={chart} />;
  if (chart.type === "factor_breakdown") return <FactorBreakdownRenderer chart={chart} />;
  if (chart.type === "sparkline_trend")  return <SparklineTrendRenderer chart={chart} />;
  if (chart.type === "metric_grid")      return <MetricGridRenderer chart={chart} />;
  if (chart.type === "diverging_bars")   return <DivergingBarsRenderer chart={chart} />;
  return null;
}

/* ── Section ─────────────────────────────────────────────── */

function SectionBlock({ section, status }: { section: ApiSection; status: Tone }) {
  const paragraphs = section.summary.split("\n").filter(Boolean).map(humanizeScreaming);
  const isRecommendation = section.id === "recommendation";

  return (
    <section>
      <hr
        aria-hidden
        style={{ border: "none", borderTop: "0.5px solid var(--color-border)", marginBottom: "1.25rem" }}
      />
      <h3
        className="mb-5 text-[1.375rem] font-[500] leading-[1.25] text-(--color-fg)"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {section.title}
      </h3>

      {isRecommendation ? (
        <div
          className={cn(
            "rounded-(--radius-lg) p-5",
            status === "good"    && "bg-[--color-success]/10",
            status === "warning" && "bg-[--color-warning]/10",
            status === "danger"  && "bg-[--color-danger]/10",
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-[14px] w-[14px] shrink-0 text-(--color-fg-subtle)" strokeWidth={1.5} />
            <span className="text-[13px] font-medium uppercase tracking-[0.05em] text-(--color-fg-muted)">
              Recommandations
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-[15px] leading-[1.6] text-(--color-fg)">{p}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base leading-[1.7] text-(--color-fg)">{p}</p>
          ))}
        </div>
      )}

      {section.chart && <ChartRenderer chart={section.chart} />}
    </section>
  );
}

/* ── DateCarousel ────────────────────────────────────────── */

function DateCarousel({ selected, today, onChange }: { selected: string; today: string; onChange: (iso: string) => void }) {
  const isAtToday = selected === today;
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div className="flex items-center gap-2 overflow-hidden border-b border-(--color-border) px-4 py-3">
      <button
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
          return (
            <button
              key={day}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => onChange(day)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 rounded-(--radius-md) px-3 py-1.5 transition-colors duration-[--duration-base] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                isSelected ? "bg-(--color-accent-bg)" : "hover:bg-(--color-bg-muted)"
              )}
              aria-current={isSelected ? "date" : undefined}
            >
              <span className={cn("font-mono text-[11px] uppercase tracking-[0.06em]", isSelected ? "text-(--color-accent)" : "text-(--color-fg-subtle)")}>
                {d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3)}
              </span>
              <span className={cn("font-mono text-sm font-medium tabular-nums", isSelected ? "text-(--color-accent)" : "text-(--color-fg)")}>
                {d.getDate()}
              </span>
              {isTodayDay && !isSelected && <span className="h-1 w-1 rounded-full bg-(--color-accent)" aria-hidden />}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onChange(addDays(selected, 1))}
        disabled={isAtToday}
        aria-label="Jour suivant"
        suppressHydrationWarning
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

/* ── Loading skeleton ────────────────────────────────────── */

function LoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[680px] animate-pulse px-5 py-10 sm:px-8">
      <div className="mb-4 h-3 w-48 rounded bg-(--color-bg-muted)" />
      <div className="mb-3 h-8 w-full rounded bg-(--color-bg-muted)" />
      <div className="mb-2 h-8 w-4/5 rounded bg-(--color-bg-muted)" />
      <div className="mb-8 h-4 w-2/3 rounded bg-(--color-bg-muted)" />
      <hr style={{ border: "none", borderTop: "0.5px solid var(--color-border)" }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="mt-12">
          <div className="mb-5 h-[1px] w-full bg-(--color-bg-muted)" />
          <div className="mb-5 h-6 w-32 rounded bg-(--color-bg-muted)" />
          <div className="flex flex-col gap-3">
            <div className="h-4 w-full rounded bg-(--color-bg-muted)" />
            <div className="h-4 w-5/6 rounded bg-(--color-bg-muted)" />
            <div className="h-4 w-4/5 rounded bg-(--color-bg-muted)" />
          </div>
          <div className="mt-5 h-40 rounded-(--radius-lg) bg-(--color-bg-muted)" />
        </div>
      ))}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */

function EmptyDay() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <CalendarDays className="mb-4 h-8 w-8 text-(--color-fg-subtle)" strokeWidth={1.5} />
      <p className="text-sm font-medium text-(--color-fg)">Aucune synthèse</p>
      <p className="mt-1 max-w-[280px] text-sm text-(--color-fg-muted)">La synthèse n'a pas encore été générée pour ce jour.</p>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */

export default function DailyPage() {
  const [today] = useState(() => toLocalISODate(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toLocalISODate(new Date()));
  const [briefing, setBriefing] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setBriefing(null);

    const path = selectedDate === today
      ? "/webapp/daily-report/"
      : `/webapp/daily-report/?date=${selectedDate}`;

    apiFetch(path)
      .then((r) => r.json())
      .then((envelope: unknown) => {
        // API wraps the payload: { "output": "<JSON string>" }
        let data: unknown = envelope;
        if (envelope && typeof envelope === "object" && "output" in envelope) {
          const raw = (envelope as { output: unknown }).output;
          data = typeof raw === "string" ? JSON.parse(raw) : raw;
        }
        const isEmpty = !data || typeof data !== "object" || Object.keys(data as object).length === 0;
        setBriefing(isEmpty ? null : (data as ApiResponse));
      })
      .catch(() => setBriefing(null))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const status = briefing ? mapStatus(briefing.status) : "warning";
  const fmt = formatDisplay(selectedDate);

  return (
    <div className="flex flex-1 flex-col">
      <DateCarousel selected={selectedDate} today={today} onChange={setSelectedDate} />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : briefing ? (
          <div className="mx-auto w-full max-w-[680px] px-5 py-10 sm:px-8">

            {/* Editorial header */}
            <div className="mb-10">
              {/* Meta line : date · scope · pill statut */}
              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-subtle)">
                  {fmt.long}
                  <span className="mx-2 opacity-50">·</span>
                  {getScopeLabel(selectedDate)}
                </p>
                <span className={cn("inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium", TONE_PILL[status])}>
                  {TONE_LABEL[status]}
                </span>
              </div>

              {/* Headline éditorial — sérif */}
              <h1
                className="text-[1.75rem] font-[500] leading-[1.25] text-(--color-fg)"
                style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.01em" }}
              >
                {briefing.headline}
              </h1>

              {/* Sous-titre */}
              <p
                className="mt-3 text-base italic text-(--color-fg-muted)"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {briefing.subtitle}
              </p>

              {/* Séparateur */}
              <hr
                aria-hidden
                className="mt-8"
                style={{ border: "none", borderTop: "0.5px solid var(--color-border)" }}
              />
            </div>

            {/* Sections */}
            <div className="flex flex-col gap-12">
              {briefing.sections.map((section) => (
                <SectionBlock key={section.id} section={section} status={status} />
              ))}
            </div>

          </div>
        ) : (
          <EmptyDay />
        )}
      </div>
    </div>
  );
}
