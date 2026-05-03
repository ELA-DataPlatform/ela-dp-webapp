"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine,
} from "recharts";

function dayLetter(dayStr: string): string {
  const [d, m] = dayStr.split("/").map(Number);
  const year = new Date().getFullYear();
  return ["S","M","T","W","T","F","S"][new Date(year, m - 1, d).getDay()];
}

type Tone = "success" | "warning" | "danger" | "neutral";

const toneFg: Record<Tone, string> = {
  success: "text-(--color-success)",
  warning: "text-(--color-warning)",
  danger:  "text-(--color-danger)",
  neutral: "text-(--color-fg-subtle)",
};

// ─── MusicListeningCard ────────────────────────────────────────────────────

interface ListeningPoint {
  day: string;
  value: number; // minutes
}

interface MusicListeningCardProps {
  trend: ListeningPoint[];
  totalTime: string;
  delta?: string;
  deltaTone?: Tone;
  footer?: string;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ListeningTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const mins = payload[0].value as number;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <div className="rounded-[--radius-sm] border border-(--color-border) bg-(--color-bg-elevated) px-2 py-1">
      <p className="font-mono text-xs tabular-nums text-(--color-fg)">
        {h > 0 ? `${h}h ${m}min` : `${m}min`}
      </p>
      <p className="text-2xs text-(--color-fg-subtle)">{payload[0]?.payload?.day}</p>
    </div>
  );
}

