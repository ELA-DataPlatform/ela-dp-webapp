"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Lightbulb } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
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

/* Replace SCREAMING_SNAKE_CASE fallbacks (agent-side sanitization should catch these first) */
function humanizeScreaming(text: string): string {
  return text.replace(/\b[A-Z][A-Z_]*_[A-Z][A-Z_]*\b/g, (m) =>
    m.replace(/_/g, " ").toLowerCase()
  );
}

/* ── API types ───────────────────────────────────────────── */

interface ChartSeries {
  label: string;
  color: string;
  style?: "solid" | "dashed";
  data: number[];
}

interface BarChartDef {
  type: "bar";
  title: string;
  labels: string[];
  series: ChartSeries[];
  unit: string;
}

interface GaugeDef {
  type: "gauge";
  title: string;
  value: number;
  max: number;
  thresholds: { label: string; min: number; max: number; color: string }[];
}

interface LineChartDef {
  type: "line";
  title: string;
  labels: string[];
  series: ChartSeries[];
  unit: string;
}

type ChartDef = BarChartDef | GaugeDef | LineChartDef;

interface ApiSection {
  id: string;
  title: string;
  summary: string;
  chart: ChartDef | null;
}

interface ApiResponse {
  generated_at: string;
  headline: string;
  sections: ApiSection[];
}

/* ── Mock ────────────────────────────────────────────────── */

