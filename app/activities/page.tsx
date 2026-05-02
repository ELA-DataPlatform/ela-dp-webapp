"use client";

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, Timer, Footprints, Bike, PersonStanding, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ── Types ──────────────────────────────────────────────── */

type ActivityType = "run" | "bike" | "walk";
type TypeFilter = "all" | ActivityType;
type SortField = "date" | "distance" | "duration" | "elevation" | "pace";
type SortDir = "asc" | "desc";

interface Activity {
  id: number;
  type: ActivityType;
  title: string;
  dateDisplay: string;
  dateTs: number;
  distanceKm: number;
  durationMin: number;
  elevationM: number;
  /** Normalized sec/km — bike: 3600 / km·h⁻¹, run/walk: natural */
  paceSecPerKm: number;
  avgHrBpm: number;
}

/* ── Mock data ──────────────────────────────────────────── */

const RAW: Activity[] = [
  { id: 1,  type: "run",  title: "Sortie longue — Vannes",       dateDisplay: "28 avr.", dateTs: +new Date("2026-04-28"), distanceKm: 12.4, durationMin: 63,  elevationM: 124, paceSecPerKm: 302,                  avgHrBpm: 152 },
  { id: 2,  type: "run",  title: "Interval training",             dateDisplay: "26 avr.", dateTs: +new Date("2026-04-26"), distanceKm: 8.2,  durationMin: 42,  elevationM: 0,   paceSecPerKm: 278,                  avgHrBpm: 168 },
  { id: 3,  type: "bike", title: "Sortie vélo côtière",           dateDisplay: "24 avr.", dateTs: +new Date("2026-04-24"), distanceKm: 42.0, durationMin: 89,  elevationM: 380, paceSecPerKm: Math.round(3600/28.4), avgHrBpm: 143 },
  { id: 4,  type: "run",  title: "Récupération active",           dateDisplay: "22 avr.", dateTs: +new Date("2026-04-22"), distanceKm: 6.0,  durationMin: 34,  elevationM: 0,   paceSecPerKm: 345,                  avgHrBpm: 138 },
  { id: 5,  type: "walk", title: "Marche matinale",               dateDisplay: "20 avr.", dateTs: +new Date("2026-04-20"), distanceKm: 4.2,  durationMin: 47,  elevationM: 0,   paceSecPerKm: 680,                  avgHrBpm: 98  },
  { id: 6,  type: "run",  title: "Tempo — Parc de Sceaux",        dateDisplay: "18 avr.", dateTs: +new Date("2026-04-18"), distanceKm: 10.1, durationMin: 49,  elevationM: 67,  paceSecPerKm: 292,                  avgHrBpm: 161 },
  { id: 7,  type: "run",  title: "Semi-marathon Paris",           dateDisplay: "29 mars", dateTs: +new Date("2026-03-29"), distanceKm: 21.1, durationMin: 100, elevationM: 142, paceSecPerKm: 284,                  avgHrBpm: 164 },
  { id: 8,  type: "run",  title: "Sortie longue — Forêt",         dateDisplay: "22 mars", dateTs: +new Date("2026-03-22"), distanceKm: 18.5, durationMin: 98,  elevationM: 215, paceSecPerKm: 318,                  avgHrBpm: 148 },
  { id: 9,  type: "bike", title: "Sortie vélo solo",              dateDisplay: "18 mars", dateTs: +new Date("2026-03-18"), distanceKm: 35.2, durationMin: 81,  elevationM: 290, paceSecPerKm: Math.round(3600/26.1), avgHrBpm: 139 },
  { id: 10, type: "run",  title: "Easy run — Récupération",       dateDisplay: "15 mars", dateTs: +new Date("2026-03-15"), distanceKm: 7.3,  durationMin: 43,  elevationM: 0,   paceSecPerKm: 352,                  avgHrBpm: 135 },
  { id: 11, type: "run",  title: "Fartlek — Bois de Boulogne",    dateDisplay: "12 mars", dateTs: +new Date("2026-03-12"), distanceKm: 9.6,  durationMin: 47,  elevationM: 54,  paceSecPerKm: 299,                  avgHrBpm: 158 },
  { id: 12, type: "walk", title: "Rando week-end",                dateDisplay: "8 mars",  dateTs: +new Date("2026-03-08"), distanceKm: 14.7, durationMin: 207, elevationM: 480, paceSecPerKm: 845,                  avgHrBpm: 112 },
];

/* ── Formatters ─────────────────────────────────────────── */

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, "0")}`;
}

function fmtPace(type: ActivityType, sec: number) {
  if (type === "bike") return `${(3600 / sec).toFixed(1)} km/h`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}'${s.toString().padStart(2, "0")}"/km`;
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
    case "duration":  return a.durationMin;
    case "elevation": return a.elevationM;
    case "pace":      return a.paceSecPerKm;
  }
}

/* ── Month grouping (when sorted by date) ───────────────── */

