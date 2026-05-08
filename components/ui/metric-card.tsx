"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area,
  BarChart, Bar, Cell, XAxis,
  YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataPoint {
  day: string;
  letter?: string;
  value: number;
}

interface MetricCardProps {
  title: string;
  subtitle?: string;
  footer?: string;
  data: DataPoint[];
  unit?: string;
  currentValue: number;
  previousValue: number;
  chartType?: "area" | "bar";
  deltaMode?: "absolute" | "percent";
  currentWeekStartIndex?: number;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  const raw = payload[0].value as number;
  if (raw === 0) return null;
  const dateLabel = payload[0]?.payload?.day ?? label;
  const formatted = Number.isInteger(raw) ? raw : raw.toFixed(1);
  return (
    <div className="rounded-[--radius-sm] border border-(--color-border) bg-(--color-bg-elevated) px-2.5 py-1.5">
      <p className="font-mono text-xs tabular-nums text-(--color-fg)">
        {formatted}
        {unit && <span className="ml-0.5 text-(--color-fg-muted)">{unit}</span>}
      </p>
      <p className="mt-0.5 text-2xs text-(--color-fg-subtle)">{dateLabel}</p>
    </div>
  );
}

export function MetricCard({
  title,
  subtitle,
  footer,
  data,
  unit = "",
  currentValue,
  previousValue,
  chartType = "area",
  deltaMode = "absolute",
  currentWeekStartIndex = 7,
  className,
}: MetricCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rawDelta = currentValue - previousValue;
  const isPositive = rawDelta >= 0;

  const deltaDisplay =
    deltaMode === "percent"
      ? `${isPositive ? "+" : ""}${Math.round((rawDelta / previousValue) * 100)}%`
      : `${isPositive ? "+" : ""}${Math.round(rawDelta * 10) / 10}`;

  return (
    <div className={cn("flex h-full flex-col rounded-[--radius-md] border border-(--color-border) bg-(--color-bg-elevated) p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-(--color-fg-subtle)">{subtitle}</span>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div className="font-mono text-2xl font-medium tabular-nums leading-tight text-(--color-fg)">
            {currentValue}
            <span className="ml-1 font-sans text-base font-normal text-(--color-fg-muted)">
              {unit}
            </span>
          </div>
          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-1 font-mono text-2xs tabular-nums",
              isPositive ? "text-(--color-success)" : "text-(--color-danger)"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            ) : (
              <TrendingDown className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            )}
            <span>{deltaDisplay}</span>
          </div>
        </div>
      </div>

      <div className="mt-4" style={{ height: 100 }}>
        {mounted && <ResponsiveContainer width="100%" height={100}>
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap="30%">
              <YAxis hide domain={[0, "dataMax + 2"]} />
              <XAxis
                dataKey="day"
                interval={0}
                tickLine={false}
                axisLine={false}
                height={20}
                tick={{ fontSize: 10, fill: "var(--color-fg-subtle)", fontFamily: "var(--font-mono)" }}
              />
              <Tooltip
                content={(props) => <ChartTooltip {...props} unit={unit} />}
                cursor={{ fill: "var(--color-bg-muted)", radius: 2 }}
              />
              <Bar dataKey="value" radius={[2, 2, 2, 2]}>
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={
                      i < currentWeekStartIndex
                        ? "var(--color-chart-4)"
                        : "var(--color-chart-1)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip
                content={(props) => <ChartTooltip {...props} unit={unit} />}
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
                  r: 4,
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
        <p className="mt-3 border-t border-(--color-border) pt-3 text-2xs text-(--color-fg-subtle)">
          {footer}
        </p>
      )}
    </div>
  );
}