const MOCK: ApiResponse = {
  generated_at: "2026-05-10T09:30:00+02:00",
  headline: "Nuit pauvre après un gros trail — récupération incomplète, mais le corps tient : séance légère possible si les jambes le permettent.",
  sections: [
    {
      id: "sleep",
      title: "Nuit",
      summary: "Score de 48/100 (POOR) pour 6h59 de sommeil total — très loin de la moyenne des 14 derniers jours (75/100, 7h06) avec seulement 25 min de REM contre 1h en moyenne.\nStructure de la nuit dégradée (feedback Garmin : NEGATIVE_POOR_STRUCTURE) : le sommeil profond est réduit à 51 min, le temps éveillé explose à 1h47, et l'HRV nocturne tombe à 54 ms contre 66 ms la nuit précédente.\nCause directe identifiée : le trail de 17,5 km / +573 m effectué le 08/05 (charge 161 TRIMP, effet TEMPO, FC moy 155 bpm) a clairement perturbé l'architecture du sommeil de récupération.",
      chart: {
        type: "bar",
        title: "Structure de la nuit du 09/05 vs moyenne 14 jours",
        labels: ["Profond", "Léger", "REM", "Éveillé"],
        series: [
          { label: "Nuit du 09/05 (min)", color: "#6c8ebf", data: [51, 343, 25, 107] },
          { label: "Moyenne 14 j (min)",  color: "#aaaaaa", data: [60, 300, 60, 38]  },
        ],
        unit: "min",
      },
    },
    {
      id: "recovery",
      title: "Récupération",
      summary: "Training Readiness à 59/100 (MODERATE / RECOVERED_AND_READY) : le score est tiré vers le bas uniquement par le facteur sommeil (0 %), tandis que HRV (93 %), stress historique (97 %) et ACWR (96 %) sont tous au vert.\nLe temps de récupération résiduel de 502 heures signale que la charge accumulée sur 2 semaines reste perceptible par le système.\nLa Body Battery a regagné +54 points malgré la nuit dégradée — signe que l'organisme a malgré tout réussi à récupérer une partie de l'énergie dépensée.",
      chart: {
        type: "gauge",
        title: "Training Readiness",
        value: 59,
        max: 100,
        thresholds: [
          { label: "LOW",      min: 0,  max: 40,  color: "#e05c5c" },
          { label: "MODERATE", min: 40, max: 60,  color: "#f0a500" },
          { label: "HIGH",     min: 60, max: 100, color: "#5cb85c" },
        ],
      },
    },
    {
      id: "hrv",
      title: "HRV",
      summary: "L'HRV nocturne à 54 ms cette nuit est dans la zone baseline (seuil bas : 53 ms) mais accuse une chute de 12 ms par rapport à la nuit précédente (66 ms) — le système nerveux autonome digère encore l'effort du trail.\nSur 14 jours, la courbe HRV présente deux creux marqués (44 ms le 02/05 et 48 ms les 26/04 et 06/05), coïncidant avec les jours post-séances les plus intenses.\nLa tendance de fond reste dans la zone équilibrée (baseline 53–75 ms), ce qui confirme qu'il n'y a pas de surmenage chronique — seulement une fatigue aiguë passagère.",
      chart: {
        type: "line",
        title: "HRV nocturne 14 derniers jours",
        labels: ["26/04","27/04","28/04","29/04","30/04","01/05","02/05","03/05","04/05","05/05","06/05","07/05","08/05","09/05"],
        series: [
          { label: "HRV nuit",       color: "#6c8ebf",                  data: [48,63,60,68,66,63,44,63,52,62,48,63,66,54] },
          { label: "Baseline basse", color: "#aaaaaa", style: "dashed", data: [55,55,55,56,55,55,54,54,54,54,54,54,54,53] },
          { label: "Baseline haute", color: "#dddddd", style: "dashed", data: [76,76,76,75,75,75,75,75,75,75,75,75,75,75] },
        ],
        unit: "ms",
      },
    },
    {
      id: "training",
      title: "Charge d'entraînement",
      summary: "Semaine passée très chargée : trail TEMPO de 161 TRIMP le 08/05 (17,5 km / +573 m) après une séance seuil (LT) de 123 TRIMP le 05/05 — deux efforts élevés en 3 jours.\nL'ACWR est parfaitement équilibré à 1,0 (charge aiguë 368 / chronique 352), ce qui exclut tout risque de surcharge ou de désentraînement — la progression est cohérente.\nLe statut Garmin UNPRODUCTIVE contraste avec ces chiffres et s'explique probablement par la nuit dégradée qui pénalise le calcul interne ; le trend de fitness à +3 plaide pour une dynamique positive.",
      chart: {
        type: "bar",
        title: "Charge d'entraînement par séance (14 derniers jours)",
        labels: ["28/04 Course", "30/04 Course", "03/05 Trail", "05/05 Intervalles", "08/05 Trail", "09/05 Marche"],
        series: [
          { label: "Charge (TRIMP)", color: "#6c8ebf", data: [56, 95, 138, 123, 161, 6] },
        ],
        unit: "TRIMP",
      },
    },
    {
      id: "verdict",
      title: "Verdict du jour",
      summary: "Sortie légère possible aujourd'hui : footing 45–50 min en zone 1–2 max (FC < 140 bpm), sans dénivelé, pour activer la circulation sans ajouter de stress neuromusculaire.\nPriorité absolue : la nuit prochaine — coucher avant 22h30, limiter les écrans dès 21h pour maximiser le rebond REM dont le corps manque.\nÉviter toute séance de seuil ou de trail avant 48–72 h : l'ACWR est optimal, ne pas le déséquilibrer par un effort qui aggraverait la dette de récupération déjà visible sur l'HRV.",
      chart: null,
    },
  ],
};

function getMockBriefing(_iso: string): ApiResponse | null {
  return MOCK;
}

/* ── Headline parsing ────────────────────────────────────── */

function parseHeadline(headline: string): { title: string; subtitle: string } {
  const sep = " : ";
  const idx = headline.indexOf(sep);
  if (idx !== -1) {
    return { title: headline.slice(0, idx), subtitle: headline.slice(idx + sep.length) };
  }
  return { title: headline, subtitle: "" };
}

/* ── Status derivation ───────────────────────────────────── */

type Tone = "good" | "warning" | "danger";

const TONE_PILL: Record<Tone, string> = {
  good:    "border-[--color-success] bg-[--color-success]/10 text-[--color-success]",
  warning: "border-[--color-warning] bg-[--color-warning]/10 text-[--color-warning]",
  danger:  "border-[--color-danger]  bg-[--color-danger]/10  text-[--color-danger]",
};

const TONE_LABEL: Record<Tone, string> = {
  good: "Feu vert", warning: "Vigilance", danger: "Repos imposé",
};

