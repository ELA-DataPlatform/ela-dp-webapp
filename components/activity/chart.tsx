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
} from "recharts";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./card";
import { useActivityFocus } from "./focus-context";
import { fmtPace } from "./utils";
import type { ChartPoint } from "./mock-data";

const SERIES = [
  { key: "paceSecPerKm", label: "Allure",  color: "var(--color-fg)",        defaultOn: true,  axis: "pace"  },
  { key: "hrBpm",        label: "FC",      color: "var(--color-danger)",    defaultOn: true,  axis: "hr"    },
  { key: "elevM",        label: "Alt.",    color: "var(--color-fg-muted)",  defaultOn: true,  axis: "elev"  },
  { key: "cadenceSpm",   label: "Cadence", color: "var(--color-chart-2)",   defaultOn: false, axis: "cad"   },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

function ChartTooltip({
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

export function ActivityChart({ data, totalKm }: { data: ChartPoint[]; totalKm: number }) {
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

  return (
    <Card>
      <CardHeader
        label="Analyse temporelle"
        action={
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
        }
      />

      {/* Mobile legend (toggleable too) */}
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

      <div className="px-2 py-3 sm:px-4 sm:py-4">
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

            <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border-strong)", strokeDasharray: "2 2" }} />

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
      </div>
    </Card>
  );
}