export function MusicListeningCard({
  trend,
  totalTime,
  delta,
  deltaTone = "neutral",
  footer,
  className,
}: MusicListeningCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const avg = trend.length
    ? Math.round(trend.reduce((s, d) => s + d.value, 0) / trend.length)
    : 0;

  return (
    <div className={cn(
      "flex flex-col rounded-[--radius-md] border border-(--color-border) bg-(--color-bg-elevated) p-5",
      className
    )}>
      <div className="flex items-start justify-between">
        <span className="mt-0.5 text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          Écoutes
        </span>
        <div className="text-right">
          <div className="font-mono text-sm font-medium tabular-nums text-(--color-fg)">{totalTime}</div>
          {delta && (
            <div className={cn("font-mono text-2xs tabular-nums", toneFg[deltaTone])}>{delta}</div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div style={{ height: 140 }}>
          {mounted && <ResponsiveContainer width="100%" height={140}>
            <BarChart data={trend} barCategoryGap="20%" margin={{ top: 8, right: 0, bottom: 4, left: 0 }}>
              <YAxis hide domain={[0, "dataMax + 10"]} />
              <XAxis
                dataKey="day"
                tickFormatter={dayLetter}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
                interval={0}
                height={18}
              />
              <ReferenceLine
                y={avg}
                stroke="var(--color-border-strong)"
                strokeWidth={1}
                strokeDasharray="3 4"
              />
              <Tooltip content={<ListeningTooltip />} cursor={false} />
              <Bar
                dataKey="value"
                fill="var(--color-chart-1)"
                radius={[2, 2, 2, 2]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>}
        </div>
        {footer && <p className="mt-2 text-2xs text-(--color-fg-subtle)">{footer}</p>}
      </div>
    </div>
  );
}

// ─── MusicRankingCard ──────────────────────────────────────────────────────

// positive = gained N places, negative = lost N places, 0 = unchanged, "new" = new entry
type RankChange = number | "new";

interface RankingItem {
  name: string;
  subtitle?: string;
  time: string;
  image?: string;
  rankChange?: RankChange;
}

function RankIndicator({ change }: { change: RankChange }) {
  if (change === "new") {
    return (
      <span className="font-mono text-[9px] font-medium uppercase tracking-wide text-(--color-success)">
        NEW
      </span>
    );
  }
  if (change > 0) {
    return (
      <span className="flex items-center gap-px font-mono text-[10px] tabular-nums text-(--color-success)">
        <ArrowUp size={10} strokeWidth={2} />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-px font-mono text-[10px] tabular-nums text-(--color-danger)">
        <ArrowDown size={10} strokeWidth={2} />
        {Math.abs(change)}
      </span>
    );
  }
  return <span className="font-mono text-[10px] text-(--color-fg-subtle)">=</span>;
}

interface MusicRankingCardProps {
  title: string;
  items: RankingItem[];
  footer?: string;
  viewMoreHref?: string;
  className?: string;
}

export function MusicRankingCard({
  title,
  items,
  footer,
  viewMoreHref,
  className,
}: MusicRankingCardProps) {
  return (
    <div className={cn(
      "flex flex-col overflow-hidden rounded-[--radius-md] border border-(--color-border) bg-(--color-bg-elevated) p-5",
      className
    )}>
      <span className="shrink-0 text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {title}
      </span>

      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
        {items.map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 py-1.5",
              i < items.length - 1 && "border-b border-(--color-border)"
            )}
          >
            <span className="w-3.5 shrink-0 font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
              {i + 1}
            </span>
            {item.rankChange !== undefined && (
              <div className="w-6 shrink-0 flex justify-center">
                <RankIndicator change={item.rankChange} />
              </div>
            )}
            {item.image && (
              <img
                src={item.image}
                alt=""
                className="h-5 w-5 shrink-0 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-(--color-fg)">{item.name}</div>
              {item.subtitle && (
                <div className="truncate text-xs text-(--color-fg-subtle)">{item.subtitle}</div>
              )}
            </div>
            <span className="shrink-0 font-mono text-xs tabular-nums text-(--color-fg-muted)">
              {item.time}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between pt-1">
        {footer
          ? <p className="text-2xs text-(--color-fg-subtle)">{footer}</p>
          : <span />
        }
        {viewMoreHref && (
          <a
            href={viewMoreHref}
            className="inline-flex items-center rounded-full border border-(--color-border) bg-(--color-bg-subtle) px-2 py-0.5 text-[10px] font-medium text-(--color-fg-disabled) transition-colors hover:border-(--color-border-strong) hover:text-(--color-fg-subtle) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
          >
            Voir plus
          </a>
        )}
      </div>
    </div>
  );
}

// ─── MusicTopTrackCard ─────────────────────────────────────────────────────

interface MusicTopTrackCardProps {
  title: string;
  artist: string;
  plays: number;
  totalTime: string;
  footer?: string;
  viewMoreHref?: string;
  className?: string;
}

export function MusicTopTrackCard({
  title,
  artist,
  plays,
  totalTime,
  footer,
  viewMoreHref,
  className,
}: MusicTopTrackCardProps) {
  return (
    <div className={cn(
      "flex flex-col rounded-[--radius-md] border border-(--color-border) bg-(--color-bg-elevated) p-5",
      className
    )}>
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        Top Titre
      </span>

      <div className="flex-1" />

      <div>
        <div className="line-clamp-2 text-lg font-semibold leading-tight tracking-[-0.02em] text-(--color-fg)">
          {title}
        </div>
        <div className="mt-1 text-sm text-(--color-fg-muted)">{artist}</div>

        <div className="mt-4 flex items-start gap-6 border-t border-(--color-border) pt-3">
          <div>
            <div className="text-2xs font-medium uppercase tracking-[0.04em] text-(--color-fg-subtle)">
              Écoutes
            </div>
            <div className="font-mono text-sm font-medium tabular-nums text-(--color-fg)">{plays}</div>
          </div>
          <div>
            <div className="text-2xs font-medium uppercase tracking-[0.04em] text-(--color-fg-subtle)">
              Durée tot.
            </div>
            <div className="font-mono text-sm font-medium tabular-nums text-(--color-fg)">{totalTime}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {footer
          ? <p className="text-2xs text-(--color-fg-subtle)">{footer}</p>
          : <span />
        }
        {viewMoreHref && (
          <a
            href={viewMoreHref}
            className="inline-flex items-center rounded-full border border-(--color-border) bg-(--color-bg-subtle) px-2 py-0.5 text-[10px] font-medium text-(--color-fg-disabled) transition-colors hover:border-(--color-border-strong) hover:text-(--color-fg-subtle) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
          >
            Voir plus
          </a>
        )}
      </div>
    </div>
  );
}
