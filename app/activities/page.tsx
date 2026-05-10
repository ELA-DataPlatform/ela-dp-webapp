"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, Timer, Footprints, Bike, PersonStanding, Dumbbell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { LucideIcon } from "lucide-react";

/* ── API types ──────────────────────────────────────────── */

interface ApiActivity {
  activity_id: string;
  activity_name: string;
  activity_type: string;
  activity_date: string;
  start_time_local: string;
  distance_km: number;
  duration_seconds: number;
  duration_label: string;
  avg_speed_km_h: number;
  pace_label: string;
  elevation_gain_m: number;
  avg_hr_bpm: number;
}

/* ── Internal types ─────────────────────────────────────── */

type ActivityCategory = "run" | "bike" | "walk" | "other";
type TypeFilter = "all" | ActivityCategory;
type SortField = "date" | "distance" | "duration" | "elevation" | "pace";
type SortDir = "asc" | "desc";

interface Activity {
  id: string;
  category: ActivityCategory;
  title: string;
  dateDisplay: string;
  dateTs: number;
  distanceKm: number;
  durationSec: number;
  durationLabel: string;
  elevationM: number;
  paceSecPerKm: number;
  paceLabel: string;
  avgHrBpm: number;
}

/* ── API → internal mapping ─────────────────────────────── */

const RUN_TYPES  = new Set(["running", "trail_running", "track_running", "treadmill_running", "multi_sport"]);
const BIKE_TYPES = new Set(["cycling", "indoor_cycling"]);
const WALK_TYPES = new Set(["walking", "hiking"]);

function toCategory(apiType: string): ActivityCategory {
  if (RUN_TYPES.has(apiType))  return "run";
  if (BIKE_TYPES.has(apiType)) return "bike";
  if (WALK_TYPES.has(apiType)) return "walk";
  return "other";
}

function mapActivity(a: ApiActivity): Activity {
  const dateTs = new Date(a.activity_date + "T12:00:00").getTime();
  const dateDisplay = new Date(a.activity_date + "T12:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
  return {
    id: a.activity_id,
    category: toCategory(a.activity_type),
    title: a.activity_name,
    dateDisplay,
    dateTs,
    distanceKm: a.distance_km,
    durationSec: a.duration_seconds,
    durationLabel: a.duration_label,
    elevationM: a.elevation_gain_m,
    paceSecPerKm: a.distance_km > 0 ? a.duration_seconds / a.distance_km : 0,
    paceLabel: a.pace_label,
    avgHrBpm: a.avg_hr_bpm,
  };
}

/* ── Sort logic ─────────────────────────────────────────── */

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "date",      label: "Date"      },
  { field: "distance",  label: "Distance"  },
  { field: "duration",  label: "Durée"     },
  { field: "elevation", label: "Dénivelé"  },
  { field: "pace",      label: "Allure"    },
];

function sortValue(a: Activity, field: SortField): number {
  switch (field) {
    case "date":      return a.dateTs;
    case "distance":  return a.distanceKm;
    case "duration":  return a.durationSec;
    case "elevation": return a.elevationM;
    case "pace":      return a.paceSecPerKm;
  }
}

/* ── Month grouping (when sorted by date) ───────────────── */

function groupByMonth(list: Activity[]) {
  const map = new Map<string, Activity[]>();
  for (const a of list) {
    const label = new Date(a.dateTs).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const key = label.charAt(0).toUpperCase() + label.slice(1);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries()).map(([month, activities]) => ({ month, activities }));
}

/* ── Category meta ──────────────────────────────────────── */

const CATEGORY_META: Record<ActivityCategory, { icon: LucideIcon; filterLabel: string }> = {
  run:   { icon: Footprints,     filterLabel: "Course" },
  bike:  { icon: Bike,           filterLabel: "Vélo"   },
  walk:  { icon: PersonStanding, filterLabel: "Marche" },
  other: { icon: Dumbbell,       filterLabel: "Autre"  },
};

/* ── Sub-components ─────────────────────────────────────── */

