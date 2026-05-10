"use client";

import { useMemo } from "react";

interface GoalCardProps {
  name: string;
  distance: string;
  elevation: string;
  date: string;       // ISO YYYY-MM-DD — jour de la course
  dateLabel: string;  // ex. "31 mai 2026"
  prepStart: string;  // ISO YYYY-MM-DD — début de la prépa
}

export function GoalCard({ name, distance, elevation, date, dateLabel, prepStart }: GoalCardProps) {
  const { daysLeft, currentWeek, totalWeeks, pct } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const raceDate = new Date(date);
    raceDate.setHours(0, 0, 0, 0);

    const startDate = new Date(prepStart);
    startDate.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;

    const daysLeft = Math.ceil((raceDate.getTime() - now.getTime()) / msPerDay);
    const totalDays = Math.ceil((raceDate.getTime() - startDate.getTime()) / msPerDay);
    const elapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / msPerDay));

    const totalWeeks = Math.ceil(totalDays / 7);
    const currentWeek = Math.min(Math.ceil(elapsed / 7), totalWeeks);
    const pct = Math.round((elapsed / totalDays) * 100);

    return { daysLeft, currentWeek, totalWeeks, pct };
  }, [date, prepStart]);

  return (
    <div className="flex h-full flex-col justify-between rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) py-4 px-[18px]">
      {/* Eyebrow */}
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {name}
      </span>

      {/* Countdown */}
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[2.5rem] font-semibold tabular-nums leading-none text-(--color-fg)">
          {daysLeft}
        </span>
        <span className="text-sm text-(--color-fg-muted)">jours</span>
      </div>

      {/* Race info */}
      <p className="font-mono text-xs tabular-nums text-(--color-fg-muted)">
        {dateLabel} · {distance} · {elevation}
      </p>

      {/* Progress */}
      <div>
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-(--color-border)">
          <div
            className="h-full rounded-full bg-(--color-fg)"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-xs tabular-nums text-(--color-fg-subtle)">
            Plan · sem. {currentWeek}/{totalWeeks}
          </span>
          <span className="font-mono text-xs tabular-nums text-(--color-fg-subtle)">
            {pct} %
          </span>
        </div>
      </div>
    </div>
  );
}
