"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Lightbulb } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

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

type ChartDef = StackedPhasesDef | FactorBreakdownDef | SparklineTrendDef | MetricGridDef;

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

/* ── Mock ────────────────────────────────────────────────── */

const MOCK: ApiResponse = {
  generated_at: "2026-05-10T09:00:00+00:00",
  status: "vigilance",
  headline: "Nuit du 9 mai nettement perturbée après un trail exigeant — le système nerveux tient, mais ne demande pas à être sollicité fort aujourd'hui",
  subtitle: "Sortie légère en zone 2 envisageable, 45 min max, sans dénivelé.",
  sections: [
    {
      id: "sleep",
      title: "Nuit",
      summary: "La nuit du 9 mai est la pire de la quinzaine : score 48/100, structure nettement perturbée, avec 1h47 d'éveil fragmentant une durée brute de 6h59.\n\nLe contenu utile se décompose en 51 min de sommeil profond, seulement 25 min de REM (Rapid Eye Movement — la phase de récupération cognitive), et 5h43 de sommeil léger. Le REM est à son plus bas depuis 14 jours : la moyenne sur la période est de 66 min, soit 2,6 fois plus. Le sommeil profond, lui, se situe légèrement sous la moyenne (1h00 sur 14 j), sans s'effondrer.\n\nLa cause directe est identifiable : la veille, le 8 mai, tu as enchaîné 17,5 km de trail avec 573 m de dénivelé positif (D+) en 2h21 à FC moyenne 155 bpm — la charge la plus lourde de la fenêtre de 14 jours. Une nuit aussi fragmentée au lendemain d'un effort aussi intense est un signal classique de système nerveux encore sous tension, pas un accident isolé.\n\nLa Body Battery gagne quand même +54 points dans la nuit, ce qui signifie que la récupération énergétique a fonctionné même si la structure était mauvaise. Ce n'est pas une nuit à zéro — c'est une nuit incomplète.",
      chart: {
        type: "stacked_phases",
        title: "Structure de la nuit du 9 mai",
        unit: "min",
        segments: [
          { label: "Sommeil profond", value: 51,  color: "#1a237e" },
          { label: "REM",             value: 25,  color: "#7b1fa2" },
          { label: "Léger",           value: 343, color: "#42a5f5" },
          { label: "Éveil",           value: 107, color: "#ef9a9a" },
        ],
      },
    },
    {
      id: "recovery",
      title: "Récupération",
      summary: "Le Training Readiness du jour s'établit à 59/100 — un niveau correct qui masque une tension réelle : le facteur sommeil contribue à hauteur de 0 %, tirant le score vers le bas, tandis que l'HRV (Variabilité de la Fréquence Cardiaque nocturne) et l'historique de stress portent respectivement 93 % et 97 % des signaux positifs.\n\nLe temps de récupération estimé par Garmin dépasse 500 heures — chiffre à ne pas lire au pied de la lettre, mais qui indique que la charge récente est jugée significative par l'algorithme. L'ACWR (ratio charge aiguë / charge chronique) est à 1,0, donc la balance de charge est équilibrée : tu n'es pas en surcharge absolue, mais tu n'as pas non plus de marge pour absorber un effort supplémentaire intense sans dégradation.\n\nLa FC de repos mesurée cette nuit est à 52 bpm, soit un bpm au-dessus de la moyenne sur 14 jours (51 bpm) et loin du pic bas à 47 bpm. L'écart est modeste mais cohérent avec une légère activation résiduelle du système nerveux sympathique après le trail du 8 mai.",
      chart: {
        type: "factor_breakdown",
        title: "Facteurs du Training Readiness — 10 mai",
        total_label: "Readiness",
        total_value: 59,
        factors: [
          { label: "HRV nocturne",        contribution: 93, color: "#43a047" },
          { label: "Historique de stress", contribution: 97, color: "#66bb6a" },
          { label: "Temps de récupération",contribution: 86, color: "#ffa726" },
          { label: "ACWR",                contribution: 96, color: "#29b6f6" },
          { label: "Sommeil",             contribution: 0,  color: "#ef5350" },
        ],
      },
    },
    {
      id: "hrv",
      title: "HRV",
      summary: "L'HRV nocturne de la nuit du 9 mai tombe à 54 ms — soit 12 ms sous le pic de la semaine passée (66 ms, nuit du 8 mai) et juste à la limite basse de la zone équilibrée (53–75 ms sur la fenêtre). Ce n'est pas une chute libre : le signal reste dans sa plage normale, mais il ne grimpe pas.\n\nLa dynamique sur 14 jours est en dents de scie plutôt qu'en tendance franche. Les valeurs basses (44 ms le 2 mai, 48 ms les 26 avril et 6 mai) coïncident systématiquement avec des nuits suivant ou précédant des efforts intenses. Les valeurs hautes (66–68 ms) apparaissent lors des nuits de récupération active. C'est un pattern de réponse saine : le système nerveux réagit à la charge et rebondit.\n\nLa moyenne hebdomadaire HRV est à 58 ms, dans la zone équilibrée. La baseline basse se situe à 53–55 ms selon les jours : la nuit du 9 mai est au ras de ce plancher, pas en-dessous. Le système nerveux a absorbé la charge du trail sans décrocher — mais il n'a pas encore repassé la main.",
      chart: {
        type: "sparkline_trend",
        title: "HRV nocturne — 14 derniers jours",
        unit: "ms",
        current_value: 54,
        dates: ["2026-04-26","2026-04-27","2026-04-28","2026-04-29","2026-04-30","2026-05-01","2026-05-02","2026-05-03","2026-05-04","2026-05-05","2026-05-06","2026-05-07","2026-05-08","2026-05-09"],
        values: [48, 63, 60, 68, 66, 63, 44, 63, 52, 62, 48, 63, 66, 54],
        baseline: 58.6,
      },
    },
    {
      id: "training",
      title: "Charge d'entraînement",
      summary: "Le statut d'entraînement du jour est non productif malgré un ACWR équilibré à 1,0 (charge aiguë 368, charge chronique 352). Ce paradoxe s'explique : la charge est bien dosée en volume, mais la qualité de récupération entre les séances n'est pas suffisante pour que le corps en tire un bénéfice adaptatif optimal — la nuit du 9 mai en est le symptôme le plus direct.\n\nLes 6 séances sur 14 jours se lisent en deux blocs. Un premier bloc actif fin avril (28 avril, 30 avril) à charge modérée (FC 142–149 bpm, 6–7 km). Un second bloc plus dense début mai : 15,5 km + 317 D+ le 3 mai, 5,8 km + 228 D+ le 5 mai, et le trail du 8 mai (17,5 km + 573 D+) sans repos complet entre chaque sortie. La sortie du 9 mai à 5,4 km / FC 95 bpm / allure 15 min/km est manifestement une marche ou sortie récupération — une bonne décision.\n\nLa tendance fitness est en légère hausse (+3). La machine progresse, mais elle demande une fenêtre de récupération franche pour consolider les adaptations. La surcharge n'est pas là — la sous-récupération ponctuellement, oui.",
      chart: {
        type: "metric_grid",
        title: "Charge d'entraînement — 14 jours",
        metrics: [
          { label: "Charge aiguë",      value: 368, unit: "TRIMP", delta: null },
          { label: "Charge chronique",  value: 352, unit: "TRIMP", delta: null },
          { label: "ACWR",              value: 1.0, unit: "",      delta: null },
          { label: "Tendance fitness",  value: 3,   unit: "",      delta: null },
          { label: "FC repos (14 j)",   value: 51,  unit: "bpm",   delta: 1   },
          { label: "Séances (14 j)",    value: 6,   unit: "",      delta: null },
        ],
      },
    },
    {
      id: "recommendation",
      title: "Prescription du jour",
      summary: "Une sortie courte en zone 2 (Z2) est envisageable : 40 à 50 min, FC plafonnée à 140 bpm, terrain plat, pas de D+. L'objectif est de maintenir le flux sans ajouter de stimulus intense que les nuits récentes n'ont pas les ressources pour absorber.\n\nCondition de repli : si les jambes sont lourdes dès le premier kilomètre ou si la FC monte à 140 bpm à allure Z2 habituelle, tu coupes à 30 min ou tu passes en marche active. Ce n'est pas une capitulation — c'est lire un signal clair.\n\nÀ éviter aujourd'hui : toute séance avec fractions, dénivelé, ou durée supérieure à 60 min. Le système nerveux est juste en dessous de sa zone d'équilibre HRV ; une charge supplémentaire mal dosée risque de repousser la récupération à demain soir au lieu de ce soir.\n\nIndicateur à surveiller ce soir : si l'HRV nocturne de la prochaine nuit repasse au-dessus de 60 ms et que la Body Battery monte de plus de +65, tu peux envisager une sortie plus engagée demain.",
      chart: null,
    },
  ],
};

