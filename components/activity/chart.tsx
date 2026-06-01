"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./card";
import { useActivityFocus } from "./focus-context";
import { fmtPace, fmtDurationHm } from "./utils";
import type { ChartPoint, Segment, SegmentKind } from "./mock-data";

const SERIES = [
  { key: "paceSecPerKm", label: "Allure",  color: "var(--color-fg)",        defaultOn: true,  axis: "pace"  },
  { key: "hrBpm",        label: "FC",      color: "var(--color-danger)",    defaultOn: true,  axis: "hr"    },
  { key: "elevM",        label: "Alt.",    color: "var(--color-fg-muted)",  defaultOn: true,  axis: "elev"  },
  { key: "cadenceSpm",   label: "Cadence", color: "var(--color-chart-2)",   defaultOn: false, axis: "cad"   },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];
type ViewMode = "line" | "bars";

const KIND_FILL: Record<SegmentKind, string> = {
  warmup:   "var(--color-fg-muted)",
  interval: "var(--color-fg)",
  recovery: "var(--color-fg-subtle)",
  cooldown: "var(--color-fg-muted)",
};

const KIND_OPACITY: Record<SegmentKind, number> = {
  warmup:   0.55,
  interval: 1,
  recovery: 0.35,
  cooldown: 0.5,
};

interface SegmentBarDatum {
  shortName: string;
  name: string;
  displayPace: number;
  rawPace: number;
  hrBpm: number;
  distanceKm: number;
  durationSec: number;
  kind: SegmentKind;
}

function shortSegmentName(s: Segment): string {
  if (s.kind === "warmup")   return "Éch.";
  if (s.kind === "cooldown") return "Retour";
  const n = s.name.match(/\d+$/)?.[0] ?? "";
  if (s.kind === "interval") return `Int.${n}`;
  return `Rec.${n}`;
}

function LineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; stroke: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) px-3 py-2"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <p className="mb-1.5 font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
        {typeof label === "number" ? `km ${label.toFixed(1)}` : ""}
      </p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: item.stroke }} />
          <span className="font-mono text-xs tabular-nums text-(--color-fg)">
            {item.name === "paceSecPerKm" && fmtPace(item.value)}
            {item.name === "hrBpm" && `${item.value} bpm`}
            {item.name === "elevM" && `${item.value} m`}
            {item.name === "cadenceSpm" && `${item.value} spm`}
          </span>
        </div>
      ))}
    </div>
  );
}

function BarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SegmentBarDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) px-3 py-2"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <p className="mb-1.5 text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {d.name}
      </p>
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-xs tabular-nums text-(--color-fg)">{fmtPace(d.rawPace)} /km</span>
        <span className="font-mono text-xs tabular-nums text-(--color-danger)">{d.hrBpm} bpm</span>
        <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
          {d.distanceKm.toFixed(1)} km · {fmtDurationHm(d.durationSec)}
        </span>
      </div>
    </div>
  );
}