function Pill({
  active,
  count,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  count?: number;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-3",
        "text-xs font-medium transition-colors duration-[--duration-base]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
        active
          ? "border-(--color-accent) bg-(--color-accent-bg) text-(--color-accent)"
          : "border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg) hover:border-(--color-border-strong) hover:bg-(--color-bg-muted)",
        className
      )}
    >
      {children}
      {count !== undefined && (
        <span className="font-mono text-[11px] tabular-nums opacity-70">{count}</span>
      )}
    </button>
  );
}

function NumericInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-7 w-[4.5rem] rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-elevated) px-2 font-mono text-xs tabular-nums text-(--color-fg) placeholder:text-(--color-fg-subtle) focus:border-(--color-accent) focus:outline-none transition-colors"
    />
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-(--color-border) px-4 py-3">
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-(--color-bg-muted)" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3 w-48 animate-pulse rounded bg-(--color-bg-muted)" />
        <div className="h-2.5 w-32 animate-pulse rounded bg-(--color-bg-muted)" />
      </div>
      <div className="shrink-0 space-y-1.5 text-right">
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-(--color-bg-muted)" />
        <div className="ml-auto h-2.5 w-12 animate-pulse rounded bg-(--color-bg-muted)" />
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const { icon: Icon } = CATEGORY_META[activity.category];
  const showDistance = activity.distanceKm > 0;
  const elev = activity.elevationM > 0 ? `+${activity.elevationM} m` : null;

  return (
    <Link
      href={`/activities/${activity.id}`}
      className="flex w-full items-center gap-3 border-b border-(--color-border) px-4 py-3 text-left transition-colors hover:bg-(--color-bg-muted)"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-bg-muted) text-(--color-fg)">
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-(--color-fg)">{activity.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-(--color-fg-subtle)">
          <span className="font-mono tabular-nums">{activity.dateDisplay}</span>
          {showDistance && (
            <>
              <span>·</span>
              <span className="font-mono tabular-nums">{activity.distanceKm.toFixed(1)} km</span>
              <span>·</span>
              <span className="font-mono tabular-nums">{activity.paceLabel}</span>
            </>
          )}
          {elev && (
            <>
              <span>·</span>
              <span className="font-mono tabular-nums">{elev}</span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="flex items-center gap-1 font-mono text-sm font-medium tabular-nums text-(--color-fg)">
          <Timer className="h-3 w-3 text-(--color-fg-subtle)" strokeWidth={1.5} />
          {activity.durationLabel}
        </div>
        {activity.avgHrBpm > 0 && (
          <div className="mt-0.5 font-mono text-xs tabular-nums text-(--color-fg-subtle)">
            {activity.avgHrBpm} bpm
          </div>
        )}
      </div>
    </Link>
  );
}

function MonthHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 pb-2 pt-3">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {label}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
        {count} séance{count > 1 ? "s" : ""}
      </span>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading]       = useState(true);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy]         = useState<SortField>("date");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");
  const [minDist, setMinDist]       = useState("");
  const [maxDist, setMaxDist]       = useState("");
  const [minDur,  setMinDur]        = useState("");
  const [maxDur,  setMaxDur]        = useState("");

  const hasNumericFilter = minDist !== "" || maxDist !== "" || minDur !== "" || maxDur !== "";

  useEffect(() => {
    apiFetch("/webapp/activities")
      .then((r) => r.json())
      .then((data: ApiActivity[]) => setActivities(data.map(mapActivity)))
      .finally(() => setLoading(false));
  }, []);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "pace" ? "asc" : "desc");
    }
  }

  function clearNumericFilters() {
    setMinDist(""); setMaxDist(""); setMinDur(""); setMaxDur("");
  }

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (typeFilter !== "all" && a.category !== typeFilter) return false;
      if (minDist !== "" && a.distanceKm < parseFloat(minDist))         return false;
      if (maxDist !== "" && a.distanceKm > parseFloat(maxDist))         return false;
      if (minDur  !== "" && a.durationSec < parseFloat(minDur)  * 3600) return false;
      if (maxDur  !== "" && a.durationSec > parseFloat(maxDur)  * 3600) return false;
      return true;
    });
  }, [activities, typeFilter, minDist, maxDist, minDur, maxDur]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const diff = sortValue(a, sortBy) - sortValue(b, sortBy);
      return sortDir === "asc" ? diff : -diff;
    });
  }, [filtered, sortBy, sortDir]);

  const groups = useMemo(
    () => (sortBy === "date" ? groupByMonth(sorted) : [{ month: "", activities: sorted }]),
    [sorted, sortBy]
  );

  const countFor = (f: TypeFilter) =>
    f === "all" ? activities.length : activities.filter((a) => a.category === f).length;

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-(--color-border) px-6 py-5">
        <h1 className="text-lg font-semibold tracking-[-0.02em] text-(--color-fg)">Activités</h1>
        <p className="mt-0.5 text-sm text-(--color-fg-subtle)">
          {loading ? (
            <span className="font-mono tabular-nums text-(--color-fg-subtle)">…</span>
          ) : (
            <>
              <span className="font-mono tabular-nums">{filtered.length}</span>
              {filtered.length !== activities.length && (
                <span> / <span className="font-mono tabular-nums">{activities.length}</span></span>
              )}
              {" "}séance{activities.length > 1 ? "s" : ""}
            </>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2.5 border-b border-(--color-border) px-6 py-3">
        {/* Type pills */}
        <div className="flex flex-wrap gap-2">
          {(["all", "run", "bike", "walk", "other"] as TypeFilter[]).map((f) => (
            <Pill
              key={f}
              active={typeFilter === f}
              count={loading ? undefined : countFor(f)}
              onClick={() => setTypeFilter(f)}
            >
              {f === "all" ? "Toutes" : CATEGORY_META[f].filterLabel}
            </Pill>
          ))}
        </div>

        {/* Sort + numeric filters */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="shrink-0 text-xs text-(--color-fg-subtle)">Trier</span>
          {SORT_OPTIONS.map(({ field, label }) => {
            const isActive = sortBy === field;
            const DirIcon = sortDir === "asc" ? ArrowUp : ArrowDown;
            return (
              <button
                key={field}
                onClick={() => handleSort(field)}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border px-3",
                  "text-xs font-medium transition-colors duration-[--duration-base]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                  isActive
                    ? "border-(--color-accent) bg-(--color-accent-bg) text-(--color-accent)"
                    : "border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg) hover:border-(--color-border-strong) hover:bg-(--color-bg-muted)"
                )}
              >
                {label}
                {isActive && <DirIcon className="h-3 w-3" strokeWidth={2} />}
              </button>
            );
          })}

          <span className="h-4 w-px shrink-0 bg-(--color-border)" aria-hidden />

          {/* Distance */}
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-xs text-(--color-fg-muted)">Dist.</span>
            <NumericInput value={minDist} onChange={setMinDist} placeholder="min" />
            <span className="text-xs text-(--color-fg-subtle)">–</span>
            <NumericInput value={maxDist} onChange={setMaxDist} placeholder="max" />
            <span className="font-mono text-xs text-(--color-fg-subtle)">km</span>
          </div>

          {/* Durée */}
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-xs text-(--color-fg-muted)">Durée</span>
            <NumericInput value={minDur} onChange={setMinDur} placeholder="min" />
            <span className="text-xs text-(--color-fg-subtle)">–</span>
            <NumericInput value={maxDur} onChange={setMaxDur} placeholder="max" />
            <span className="font-mono text-xs text-(--color-fg-subtle)">h</span>
          </div>

          {/* Clear */}
          {hasNumericFilter && (
            <button
              onClick={clearNumericFilters}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-(--color-border) px-3 text-xs font-medium text-(--color-fg-muted) transition-colors hover:border-(--color-border-strong) hover:bg-(--color-bg-muted) hover:text-(--color-fg)"
            >
              <X className="h-3 w-3" strokeWidth={2} />
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          Array.from({ length: 15 }).map((_, i) => <SkeletonRow key={i} />)
        ) : (
          <>
            {groups.map((group) => (
              <div key={group.month}>
                {group.month && (
                  <MonthHeader label={group.month} count={group.activities.length} />
                )}
                {group.activities.map((a) => (
                  <ActivityRow key={a.id} activity={a} />
                ))}
              </div>
            ))}

            {sorted.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-sm font-medium text-(--color-fg)">Aucune activité</p>
                <p className="mt-1 max-w-[280px] text-sm text-(--color-fg-muted)">
                  Modifie les filtres ou les seuils pour en afficher d&apos;autres
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
