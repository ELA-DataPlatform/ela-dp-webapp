"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartContent } from "./mock-data";

function fmtPace(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}'${String(s).padStart(2, "0")}"`;
}

function getFormatter(type?: string): ((v: number) => string) | undefined {
  if (type === "pace") return fmtPace;
  if (type === "percent") return (v: number) => `${v}%`;
  return undefined;
}

const AXIS_TICK = {
  fill: "var(--color-fg-subtle)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
};

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "var(--color-bg-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: "4px",
  padding: "8px 12px",
  boxShadow: "var(--shadow-md)",
};

const TOOLTIP_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  color: "var(--color-fg-subtle)",
  marginBottom: "4px",
};

const TOOLTIP_VALUE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--color-fg)",
  fontVariantNumeric: "tabular-nums",
};

export function ChartBlock({ block }: { block: ChartContent }) {
  const formatter = getFormatter(block.yFormatter);
  const height = block.height ?? 200;
  const yWidth = block.yFormatter ? 44 : 30;

  const axisProps = {
    tick: AXIS_TICK,
    axisLine: { stroke: "var(--color-border)" },
    tickLine: false as const,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={TOOLTIP_STYLE}>
        <p style={TOOLTIP_LABEL_STYLE}>{label}</p>
        {payload.map((entry: { dataKey: string; value: number }) => (
          <p key={entry.dataKey} style={TOOLTIP_VALUE_STYLE}>
            {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "6px",
        background: "var(--color-bg-elevated)",
        padding: "16px 16px 12px",
      }}
    >
      {/* Eyebrow */}
      <div style={{ marginBottom: "12px" }}>
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "11px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-fg-muted)",
          }}
        >
          {block.title}
        </span>
        {block.subtitle && (
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "11px",
              color: "var(--color-fg-subtle)",
              marginLeft: "8px",
            }}
          >
            {block.subtitle}
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {block.chartType === "bar" ? (
          <BarChart
            data={block.data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <XAxis dataKey={block.xKey} {...axisProps} />
            <YAxis
              {...axisProps}
              axisLine={false}
              tickFormatter={formatter}
              width={yWidth}
            />
            <Tooltip content={tooltipContent} cursor={{ fill: "var(--color-bg-muted)" }} />
            {block.series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={s.color}
                radius={[2, 2, 0, 0]}
                maxBarSize={36}
              />
            ))}
          </BarChart>
        ) : (
          <LineChart
            data={block.data}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <XAxis dataKey={block.xKey} {...axisProps} />
            <YAxis
              {...axisProps}
              axisLine={false}
              tickFormatter={formatter}
              reversed={block.reversed}
              width={yWidth}
              domain={block.reversed ? ["dataMin - 8", "dataMax + 8"] : undefined}
            />
            <Tooltip content={tooltipContent} cursor={{ stroke: "var(--color-border)" }} />
            {block.series.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={1.5}
                dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