export function ActivityChart({
  data,
  totalKm,
  segments = [],
}: {
  data: ChartPoint[];
  totalKm: number;
  segments?: Segment[];
}) {
  const [view, setView] = useState<ViewMode>("line");
  const [hidden, setHidden] = useState<Set<SeriesKey>>(
    () => new Set(SERIES.filter((s) => !s.defaultOn).map((s) => s.key))
  );
  const { hoveredKm, setHoveredKm } = useActivityFocus();

  function toggle(key: SeriesKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const ranges = useMemo(() => {
    const paceMin = Math.min(...data.map((d) => d.paceSecPerKm));
    const paceMax = Math.max(...data.map((d) => d.paceSecPerKm));
    const elevMax = Math.max(...data.map((d) => d.elevM));
    const cadMin = Math.min(...data.map((d) => d.cadenceSpm));
    const cadMax = Math.max(...data.map((d) => d.cadenceSpm));
    return { paceMin, paceMax, elevMax, cadMin, cadMax };
  }, [data]);

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = totalKm > 20 ? 5 : totalKm > 10 ? 2 : 1;
    for (let k = 0; k <= totalKm; k += step) ticks.push(k);
    return ticks;
  }, [totalKm]);

  // Segments bar data — inverted: displayPace est l'inverse de l'allure pour que
  // les barres les plus hautes correspondent aux allures les plus rapides.
  const barData = useMemo((): SegmentBarDatum[] => {
    if (!segments.length) return [];
    const paceMax = Math.max(...segments.map((s) => s.avgPaceSec));
    return segments.map((s) => ({
      shortName: shortSegmentName(s),
      name: s.name,
      displayPace: paceMax + 40 - s.avgPaceSec,
      rawPace: s.avgPaceSec,
      hrBpm: s.avgHrBpm,
      distanceKm: s.distanceKm,
      durationSec: s.durationSec,
      kind: s.kind,
    }));
  }, [segments]);

  return (
    <Card>
      <CardHeader
        label="Analyse temporelle"
        action={
          <div className="flex items-center gap-3">
            {/* Segmented control Ligne / Segments */}
            <div className="flex rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-subtle) p-0.5">
              {(["line", "bars"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "rounded-[3px] px-2.5 py-0.5 text-2xs font-medium transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                    v === view
                      ? "bg-(--color-bg-elevated) text-(--color-accent)"
                      : "text-(--color-fg-muted) hover:text-(--color-fg)"
                  )}
                  style={v === view ? { boxShadow: "var(--shadow-sm)" } : undefined}
                  aria-pressed={v === view}
                >
                  {v === "line" ? "Ligne" : "Segments"}
                </button>
              ))}
            </div>

            {/* Series toggles — uniquement en mode ligne */}
            {view === "line" && (
              <div className="hidden items-center gap-3 sm:flex">
                {SERIES.map((s) => {
                  const isOff = hidden.has(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => toggle(s.key)}
                      className={cn(
                        "flex items-center gap-1.5 transition-opacity",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                        isOff ? "opacity-30" : "opacity-100"
                      )}
                      aria-pressed={!isOff}
                    >
                      <div className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
                      <span className="text-2xs text-(--color-fg-muted)">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        }
      />

      {/* Légende mobile — uniquement en mode ligne */}
      {view === "line" && (
        <div className="flex items-center justify-around border-b border-(--color-border) bg-(--color-bg-subtle) px-3 py-2 sm:hidden">
          {SERIES.map((s) => {
            const isOff = hidden.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggle(s.key)}
                className={cn(
                  "flex items-center gap-1.5 transition-opacity",
                  isOff ? "opacity-30" : "opacity-100"
                )}
                aria-pressed={!isOff}
              >
                <div className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                <span className="text-2xs text-(--color-fg-muted)">{s.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="px-2 py-3 sm:px-4 sm:py-4">
        {view === "line" ? (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart
              data={data}
              margin={{ top: 4, right: 36, bottom: 0, left: 36 }}
              onMouseMove={(s) => {
                const v = s?.activeLabel;
                if (v != null) setHoveredKm(typeof v === "number" ? v : Number(v));
              }}
              onMouseLeave={() => setHoveredKm(null)}
            >
              <XAxis
                dataKey="distKm"
                type="number"
                domain={[0, totalKm]}
                ticks={xTicks}
                tickFormatter={(v: number) => `${v}`}
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis
                yAxisId="pace"
                domain={[ranges.paceMax + 20, ranges.paceMin - 20]}
                tickFormatter={fmtPace}
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <YAxis
                yAxisId="hr"
                orientation="right"
                domain={[110, 185]}
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <YAxis yAxisId="elev" hide domain={[0, ranges.elevMax * 4]} />
              <YAxis yAxisId="cad"  hide domain={[ranges.cadMin - 10, ranges.cadMax + 30]} />

              <Tooltip content={<LineTooltip />} cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "2 2" }} />

              {hoveredKm != null && (
                <ReferenceLine
                  yAxisId="pace"
                  x={hoveredKm}
                  stroke="var(--color-fg-subtle)"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}

              {!hidden.has("elevM") && (
                <Area
                  yAxisId="elev"
                  type="monotone"
                  dataKey="elevM"
                  stroke="var(--color-fg-muted)"
                  strokeWidth={1}
                  fill="var(--color-fg-muted)"
                  fillOpacity={0.13}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              )}
              {!hidden.has("paceSecPerKm") && (
                <Area
                  yAxisId="pace"
                  type="monotone"
                  dataKey="paceSecPerKm"
                  stroke="var(--color-fg)"
                  strokeWidth={1.5}
                  fill="var(--color-fg)"
                  fillOpacity={0.07}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              )}
              {!hidden.has("hrBpm") && (
                <Line
                  yAxisId="hr"
                  type="monotone"
                  dataKey="hrBpm"
                  stroke="var(--color-danger)"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              )}
              {!hidden.has("cadenceSpm") && (
                <Line
                  yAxisId="cad"
                  type="monotone"
                  dataKey="cadenceSpm"
                  stroke="var(--color-chart-2)"
                  strokeWidth={1.25}
                  strokeDasharray="3 2"
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={barData}
              margin={{ top: 20, right: 8, bottom: 24, left: 8 }}
              barCategoryGap="20%"
            >
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis hide />
              <Tooltip
                content={<BarTooltip />}
                cursor={{ fill: "var(--color-bg-muted)", opacity: 0.6 }}
              />
              <Bar dataKey="displayPace" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {barData.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={KIND_FILL[entry.kind]}
                    fillOpacity={KIND_OPACITY[entry.kind]}
                  />
                ))}
                <LabelList
                  dataKey="rawPace"
                  position="top"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => fmtPace(Number(v))}
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--font-mono)",
                    fill: "var(--color-fg-muted)",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