function groupByMonth(list: Activity[]) {
  const map = new Map<string, Activity[]>();
  for (const a of list) {
    const label = new Date(a.dateTs)
      .toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    const key = label.charAt(0).toUpperCase() + label.slice(1);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return Array.from(map.entries()).map(([month, activities]) => ({ month, activities }));
}

/* ── Type meta ──────────────────────────────────────────── */

const TYPE_META: Record<ActivityType, { icon: LucideIcon; filterLabel: string }> = {
  run:  { icon: Footprints,     filterLabel: "Course"  },
  bike: { icon: Bike,           filterLabel: "Vélo"    },
  walk: { icon: PersonStanding, filterLabel: "Marche"  },
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
      className="h-7 w-[4.5rem] rounded-[--radius-sm] border border-(--color-border) bg-(--color-bg-elevated) px-2 font-mono text-xs tabular-nums text-(--color-fg) placeholder:text-(--color-fg-subtle) focus:border-(--color-accent) focus:outline-none transition-colors"
    />
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const { icon: Icon } = TYPE_META[activity.type];
  const elev = activity.elevationM > 0 ? `+${activity.elevationM} m` : null;

  return (
    <button className="flex w-full items-center gap-3 border-b border-(--color-border) px-4 py-3 text-left transition-colors hover:bg-(--color-bg-muted)">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-bg-muted) text-(--color-fg)">
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-(--color-fg)">{activity.title}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-(--color-fg-subtle)">
          <span className="font-mono tabular-nums">{activity.dateDisplay}</span>
          <span>·</span>
          <span className="font-mono tabular-nums">{activity.distanceKm.toFixed(1)} km</span>
          <span>·</span>
          <span className="font-mono tabular-nums">{fmtPace(activity.type, activity.paceSecPerKm)}</span>
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
          {fmtDuration(activity.durationMin)}
        </div>
        <div className="mt-0.5 font-mono text-xs tabular-nums text-(--color-fg-subtle)">
          {activity.avgHrBpm} bpm
        </div>
      </div>
    </button>
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
  // Type filter
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Sort
  const [sortBy, setSortBy]   = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Numeric filters (empty string = no filter)
  const [minDist, setMinDist] = useState("");
  const [maxDist, setMaxDist] = useState("");
  const [minDur,  setMinDur]  = useState("");
  const [maxDur,  setMaxDur]  = useState("");

  const hasNumericFilter = minDist !== "" || maxDist !== "" || minDur !== "" || maxDur !== "";

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      // Sensible default direction per field
      setSortDir(field === "pace" ? "asc" : "desc");
    }
  }

  function clearNumericFilters() {
    setMinDist(""); setMaxDist(""); setMinDur(""); setMaxDur("");
  }

  const filtered = useMemo(() => {
    return RAW.filter((a) => {
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (minDist !== "" && a.distanceKm  < parseFloat(minDist))       return false;
      if (maxDist !== "" && a.distanceKm  > parseFloat(maxDist))       return false;
      if (minDur  !== "" && a.durationMin < parseFloat(minDur)  * 60)  return false;
      if (maxDur  !== "" && a.durationMin > parseFloat(maxDur)  * 60)  return false;
      return true;
    });
  }, [typeFilter, minDist, maxDist, minDur, maxDur]);

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
    f === "all" ? RAW.length : RAW.filter((a) => a.type === f).length;

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-(--color-border) px-6 py-5">
        <h1 className="text-lg font-semibold tracking-[-0.02em] text-(--color-fg)">Activités</h1>
        <p className="mt-0.5 text-sm text-(--color-fg-subtle)">
          <span className="font-mono tabular-nums">{filtered.length}</span>
          {filtered.length !== RAW.length && (
            <span> / <span className="font-mono tabular-nums">{RAW.length}</span></span>
          )}
          {" "}séance{RAW.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Type filter + numeric filters — même ligne, séparés par · */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-(--color-border) px-6 py-3">
        {/* Type pills */}
        <div className="flex items-center gap-2">
          {(["all", "run", "bike", "walk"] as TypeFilter[]).map((f) => (
            <Pill
              key={f}
              active={typeFilter === f}
              count={countFor(f)}
              onClick={() => setTypeFilter(f)}
            >
              {f === "all" ? "Toutes" : TYPE_META[f].filterLabel}
            </Pill>
          ))}
        </div>

        <span className="text-sm text-(--color-fg-subtle)" aria-hidden>·</span>

        {/* Sort */}
        <div className="flex items-center gap-2">
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
        </div>

        <span className="text-sm text-(--color-fg-subtle)" aria-hidden>·</span>

        {/* Distance */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-(--color-fg-muted)">Distance</span>
          <NumericInput value={minDist} onChange={setMinDist} placeholder="min" />
          <span className="text-xs text-(--color-fg-subtle)">–</span>
          <NumericInput value={maxDist} onChange={setMaxDist} placeholder="max" />
          <span className="font-mono text-xs text-(--color-fg-subtle)">km</span>
        </div>

        <span className="text-sm text-(--color-fg-subtle)" aria-hidden>·</span>

        {/* Durée */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-(--color-fg-muted)">Durée</span>
          <NumericInput value={minDur} onChange={setMinDur} placeholder="min" />
          <span className="text-xs text-(--color-fg-subtle)">–</span>
          <NumericInput value={maxDur} onChange={setMaxDur} placeholder="max" />
          <span className="font-mono text-xs text-(--color-fg-subtle)">h</span>
        </div>

        {/* Clear */}
        {hasNumericFilter && (
          <>
            <span className="text-sm text-(--color-fg-subtle)" aria-hidden>·</span>
            <button
              onClick={clearNumericFilters}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-(--color-border) px-3 text-xs font-medium text-(--color-fg-muted) transition-colors hover:border-(--color-border-strong) hover:bg-(--color-bg-muted) hover:text-(--color-fg)"
            >
              <X className="h-3 w-3" strokeWidth={2} />
              Effacer
            </button>
          </>
        )}
      </div>

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