function deriveStatus(sections: ApiSection[]): Tone | null {
  for (const s of sections) {
    if (s.chart?.type === "gauge") {
      const { value, thresholds } = s.chart;
      const bucket = [...thresholds].reverse().find((t) => value >= t.min);
      if (!bucket) return "danger";
      if (bucket.label === "HIGH") return "good";
      if (bucket.label === "MODERATE") return "warning";
      return "danger";
    }
  }
  return null;
}

/* ── Recharts shared styles ──────────────────────────────── */

const AXIS = {
  tick: { fontSize: 11, fill: "#969696", fontFamily: "var(--font-geist-mono,monospace)" },
  axisLine: false as const,
  tickLine: false as const,
};

const TT = {
  contentStyle: { background:"#fff", border:"1px solid #e8e8e8", borderRadius:6, fontSize:12, fontFamily:"var(--font-geist-mono,monospace)", padding:"6px 10px", boxShadow:"none" },
  itemStyle: { color:"#232323" },
  labelStyle: { color:"#969696", fontSize:10, marginBottom:2 },
  cursor: { fill:"#f2f2f2" },
};

/* ── Chart: bar ──────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MultilineTick({ x, y, payload }: any) {
  const lines: string[] = String(payload.value).split("\n");
  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text key={i} x={0} y={0} dy={12 + i * 11} textAnchor="middle" fontSize={10} fill="#969696" fontFamily="var(--font-geist-mono,monospace)">
          {line}
        </text>
      ))}
    </g>
  );
}

function BarChartRenderer({ chart }: { chart: BarChartDef }) {
  const data = chart.labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    chart.series.forEach((s) => { row[s.label] = s.data[i]; });
    return row;
  });
  const multiline = chart.labels.some((l) => l.includes("\n"));
  const xHeight = multiline ? 36 : 20;

  return (
    <div className="mt-5 rounded-(--radius-lg) bg-(--color-bg-subtle) px-5 py-[18px]">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{chart.title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%" barGap={2} margin={{ top: 4, right: 8, bottom: xHeight - 20, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e8e8e8" />
          <XAxis dataKey="label" tick={multiline ? <MultilineTick /> : { ...AXIS.tick }} axisLine={false} tickLine={false} interval={0} />
          <YAxis {...AXIS} tickFormatter={(v) => `${v}`} width={28} />
          <Tooltip {...TT} formatter={(v) => [`${v} ${chart.unit}`]} />
          {chart.series.length > 1 && (
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-geist-mono,monospace)", paddingTop: 8 }} />
          )}
          {chart.series.map((s) => (
            <Bar key={s.label} dataKey={s.label} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={32} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Chart: line ─────────────────────────────────────────── */

