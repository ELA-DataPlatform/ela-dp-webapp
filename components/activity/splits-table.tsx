"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader } from "./card";
import { useActivityFocus } from "./focus-context";
import { fmtPace, fmtHmsCompact } from "./utils";
import type { Lap, Segment, SegmentKind, ActivityDetail } from "./mock-data";

type Tab = "km" | "lap";

const SEGMENT_DOT: Record<SegmentKind, string> = {
  warmup:   "bg-(--color-fg-disabled)",
  interval: "bg-(--color-fg)",
  recovery: "bg-(--color-fg-subtle)",
  cooldown: "bg-(--color-fg-disabled)",
};

function Tabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { value: Tab; label: string }[] = [
    { value: "km",  label: "Km" },
    { value: "lap", label: "Seg." },
  ];
  return (
    <div role="tablist" className="flex items-center gap-1">
      {tabs.map((t) => {
        const isActive = active === t.value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.value)}
            className={cn(
              "inline-flex h-6 items-center rounded-full border px-2.5 text-2xs font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
              isActive
                ? "border-(--color-accent) bg-(--color-accent-bg) text-(--color-accent)"
                : "border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg) hover:border-(--color-border-strong) hover:bg-(--color-bg-muted)"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function ElevationGain({ value }: { value: number }) {
  const Icon = value > 0 ? ChevronUp : value < 0 ? ChevronDown : Minus;
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Icon className="h-3 w-3 shrink-0 text-(--color-fg-subtle)" strokeWidth={1.5} />
      <span className="font-mono text-xs tabular-nums text-(--color-fg-subtle)">
        {Math.abs(value)}
      </span>
    </div>
  );
}

function KmSplits({ laps, hrMax }: { laps: Lap[]; hrMax: number }) {
  const { hoveredKm, setHoveredKm } = useActivityFocus();
  const hoveredLapKm =
    hoveredKm == null ? null : Math.max(1, Math.min(laps.length, Math.round(hoveredKm)));

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid shrink-0 grid-cols-[2.5rem_1fr_3rem_2.5rem] gap-3 border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2 sm:grid-cols-[2.5rem_1fr_3.5rem_4rem_3rem_3rem] sm:px-5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">Km</span>
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">Allure</span>
        <span className="hidden text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted) sm:block">GAP</span>
        <span className="text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">FC</span>
        <span className="hidden text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted) sm:block">Cad.</span>
        <span className="text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">D+</span>
      </div>

      <div className="flex-1 divide-y divide-(--color-border) overflow-y-auto">
        {laps.map((lap) => {
          const isHovered = hoveredLapKm === lap.km;
          const hrPct = Math.round((lap.hrBpm / hrMax) * 100);
          return (
            <div
              key={lap.km}
              onMouseEnter={() => setHoveredKm(lap.km - 0.5)}
              onMouseLeave={() => setHoveredKm(null)}
              className={cn(
                "grid min-h-[3.5rem] cursor-default grid-cols-[2.5rem_1fr_3rem_2.5rem] items-center gap-3 px-4 sm:grid-cols-[2.5rem_1fr_3.5rem_4rem_3rem_3rem] sm:px-5",
                "transition-colors",
                isHovered ? "bg-(--color-bg-muted)" : "hover:bg-(--color-bg-muted)"
              )}
            >
              <span className="font-mono text-xs font-medium tabular-nums text-(--color-fg-subtle)">
                {lap.km}
              </span>
              <span className="font-mono text-xs tabular-nums text-(--color-fg)">
                {fmtPace(lap.paceSecPerKm)}
              </span>
              <span className="hidden text-right font-mono text-xs tabular-nums text-(--color-fg-subtle) sm:block">
                {fmtPace(lap.gapSecPerKm)}
              </span>
              <div className="text-right">
                <span className="font-mono text-xs tabular-nums text-(--color-fg)">{lap.hrBpm}</span>
                <span className="ml-0.5 font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                  · {hrPct}%
                </span>
              </div>
              <span className="hidden text-right font-mono text-xs tabular-nums text-(--color-fg-subtle) sm:block">
                {lap.cadenceSpm}
              </span>
              <ElevationGain value={lap.elevGainM} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SegmentSplits({ segments, hrMax }: { segments: Segment[]; hrMax: number }) {
  const { hoveredKm, setHoveredKm } = useActivityFocus();
  const hoveredSegmentId =
    hoveredKm == null
      ? null
      : segments.find((s) => hoveredKm >= s.startKm && hoveredKm < s.endKm)?.id ?? null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid shrink-0 grid-cols-[1fr_3.5rem_3rem_2.5rem] gap-3 border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2 sm:grid-cols-[1.5fr_3rem_3.5rem_3.5rem_4rem_3rem] sm:px-5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">Segment</span>
        <span className="hidden text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted) sm:block">Dist.</span>
        <span className="text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">Durée</span>
        <span className="text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">Allure</span>
        <span className="text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">FC</span>
        <span className="hidden text-right text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted) sm:block">Cad.</span>
      </div>

      <div className="flex-1 divide-y divide-(--color-border) overflow-y-auto">
        {segments.map((seg) => {
          const isHovered = hoveredSegmentId === seg.id;
          const hrPct = Math.round((seg.avgHrBpm / hrMax) * 100);
          const mid = (seg.startKm + seg.endKm) / 2;
          return (
            <div
              key={seg.id}
              onMouseEnter={() => setHoveredKm(mid)}
              onMouseLeave={() => setHoveredKm(null)}
              className={cn(
                "grid min-h-[3.5rem] cursor-default grid-cols-[1fr_3.5rem_3rem_2.5rem] items-center gap-3 px-4 sm:grid-cols-[1.5fr_3rem_3.5rem_3.5rem_4rem_3rem] sm:px-5",
                "transition-colors",
                isHovered ? "bg-(--color-bg-muted)" : "hover:bg-(--color-bg-muted)"
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className={cn("h-2 w-2 shrink-0 rounded-full", SEGMENT_DOT[seg.kind])} />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-(--color-fg)">{seg.name}</div>
                  <div className="font-mono text-2xs tabular-nums text-(--color-fg-subtle) sm:hidden">
                    {seg.distanceKm.toFixed(1)} km · {seg.avgCadenceSpm} spm
                  </div>
                </div>
              </div>
              <span className="hidden text-right font-mono text-xs tabular-nums text-(--color-fg) sm:block">
                {seg.distanceKm.toFixed(1)}
                <span className="ml-0.5 text-2xs text-(--color-fg-subtle)">km</span>
              </span>
              <span className="text-right font-mono text-xs tabular-nums text-(--color-fg-subtle)">
                {fmtHmsCompact(seg.durationSec)}
              </span>
              <span className="text-right font-mono text-xs tabular-nums text-(--color-fg)">
                {fmtPace(seg.avgPaceSec)}
              </span>
              <div className="text-right">
                <span className="font-mono text-xs tabular-nums text-(--color-fg)">{seg.avgHrBpm}</span>
                <span className="ml-0.5 font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                  · {hrPct}%
                </span>
              </div>
              <span className="hidden text-right font-mono text-xs tabular-nums text-(--color-fg-subtle) sm:block">
                {seg.avgCadenceSpm}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SplitsTable({ activity }: { activity: ActivityDetail }) {
  const [tab, setTab] = useState<Tab>("km");

  return (
    <Card className="flex h-full flex-col">
      <CardHeader label="Splits" action={<Tabs active={tab} onChange={setTab} />} />
      {tab === "km" ? (
        <KmSplits laps={activity.laps} hrMax={activity.hrMax} />
      ) : (
        <SegmentSplits segments={activity.segments} hrMax={activity.hrMax} />
      )}
    </Card>
  );
}
