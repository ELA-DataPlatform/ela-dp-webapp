"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUp, ArrowDown, Timer, Footprints, Bike, PersonStanding, Dumbbell, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { LucideIcon } from "lucide-react";

import { ActivityFocusProvider } from "@/components/activity/focus-context";
import { ActivityHeader } from "@/components/activity/header";
import { ConditionsStrip } from "@/components/activity/conditions-strip";
import { Hero } from "@/components/activity/hero";
import { ActivityChart } from "@/components/activity/chart";
import { SplitsTable } from "@/components/activity/splits-table";
import { HRZonesPanel } from "@/components/activity/hr-zones";
import { RecentActivitiesPanel } from "@/components/activity/recent-activities";
import { MusicTimeline } from "@/components/activity/music-timeline";
import { VerdictPanel } from "@/components/activity/verdict";
import type {
  ActivityDetail,
  ChartPoint,
  Lap,
  Segment,
  SegmentKind,
  HRZone,
  HistoricalActivity,
  Track,
  ActivityConditions,
} from "@/components/activity/mock-data";
import { buildGpsTrace } from "@/components/activity/utils";

/* ── API types — list ───────────────────────────────────── */

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

/* ── API types — focus ──────────────────────────────────── */

interface ApiRoutePoint { lat: number; lon: number }

interface ApiFocusDetail {
  activity_id: number;
  activity_name: string;
  activity_type: string;
  activity_date: string;
  start_time_local: string;
  route: { polyline: ApiRoutePoint[] } | null;
  temp_celsius: number | null;
  apparent_temp_celsius: number | null;
  humidity_pct: number | null;
  wind_speed_kph: number | null;
  wind_direction_compass: string | null;
  weather_type: string | null;
  distance_km: number;
  duration_seconds: number;
  avg_pace_min_per_km: number | null;
  avg_hr_bpm: number;
  max_hr_bpm: number;
  elevation_gain_m: number;
  elevation_loss_m: number;
  avg_cadence_spm: number;
  training_load: number;
  aerobic_training_effect: number;
  anaerobic_training_effect: number;
  calories: number;
}

interface ApiFocusSplit {
  lap_index: number;
  pace_min_per_km: number | null;
  gap_min_per_km: number | null;
  avg_hr_bpm: number;
  avg_cadence_spm: number;
  elevation_gain_m: number;
}

interface ApiFocusSegment {
  segment_index: number;
  segment_type: string;
  segment_name: string;
  start_km: number;
  end_km: number;
  distance_m: number;
  duration_seconds: number;
  pace_min_per_km: number | null;
  avg_hr_bpm: number;
  avg_cadence_spm: number;
}

interface ApiFocusTimeseries {
  cum_distance_km: number;
  pace_min_per_km: number | null;
  gap_min_per_km: number | null;
  heart_rate_bpm: number | null;
  cadence_spm: number | null;
  elevation_m: number | null;
  latitude: number | null;
  longitude: number | null;
}

interface ApiFocusHRZone {
  zone_number: number;
  zone_name: string;
  zone_min_bpm: number;
  zone_max_bpm: number | null;
  athlete_max_hr_bpm: number;
  secs_in_zone: number;
}

interface ApiFocusTrack {
  track_name: string;
  artist_name: string;
  album_name: string;
  album_image_url: string | null;
  km_start: number;
  duration_seconds: number;
  latitude: number | null;
  longitude: number | null;
}

interface ApiFocusSimilar {
  recent_activity_id: number;
  activity_date: string;
  distance_km: number;
  duration_seconds: number;
  avg_pace_min_per_km: number;
  avg_hr_bpm: number;
  is_pr: boolean;
}

interface ApiFocusDelta {
  delta_distance_pct: number | null;
  delta_pace_seconds: number | null;
  delta_hr_bpm: number | null;
  delta_training_load_pct: number | null;
}

interface ApiFocusVerdict {
  tldr: string | null;
  strengths_json: string | null;
  warnings_json: string | null;
  recommendations_json: string | null;
}