function LineChartRenderer({ chart }: { chart: LineChartDef }) {
  const data = chart.labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    chart.series.forEach((s) => { row[s.label] = s.data[i]; });
    return row;
  });

  return (
    <div className="mt-5 rounded-(--radius-lg) bg-(--color-bg-subtle) px-5 py-[18px]">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{chart.title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#e8e8e8" />
          <XAxis dataKey="label" {...AXIS} interval={1} />
          <YAxis {...AXIS} domain={["auto", "auto"]} width={28} />
          <Tooltip {...TT} formatter={(v) => [`${v} ${chart.unit}`]} />
          <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-geist-mono,monospace)", paddingTop: 8 }} />
          {chart.series.map((s) => (
            <Line
              key={s.label}
              dataKey={s.label}
              stroke={s.color}
              strokeWidth={s.style === "dashed" ? 1 : 1.5}
              strokeDasharray={s.style === "dashed" ? "5 3" : undefined}
              dot={false}
              activeDot={s.style === "dashed" ? false : { r: 3, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Chart: gauge (SVG) ──────────────────────────────────── */

function GaugeRenderer({ chart }: { chart: GaugeDef }) {
  const { value, max, thresholds } = chart;
  const cx = 110, cy = 88, outerR = 72, innerR = 50;

  function polar(v: number, r: number) {
    const angle = Math.PI * (1 - v / max);
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  }

  function segment(from: number, to: number) {
    const p1o = polar(from, outerR), p2o = polar(to, outerR);
    const p1i = polar(from, innerR), p2i = polar(to, innerR);
    return [
      `M${p1o.x.toFixed(2)} ${p1o.y.toFixed(2)}`,
      `A${outerR} ${outerR} 0 0 1 ${p2o.x.toFixed(2)} ${p2o.y.toFixed(2)}`,
      `L${p2i.x.toFixed(2)} ${p2i.y.toFixed(2)}`,
      `A${innerR} ${innerR} 0 0 0 ${p1i.x.toFixed(2)} ${p1i.y.toFixed(2)}`,
      "Z",
    ].join(" ");
  }

  const active = [...thresholds].reverse().find((t) => value >= t.min) ?? thresholds[0];
  const needleTip = polar(value, outerR - 6);

  return (
    <div className="mt-5 rounded-(--radius-lg) bg-(--color-bg-subtle) px-5 py-[18px]">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{chart.title}</p>
      <div className="flex flex-col items-center gap-3">
        <svg viewBox="0 0 220 100" className="w-full max-w-[260px]" aria-hidden>
          {thresholds.map((t) => (
            <path key={`bg-${t.label}`} d={segment(t.min, t.max)} fill={t.color} opacity={0.12} />
          ))}
          {value > 0 && (
            <path d={segment(0, Math.min(value, max))} fill={active.color} opacity={0.9} />
          )}
          {thresholds.map((t) => {
            const mid = (t.min + t.max) / 2;
            const p = polar(mid, outerR + 14);
            return (
              <text
                key={`lbl-${t.label}`}
                x={p.x.toFixed(2)} y={p.y.toFixed(2)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={8} fontFamily="var(--font-geist-sans,sans-serif)"
                fill={t.color} fontWeight={500}
              >
                {t.label}
              </text>
            );
          })}
          <line
            x1={cx} y1={cy}
            x2={needleTip.x.toFixed(2)} y2={needleTip.y.toFixed(2)}
            stroke="#1a1a1a" strokeWidth={1.5} strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={4} fill="#1a1a1a" />
        </svg>

        <div className="flex items-baseline gap-2">
          <span className="font-mono text-4xl font-medium tabular-nums leading-none" style={{ color: active.color }}>
            {value}
          </span>
          <span className="text-sm text-(--color-fg-muted)">/ {max}</span>
          <span className="ml-1 rounded-(--radius-sm) border px-2 py-0.5 text-xs font-medium"
            style={{ color: active.color, borderColor: active.color, background: `${active.color}18` }}>
            {active.label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Chart dispatcher ────────────────────────────────────── */

function ChartRenderer({ chart }: { chart: ChartDef }) {
  if (chart.type === "bar")   return <BarChartRenderer chart={chart} />;
  if (chart.type === "line")  return <LineChartRenderer chart={chart} />;
  if (chart.type === "gauge") return <GaugeRenderer chart={chart} />;
  return null;
}

/* ── Section ─────────────────────────────────────────────── */

function SectionBlock({ section, status }: { section: ApiSection; status: Tone | null }) {
  const paragraphs = section.summary.split("\n").filter(Boolean).map(humanizeScreaming);
  const isVerdict = section.id === "verdict";

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

      {isVerdict ? (
        <div
          className={cn(
            "rounded-(--radius-lg) p-5",
            status === "good"    && "bg-[--color-success]/10",
            status === "warning" && "bg-[--color-warning]/10",
            (status === "danger" || !status) && "bg-[--color-danger]/10",
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
  const status = briefing ? deriveStatus(briefing.sections) : null;
  const { title, subtitle } = briefing ? parseHeadline(briefing.headline) : { title: "", subtitle: "" };
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
                {status && (
                  <span className={cn("inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium", TONE_PILL[status])}>
                    {TONE_LABEL[status]}
                  </span>
                )}
              </div>

              {/* Headline éditorial — sérif */}
              <h1
                className="text-[1.75rem] font-[500] leading-[1.25] text-(--color-fg)"
                style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.01em" }}
              >
                {title}
              </h1>

              {/* Sous-titre italique */}
              {subtitle && (
                <p
                  className="mt-3 text-base italic text-(--color-fg-muted)"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {subtitle}
                </p>
              )}

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
