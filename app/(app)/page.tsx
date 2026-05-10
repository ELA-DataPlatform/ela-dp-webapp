"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { ActivityCard } from "@/components/ui/activity-card";
import { SectionHeader } from "@/components/ui/section-header";
import { TrainingStateCard } from "@/components/ui/training-state-card";
import { HealthCard } from "@/components/ui/health-card";
import { MusicListeningCard, MusicRankingCard } from "@/components/ui/music-card";
import { GoalCard } from "@/components/ui/goal-card";
import { DayHeroCard } from "@/components/ui/day-hero-card";

// ─── API types ─────────────────────────────────────────────────────────────

interface ApiHealthDay {
  activity_date: string;
  sleep_score: number | null;
  sleep_duration_minutes: number | null;
  hrv_morning_ms: number | null;
  body_battery_at_sleep: number | null;
  body_battery_at_wake: number | null;
  day_label: string;
  day_letter: string;
}

interface ApiHealth {
  avg_sleep_score: number;
  avg_sleep_duration_minutes: number;
  avg_hrv_ms: number;
  avg_body_battery_wake: number;
  delta_sleep_score: number;
  delta_sleep_minutes: number;
  delta_hrv_ms: number;
  delta_body_battery: number;
  delta_sleep_score_tone: string;
  delta_body_battery_tone: string;
  delta_sleep_score_pct: number;
  delta_sleep_minutes_pct: number;
  delta_hrv_pct: number;
  delta_body_battery_pct: number;
  days: ApiHealthDay[];
}

interface ApiLastActivity {
  activity_id: string;
  activity_name: string;
  activity_date: string;
  duration_seconds: number;
  pace_seconds_per_km: number;
  avg_heart_rate_bpm: number;
  elevation_gain_m: number;
  polyline: string;
  activity_date_label: string;
  days_ago: number;
  distance_km: number;
  duration_label: string;
  pace_label: string;
}

interface ApiRankingEntity {
  rank: number;
  entity_name: string;
  subtitle: string | null;
  listening_minutes: number;
  image_url: string;
  rank_change: string;
  listening_label: string;
}

interface ApiMusicRankings {
  period_start: string;
  period_end: string;
  artists: ApiRankingEntity[];
  albums: ApiRankingEntity[];
  tracks: ApiRankingEntity[];
}

interface ApiMusicTrendDay {
  stream_date: string;
  listening_minutes: number;
  day_label: string;
  day_letter: string;
}

interface ApiMusicTrend {
  total_minutes_10d: number;
  total_minutes_prev_10d: number;
  total_label: string;
  delta_pct: number;
  delta_tone: string;
  days: ApiMusicTrendDay[];
}

interface ApiRunningDay {
  activity_date: string;
  distance_km: number;
  is_current_week: boolean;
  day_label: string;
  day_letter: string;
}

interface ApiRunning {
  current_week_km: number;
  previous_week_km: number;
  week_km_delta_pct: number;
  days: ApiRunningDay[];
}

interface ApiTrainingState {
  snapshot_date: string;
  training_load_7d: number;
  training_load_target_low: number;
  training_load_target_high: number;
  active_goal_name: string | null;
  active_goal_date: string | null;
  active_goal_days_left: number | null;
  training_state: "detraining" | "recovery" | "productive" | "maintaining" | "overreaching";
  vo2_max: number;
  vo2_max_status: string;
}

interface HomepageData {
  health: ApiHealth[];
  last_activity: ApiLastActivity[];
  music_rankings: ApiMusicRankings[];
  music_trend: ApiMusicTrend[];
  running: ApiRunning[];
  training_state: ApiTrainingState[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseRankChange(s: string): number | "new" {
  if (s === "new") return "new";
  return parseInt(s, 10);
}

function fmtDurationMin(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, "0")}`;
}

function fmtDeltaSign(v: number): string {
  return v >= 0 ? `+${v}` : `${v}`;
}

function parsePolyline(raw: string): [number, number][] {
  try {
    const pts = JSON.parse(raw) as [number, number][];
    return pts.filter(([lat, lng]) => lat > 40 && lat < 60 && lng > -10 && lng < 20);
  } catch {
    return [];
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-5 ${className ?? ""}`}>
      <div className="mb-3 h-2.5 w-24 animate-pulse rounded bg-(--color-bg-muted)" />
      <div className="h-8 w-32 animate-pulse rounded bg-(--color-bg-muted)" />
      <div className="mt-2 h-2.5 w-20 animate-pulse rounded bg-(--color-bg-muted)" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    apiFetch("/webapp/homepage")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-(--color-border) pb-4 lg:mb-10 lg:pb-6">
        <h1 className="text-[2rem] font-semibold tracking-[-0.03em] leading-none text-(--color-fg) sm:text-[2.5rem] lg:text-[3rem]">
          Almanach
        </h1>
        <p className="mt-2 text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)" suppressHydrationWarning>
          {today}
        </p>
      </header>

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <SkeletonCard />
            <SkeletonCard className="sm:col-span-2" />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ) : data ? (
        <HomepageContent data={data} />
      ) : null}
    </div>
  );
}