interface ApiFocusResponse {
  activity_detail: ApiFocusDetail;
  splits: ApiFocusSplit[];
  segments: ApiFocusSegment[];
  timeseries: ApiFocusTimeseries[];
  hr_zones: ApiFocusHRZone[];
  music_timeline: ApiFocusTrack[];
  similar_activities: ApiFocusSimilar[];
  deltas: ApiFocusDelta[];
  verdict: ApiFocusVerdict[];
}

/* ── Mapping API focus → internal types ─────────────────── */

const FOCUS_TRAIL_TYPES = new Set(["trail_running"]);
const FOCUS_BIKE_TYPES  = new Set(["cycling", "indoor_cycling"]);

function toFocusType(t: string): "run" | "trail" | "bike" {
  if (FOCUS_TRAIL_TYPES.has(t)) return "trail";
  if (FOCUS_BIKE_TYPES.has(t))  return "bike";
  return "run";
}

const FOCUS_TYPE_LABEL: Record<string, string> = {
  run: "Course", trail: "Trail", bike: "Vélo",
};

const VALID_KINDS = new Set<string>(["warmup", "interval", "recovery", "cooldown"]);

function mapFocusResponse(r: ApiFocusResponse): ActivityDetail {
  const det = r.activity_detail;
  const type = toFocusType(det.activity_type);

  const coordinates: [number, number][] =
    det.route?.polyline?.map((p) => [p.lat, p.lon]) ?? [];

  // gpsTrace doit être aligné avec le chart : on utilise les cum_distance_km
  // du timeseries (mêmes valeurs que celles utilisées sur l'axe X du chart),
  // sinon le scrub ne suit pas le tracé. Fallback Haversine sur le polyline
  // uniquement si le timeseries n'a pas de GPS.
  const tsGpsPoints = [...r.timeseries]
    .filter((t) => t.latitude != null && t.longitude != null)
    .sort((a, b) => a.cum_distance_km - b.cum_distance_km);

  const gpsTrace = tsGpsPoints.length > 0
    ? tsGpsPoints.map((t) => ({
        distKm: t.cum_distance_km,
        lat:    t.latitude!,
        lon:    t.longitude!,
      }))
    : buildGpsTrace(coordinates);

  const chartData: ChartPoint[] = r.timeseries
    .filter((t) => t.pace_min_per_km != null)
    .sort((a, b) => a.cum_distance_km - b.cum_distance_km)
    .map((t) => ({
      distKm:       t.cum_distance_km,
      paceSecPerKm: Math.round((t.pace_min_per_km ?? 0) * 60),
      gapSecPerKm:  Math.round((t.gap_min_per_km ?? t.pace_min_per_km ?? 0) * 60),
      hrBpm:        Math.round(t.heart_rate_bpm ?? 0),
      cadenceSpm:   Math.round(t.cadence_spm ?? 0),
      elevM:        Math.round(t.elevation_m ?? 0),
    }));

  const laps: Lap[] = r.splits
    .filter((s) => s.pace_min_per_km != null)
    .sort((a, b) => a.lap_index - b.lap_index)
    .map((s) => ({
      km:           s.lap_index,
      paceSecPerKm: Math.round((s.pace_min_per_km ?? 0) * 60),
      gapSecPerKm:  Math.round((s.gap_min_per_km ?? s.pace_min_per_km ?? 0) * 60),
      hrBpm:        s.avg_hr_bpm,
      cadenceSpm:   Math.round(s.avg_cadence_spm),
      elevGainM:    s.elevation_gain_m,
    }));

  const segments: Segment[] = r.segments
    .filter((s) => s.pace_min_per_km != null)
    .sort((a, b) => a.segment_index - b.segment_index)
    .map((s) => ({
      id:            s.segment_index,
      kind:          (VALID_KINDS.has(s.segment_type) ? s.segment_type : "interval") as SegmentKind,
      name:          s.segment_name,
      startKm:       s.start_km,
      endKm:         s.end_km,
      distanceKm:    s.distance_m / 1000,
      durationSec:   s.duration_seconds,
      avgPaceSec:    Math.round((s.pace_min_per_km ?? 0) * 60),
      avgHrBpm:      s.avg_hr_bpm,
      avgCadenceSpm: Math.round(s.avg_cadence_spm),
    }));

  const sorted_zones = [...r.hr_zones].sort((a, b) => a.zone_number - b.zone_number);
  const hrZones: HRZone[] = sorted_zones.map((z) => ({
    zone:    z.zone_number as 1 | 2 | 3 | 4 | 5,
    label:   z.zone_name,
    minBpm:  z.zone_min_bpm,
    maxBpm:  z.zone_max_bpm ?? z.zone_min_bpm + 20,
    timeSec: z.secs_in_zone,
  }));

  const athleteMaxHr = r.hr_zones[0]?.athlete_max_hr_bpm ?? 0;
  const hrMax = athleteMaxHr > 150 ? Math.round(athleteMaxHr) : det.max_hr_bpm;

  const tracks: Track[] = r.music_timeline
    .sort((a, b) => a.km_start - b.km_start)
    .map((t) => ({
      startAtKm:    t.km_start,
      durationSec:  t.duration_seconds,
      trackName:    t.track_name,
      artistName:   t.artist_name,
      albumName:    t.album_name,
      albumColor:   "var(--color-fg-muted)",
      albumImageUrl: t.album_image_url ?? undefined,
      coordinates:  t.latitude != null && t.longitude != null
        ? [t.latitude, t.longitude]
        : [0, 0],
    }));

  const history: HistoricalActivity[] = r.similar_activities
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date))
    .map((a) => ({
      id:          a.recent_activity_id,
      dateDisplay: new Date(a.activity_date + "T12:00:00").toLocaleDateString("fr-FR", {
        day: "numeric", month: "short",
      }),
      distanceKm:  a.distance_km,
      durationSec: a.duration_seconds,
      avgPaceSec:  Math.round(a.avg_pace_min_per_km * 60),
      avgHrBpm:    a.avg_hr_bpm,
      isPB:        a.is_pr,
    }));

  const delta = r.deltas[0] ?? {};

  const conditions: ActivityConditions = {
    tempC:        det.temp_celsius ?? 0,
    feelsLikeC:   det.apparent_temp_celsius ?? 0,
    humidityPct:  det.humidity_pct ?? 0,
    windKmh:      det.wind_speed_kph ?? 0,
    windDir:      det.wind_direction_compass ?? "—",
    weatherLabel: det.weather_type ?? "—",
  };

  const dateDisplay = new Date(det.activity_date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const startTimeLocal = det.start_time_local
    ? new Date(det.start_time_local).toLocaleTimeString("fr-FR", {
        hour: "2-digit", minute: "2-digit",
      }).replace(":", "h")
    : "—";

  return {
    id:             det.activity_id,
    title:          det.activity_name,
    type,
    typeLabel:      FOCUS_TYPE_LABEL[type] ?? "Activité",
    dateDisplay,
    startTimeLocal,
    distanceKm:     det.distance_km,
    durationSec:    det.duration_seconds,
    elevGainM:      det.elevation_gain_m,
    elevLossM:      det.elevation_loss_m,
    paceSecPerKm:   det.avg_pace_min_per_km != null ? Math.round(det.avg_pace_min_per_km * 60) : 0,
    gapSecPerKm:    det.avg_pace_min_per_km != null ? Math.round(det.avg_pace_min_per_km * 60) : 0,
    avgHrBpm:       det.avg_hr_bpm,
    maxHrBpm:       det.max_hr_bpm,
    hrMax,
    cadenceAvg:     Math.round(det.avg_cadence_spm),
    caloriesKcal:   det.calories,
    trainingLoad:   Math.round(det.training_load),
    aerobicLoad:    Math.round(det.aerobic_training_effect * 10) / 10,
    anaerobicLoad:  Math.round(det.anaerobic_training_effect * 10) / 10,
    decouplingPct:  0,
    coordinates,
    gpsTrace: gpsTrace.length > 0 ? gpsTrace : undefined,
    chartData,
    laps,
    segments,
    tracks,
    hrZones,
    history,
    conditions,
    deltas: {
      distancePct: delta.delta_distance_pct ?? 0,
      paceSec:     delta.delta_pace_seconds ?? 0,
      hrBpm:       delta.delta_hr_bpm ?? 0,
      loadPct:     delta.delta_training_load_pct ?? 0,
    },
  };
}

