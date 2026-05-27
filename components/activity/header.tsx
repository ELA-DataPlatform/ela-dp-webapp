"use client";

import Link from "next/link";
import { ArrowLeft, Footprints, Bike, PersonStanding } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityDetail } from "./mock-data";

const TYPE_ICON = { run: Footprints, trail: Footprints, bike: Bike } as const;

export function ActivityHeader({ activity }: { activity: ActivityDetail }) {
  const Icon = TYPE_ICON[activity.type] ?? PersonStanding;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-(--color-border) bg-(--color-bg)/95 px-4 py-3 backdrop-blur sm:px-5">
      <Link
        href="/activities"
        aria-label="Retour aux activités"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-sm)",
          "text-(--color-fg-subtle) transition-colors hover:bg-(--color-bg-muted) hover:text-(--color-fg)",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
        )}
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
      </Link>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold tracking-[-0.02em] text-(--color-fg)">
          {activity.title}
        </h1>
        <p className="truncate text-xs text-(--color-fg-subtle)">
          {activity.dateDisplay}
          <span className="hidden sm:inline">
            {" · "}départ <span className="font-mono tabular-nums">{activity.startTimeLocal}</span>
          </span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-bg-elevated) px-2.5 py-1">
        <Icon className="h-3 w-3 text-(--color-fg-subtle)" strokeWidth={1.5} />
        <span className="text-xs font-medium text-(--color-fg-muted)">{activity.typeLabel}</span>
      </div>
    </header>
  );
}