function getMockBriefing(_iso: string): ApiResponse | null {
  return MOCK;
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
            label={{ value: `moy. ${chart.baseline}`, position: "right", fontSize: 10, fill: "#aaaaaa", fontFamily: "var(--font-geist-mono,monospace)" }}
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

/* ── Chart dispatcher ────────────────────────────────────── */

function ChartRenderer({ chart }: { chart: ChartDef }) {
  if (chart.type === "stacked_phases")  return <StackedPhasesRenderer chart={chart} />;
  if (chart.type === "factor_breakdown") return <FactorBreakdownRenderer chart={chart} />;
  if (chart.type === "sparkline_trend") return <SparklineTrendRenderer chart={chart} />;
  if (chart.type === "metric_grid")     return <MetricGridRenderer chart={chart} />;
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

function DateCarousel({ selected, onChange }: { selected: string; onChange: (iso: string) => void }) {
  const today = toLocalISODate(new Date());
  const isAtToday = selected === today;
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  const selectedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div className="flex items-center gap-2 border-b border-(--color-border) px-4 py-3">
      <button
        onClick={() => onChange(addDays(selected, -1))}
        aria-label="Jour précédent"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
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
  const [selectedDate, setSelectedDate] = useState(() => toLocalISODate(new Date()));
  const briefing = getMockBriefing(selectedDate);
  const status = briefing ? mapStatus(briefing.status) : "warning";
  const fmt = formatDisplay(selectedDate);

  return (
    <div className="flex flex-1 flex-col">
      <DateCarousel selected={selectedDate} onChange={setSelectedDate} />

      <div className="flex-1 overflow-y-auto">
        {briefing ? (
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
