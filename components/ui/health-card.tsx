"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, LabelList, ReferenceLine,
} from "recharts";

function dayLetter(dayStr: string): string {
  const [d, m] = dayStr.split("/").map(Number);
  const year = new Date().getFullYear();
  return ["S","M","T","W","T","F","S"][new Date(year, m - 1, d).getDay()];
}

type Tone = "success" | "warning" | "danger" | "neutral";

interface AreaTrendPoint {
  day: string;
  value: number;
}

interface BatteryTrendPoint {
  day: string;
  sleep: number;  // valeur à l'endormissement
  wake: number;   // valeur au réveil
}

interface HealthCardProps {
  title: string;
  avgValue?: string;
  primaryValue?: string;
  primaryUnit?: string;
  primaryDelta?: string;
  primaryDeltaTone?: Tone;
  secondaryLabel?: string;
  secondaryValue?: string;
  secondaryDelta?: string;
  secondaryDeltaTone?: Tone;
  trend: AreaTrendPoint[] | BatteryTrendPoint[];
  chartType?: "area" | "bar" | "battery-bar";
  tooltipFormatter?: (v: number) => string;
  footer?: string;
  className?: string;
}

const toneFg: Record<Tone, string> = {
  success: "text-(--color-success)",
  warning: "text-(--color-warning)",
  danger:  "text-(--color-danger)",
  neutral: "text-(--color-fg-subtle)",
};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SparklineTooltip({ active, payload, formatter }: any) {
  if (!active || !payload?.length) return null;
  const raw = payload[0].value as number;
  const display = formatter ? formatter(raw) : raw;
  return (
    <div className="rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-elevated) px-2 py-1">
      <p className="font-mono text-xs tabular-nums text-(--color-fg)">{display}</p>
      <p className="text-2xs text-(--color-fg-subtle)">{payload[0]?.payload?.day}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BatteryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as BatteryTrendPoint & { gain: number };
  return (
    <div className="rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-elevated) px-2.5 py-1.5">
      <p className="font-mono text-xs tabular-nums text-(--color-fg)">
        {d.sleep} → {d.wake}
      </p>
      <p className="text-2xs text-(--color-fg-subtle)">{d.day}</p>
    </div>
  );
}

export function HealthCard({
  title,
  avgValue,
  primaryValue,
  primaryUnit,
  primaryDelta,
  primaryDeltaTone = "neutral",
  secondaryLabel,
  secondaryValue,
  secondaryDelta,
  secondaryDeltaTone = "neutral",
  trend,
  chartType = "area",
  tooltipFormatter,
  footer,
  className,
}: HealthCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const batteryData = chartType === "battery-bar"
    ? (trend as BatteryTrendPoint[]).map((d) => ({ ...d, gain: d.wake - d.sleep }))
    : [];
  const avgWake = batteryData.length
    ? Math.round(batteryData.reduce((sum, d) => sum + d.wake, 0) / batteryData.length)
    : 0;
  const areaTrend = chartType !== "battery-bar" ? (trend as AreaTrendPoint[]) : [];
  const avgArea = areaTrend.length
    ? areaTrend.reduce((sum, d) => sum + d.value, 0) / areaTrend.length
    : 0;

  return (
    <div className={cn(
      "flex flex-col rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) py-4 px-[18px]",
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted) mt-0.5">
          {title}
        </span>
        {avgValue && (
          <div className="text-right">
            <div className="font-mono text-sm font-medium tabular-nums text-(--color-fg)">{avgValue}</div>
            {primaryDelta && (
              <div className={cn("font-mono text-2xs tabular-nums", toneFg[primaryDeltaTone])}>
                {primaryDelta}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary metric */}
      {primaryValue && (
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-mono text-2xl font-medium tabular-nums leading-tight text-(--color-fg)">
            {primaryValue}
          </span>
          {primaryUnit && (
            <span className="text-base font-normal text-(--color-fg-muted)">{primaryUnit}</span>
          )}
        </div>
      )}

      {/* Secondary metric */}
      {(secondaryLabel || secondaryValue) && (
        <div className="mt-3 flex items-center justify-between border-t border-(--color-border) pt-3">
          {secondaryLabel && (
            <span className="text-xs text-(--color-fg-muted)">{secondaryLabel}</span>
          )}
          <div className="flex items-center gap-2">
            {secondaryValue && (
              <span className="font-mono text-sm tabular-nums text-(--color-fg)">{secondaryValue}</span>
            )}
            {secondaryDelta && (
              <span className={cn("font-mono text-xs tabular-nums", toneFg[secondaryDeltaTone])}>
                {secondaryDelta}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mt-auto pt-4">
        <div style={{ height: 140 }}>
          {mounted && <ResponsiveContainer width="100%" height={140}>
            {chartType === "battery-bar" ? (
              <BarChart data={batteryData} barCategoryGap="30%" margin={{ top: 16, right: 0, bottom: 4, left: 0 }}>
                <YAxis hide domain={[0, 100]} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
                  interval={0}
                  height={18}
                />
                <Tooltip content={<BatteryTooltip />} cursor={false} />
                <ReferenceLine
                  y={avgWake}
                  stroke="var(--color-border-strong)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                {/* Socle transparent — représente la valeur à l'endormissement */}
                <Bar dataKey="sleep" stackId="a" fill="transparent" isAnimationActive={false} />
                {/* Recharge nocturne — de sleep jusqu'à wake */}
                <Bar dataKey="gain" stackId="a" fill="var(--color-chart-1)" radius={[2, 2, 2, 2]} isAnimationActive={false}>
                  <LabelList
                    dataKey="wake"
                    position="top"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    content={({ x, y, width, value }: any) => (
                      <text
                        x={Number(x) + Number(width) / 2}
                        y={Number(y) - 3}
                        textAnchor="middle"
                        style={{
                          fill: "var(--color-fg-subtle)",
                          fontSize: "var(--text-2xs)",
                          fontFamily: "var(--font-mono)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {value}
                      </text>
                    )}
                  />
                </Bar>
              </BarChart>
            ) : chartType === "bar" ? (
              <BarChart data={trend as AreaTrendPoint[]} barCategoryGap="28%" margin={{ top: 8, right: 0, bottom: 4, left: 0 }}>
                <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
                  interval={0}
                  height={18}
                />
                <ReferenceLine
                  y={avgArea}
                  stroke="var(--color-border-strong)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                <Tooltip
                  content={<SparklineTooltip formatter={tooltipFormatter} />}
                  cursor={false}
                />
                <Bar dataKey="value" fill="var(--color-chart-1)" radius={[2, 2, 2, 2]} isAnimationActive={false}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    content={({ x, y, width, value }: any) => (
                      <text
                        x={Number(x) + Number(width) / 2}
                        y={Number(y) - 3}
                        textAnchor="middle"
                        style={{
                          fill: "var(--color-fg-subtle)",
                          fontSize: "9px",
                          fontFamily: "var(--font-mono)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {tooltipFormatter ? tooltipFormatter(value) : value}
                      </text>
                    )}
                  />
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={trend as AreaTrendPoint[]} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
                <ReferenceLine
                  y={avgArea}
                  stroke="var(--color-border-strong)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                <Tooltip
                  content={<SparklineTooltip formatter={tooltipFormatter} />}
                  cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1, strokeDasharray: "3 3" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-chart-1)"
                  strokeWidth={1.5}
                  fill="var(--color-chart-1)"
                  fillOpacity={0.06}
                  dot={false}
                  activeDot={{
                    r: 3,
                    fill: "var(--color-chart-1)",
                    stroke: "var(--color-bg-elevated)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>}
        </div>
        {footer && (
          <p className="mt-2 text-2xs text-(--color-fg-subtle)">{footer}</p>
        )}
      </div>
    </div>
  );
}