interface VerdictData {
  tldr: string;
  strengths: string[];
  watch: string[];
  recommendations: string[];
}

function mapVerdict(v: ApiFocusVerdict): VerdictData | null {
  if (!v.tldr) return null;
  const parse = (s: string | null): string[] => {
    if (!s) return [];
    try { return JSON.parse(s) as string[]; } catch { return []; }
  };
  return {
    tldr:            v.tldr,
    strengths:       parse(v.strengths_json),
    watch:           parse(v.warnings_json),
    recommendations: parse(v.recommendations_json),
  };
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
        <span className="font-mono text-2xs tabular-nums opacity-70">{count}</span>
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
      href={`/activities?id=${activity.id}`}
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
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {label}
      </span>
      <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
        {count} séance{count > 1 ? "s" : ""}
      </span>
    </div>
  );
}

/* ── Detail view ────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="h-10 w-64 animate-pulse rounded-(--radius-md) bg-(--color-bg-muted)" />
      <div className="h-[280px] animate-pulse rounded-(--radius-md) bg-(--color-bg-muted)" />
      <div className="h-64 animate-pulse rounded-(--radius-md) bg-(--color-bg-muted)" />
    </div>
  );
}

function DetailError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-(--color-fg)">Impossible de charger l&apos;activité</p>
      <p className="mt-1 font-mono text-xs tabular-nums text-(--color-fg-subtle)">{message}</p>
    </div>
  );
}

function ActivityDetailView({ id }: { id: string }) {
  const [activity, setActivity]   = useState<ActivityDetail | null>(null);
  const [verdict, setVerdict]     = useState<VerdictData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch(`/webapp/activities/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiFocusResponse>;
      })
      .then((raw) => {
        setActivity(mapFocusResponse(raw));
        const v = raw.verdict?.[0];
        if (v) setVerdict(mapVerdict(v));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (error || !activity) return <DetailError message={error ?? "Activité introuvable"} />;

  const hasConditions = activity.conditions.tempC !== 0 || activity.conditions.weatherLabel !== "—";

  return (
    <ActivityFocusProvider>
      <div className="flex flex-col">
        <ActivityHeader activity={activity} />
        {hasConditions && <ConditionsStrip conditions={activity.conditions} />}

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <Hero activity={activity} />

          <ActivityChart
            data={activity.chartData}
            totalKm={activity.distanceKm}
            segments={activity.segments}
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
            <div className="flex flex-col gap-4">
              <HRZonesPanel zones={activity.hrZones} totalSec={activity.durationSec} />
              <RecentActivitiesPanel activities={activity.history} />
            </div>
            <div className="relative">
              <div className="absolute inset-0">
                <SplitsTable activity={activity} />
              </div>
            </div>
          </div>

          {verdict && <VerdictPanel verdict={verdict} />}

          {activity.tracks.length > 0 && <MusicTimeline tracks={activity.tracks} />}
        </div>
      </div>
    </ActivityFocusProvider>
  );
}

/* ── List view ──────────────────────────────────────────── */

function ActivitiesListView() {
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
      <div className="border-b border-(--color-border) px-5 py-4">
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
                {isActive && <DirIcon className="h-3 w-3" strokeWidth={1.5} />}
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
              <X className="h-3 w-3" strokeWidth={1.5} />
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

/* ── Router ─────────────────────────────────────────────── */

function ActivitiesRouter() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  if (id) return <ActivityDetailView id={id} />;
  return <ActivitiesListView />;
}

export default function ActivitiesPage() {
  return (
    <Suspense>
      <ActivitiesRouter />
    </Suspense>
  );
}