function HomepageContent({ data }: { data: HomepageData }) {
  // ── Running ──────────────────────────────────────────────
  const running = data.running[0];
  const runningDays = running.days.slice(-10).map((d) => ({
    day: d.day_label,
    value: d.distance_km,
  }));
  const runningDeltaPct = Math.round(running.week_km_delta_pct);
  const runningDeltaStr = `${runningDeltaPct >= 0 ? "+" : ""}${runningDeltaPct}% vs sem. préc.`;
  const runningDeltaTone = runningDeltaPct >= 0 ? "success" : "danger";

  // ── Training state ────────────────────────────────────────
  const ts = data.training_state[0];
  const trainingMetrics = [
    {
      label: "VO2 Max",
      value: ts.vo2_max.toFixed(0),
      detail: ts.vo2_max_status === "declining"
        ? "En baisse"
        : ts.vo2_max_status === "increasing"
        ? "En hausse"
        : "Stable",
    },
    {
      label: "Charge 7j",
      value: ts.training_load_7d.toString(),
      detail: `Cible ${ts.training_load_target_low}–${ts.training_load_target_high}`,
    },
  ];

  // ── Last activity ─────────────────────────────────────────
  const lastActivity = data.last_activity[0] ?? null;
  const activityCoords = lastActivity ? parsePolyline(lastActivity.polyline) : [];
  const activityStats = lastActivity
    ? [
        { value: `${lastActivity.distance_km.toFixed(1)} km`, label: "Distance" },
        { value: lastActivity.duration_label, label: "Durée" },
        { value: lastActivity.pace_label, label: "Allure moy." },
        { value: `${lastActivity.avg_heart_rate_bpm} bpm`, label: "FC moy." },
        { value: `+${lastActivity.elevation_gain_m} m`, label: "Dénivelé +" },
      ]
    : [];
  const activityMeta = lastActivity
    ? `il y a ${lastActivity.days_ago} jour${lastActivity.days_ago > 1 ? "s" : ""}`
    : undefined;

  // ── Health ────────────────────────────────────────────────
  const health = data.health[0];
  const validHealthDays = health.days.filter((d) => d.sleep_score !== null);
  const lastHealthDay = validHealthDays[validHealthDays.length - 1];

  const sleepScoreTrend = health.days
    .filter((d) => d.sleep_score !== null)
    .map((d) => ({ day: d.day_label, value: d.sleep_score as number }));

  const sleepDurationTrend = health.days
    .filter((d) => d.sleep_duration_minutes !== null)
    .map((d) => ({ day: d.day_label, value: d.sleep_duration_minutes as number }));

  const hrvTrend = health.days
    .filter((d) => d.hrv_morning_ms !== null)
    .map((d) => ({ day: d.day_label, value: d.hrv_morning_ms as number }));

  const batteryTrend = health.days
    .filter((d) => d.body_battery_at_sleep !== null && d.body_battery_at_wake !== null)
    .map((d) => ({
      day: d.day_label,
      sleep: d.body_battery_at_sleep as number,
      wake: d.body_battery_at_wake as number,
    }));

  const sleepScoreDisplay = lastHealthDay ? `${lastHealthDay.sleep_score} / 100` : "—";
  const sleepDurationDisplay = lastHealthDay
    ? fmtDurationMin(lastHealthDay.sleep_duration_minutes!)
    : "—";
  const hrvDisplay = lastHealthDay ? `${lastHealthDay.hrv_morning_ms} ms` : "—";
  const batteryDisplay = lastHealthDay ? `${lastHealthDay.body_battery_at_wake}` : "—";

  // ── Music trend ───────────────────────────────────────────
  const musicTrend = data.music_trend[0];
  const musicTrendDays = musicTrend.days.map((d) => ({
    day: d.day_label,
    value: d.listening_minutes,
  }));
  const musicDeltaStr = `${fmtDeltaSign(Math.round(musicTrend.delta_pct))}% vs préc.`;

  // ── Music rankings ────────────────────────────────────────
  const rankings = data.music_rankings[0];
  const toRankItems = (entities: ApiRankingEntity[]) =>
    entities.map((e) => ({
      name: e.entity_name,
      time: e.listening_label,
      image: e.image_url,
      rankChange: parseRankChange(e.rank_change),
    }));

  return (
    <>
      <DayHeroCard
        extraCard={
          <GoalCard
            name="Marathon de la MaXi Race d'Annecy"
            distance="42 km"
            elevation="+1 600 m D+"
            date="2026-05-31"
            dateLabel="31 mai 2026"
            prepStart="2026-04-01"
          />
        }
      />

      <section>
        <SectionHeader label="Sport · Course à pied" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 lg:auto-rows-[280px]">
          <TrainingStateCard
            state={ts.training_state}
            metrics={trainingMetrics}
            goal={ts.active_goal_name ?? undefined}
            goalDaysLeft={ts.active_goal_days_left ?? undefined}
          />
          <HealthCard
            title="Kilomètres"
            avgValue={`${running.current_week_km.toFixed(1)} km`}
            primaryDelta={runningDeltaStr}
            primaryDeltaTone={runningDeltaTone as "success" | "danger"}
            trend={runningDays}
            chartType="bar"
            tooltipFormatter={(v) => `${v.toFixed(1)} km`}
          />
          {lastActivity && (
            <ActivityCard
              name={lastActivity.activity_name}
              date={lastActivity.activity_date_label}
              meta={activityMeta}
              stats={activityStats}
              coordinates={activityCoords}
            />
          )}
        </div>
      </section>

      <section className="mt-6 lg:mt-8">
        <SectionHeader label="Santé · Récupération" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:auto-rows-[240px]">
          <HealthCard
            title="Sleep Score"
            avgValue={sleepScoreDisplay}
            primaryDelta={`${fmtDeltaSign(health.delta_sleep_score)} pts vs moy.`}
            primaryDeltaTone={health.delta_sleep_score_tone as "success" | "warning" | "danger" | "neutral"}
            trend={sleepScoreTrend}
            chartType="bar"
          />
          <HealthCard
            title="Sommeil"
            avgValue={sleepDurationDisplay}
            primaryDelta={`${fmtDeltaSign(health.delta_sleep_minutes)} min vs moy.`}
            primaryDeltaTone={health.delta_sleep_minutes > 0 ? "success" : health.delta_sleep_minutes < 0 ? "danger" : "neutral"}
            trend={sleepDurationTrend}
            chartType="bar"
            tooltipFormatter={fmtDurationMin}
          />
          <HealthCard
            title="Récupération"
            avgValue={hrvDisplay}
            primaryDelta={`${fmtDeltaSign(health.delta_hrv_ms)} ms vs moy.`}
            primaryDeltaTone={health.delta_hrv_ms > 0 ? "success" : health.delta_hrv_ms < 0 ? "danger" : "neutral"}
            trend={hrvTrend}
            chartType="bar"
          />
          <HealthCard
            title="Énergie"
            avgValue={batteryDisplay}
            primaryDelta={`${fmtDeltaSign(health.delta_body_battery)} vs moy.`}
            primaryDeltaTone={health.delta_body_battery_tone as "success" | "warning" | "danger" | "neutral"}
            trend={batteryTrend}
            chartType="battery-bar"
          />
        </div>
      </section>

      <section className="mt-6 lg:mt-8">
        <SectionHeader label="Musique · Spotify" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:auto-rows-[280px]">
          <MusicListeningCard
            trend={musicTrendDays}
            totalTime={musicTrend.total_label}
            delta={musicDeltaStr}
            deltaTone={musicTrend.delta_tone as "success" | "warning" | "danger" | "neutral"}
          />
          <MusicRankingCard
            title="Top Artistes"
            items={toRankItems(rankings.artists)}
            viewMoreHref="/music"
          />
          <MusicRankingCard
            title="Top Albums"
            items={toRankItems(rankings.albums)}
            viewMoreHref="/music"
          />
          <MusicRankingCard
            title="Top Titres"
            items={toRankItems(rankings.tracks)}
            viewMoreHref="/music"
          />
        </div>
      </section>
    </>
  );
}
