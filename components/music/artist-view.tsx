"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Search, Check } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrackEntry { name: string; album: string; time: string; plays: number }
interface AlbumRankEntry { name: string; year: number; time: string; plays: number }
interface StudioAlbum {
  id: string;
  name: string; year: number;
  totalTracks: number; listenedTracks: number;
  totalMinutes: number; plays: number;
  isStudio: boolean;
  imageUrl?: string;
}
interface ArtistData {
  id: string; name: string;
  imageUrl?: string;
  genres: string[];
  firstListened: number;
  totalMinutes: number;
  distinctTracks: number;
  totalPlays: number;
  allTimeRank: number;
  topTracks: TrackEntry[];
  topAlbums: AlbumRankEntry[];
  albums: StudioAlbum[];
}

// ── API types ─────────────────────────────────────────────────────────────────

interface ApiSummary {
  artist_id: string; artist_name: string; artist_image_url: string;
  first_listened_year: number; total_listening_time_min: number;
  total_plays: number; distinct_tracks_listened: number;
  studio_albums_total: number; studio_albums_completed: number;
  all_time_rank: number; genres: string[];
}
interface ApiAlbumEntry {
  album_id: string;
  album_name: string; album_image_url: string; is_studio_album: boolean;
  total_tracks: number; release_year: number; listened_tracks: number;
  listening_time_min: number; plays: number;
}
interface ApiDailyEntry { listen_date: string; listening_time_min: number }
interface ApiTrackEntry {
  track_name: string; album_name: string;
  listening_time_min: number; plays: number; artist_track_rank: number;
}
interface ApiArtistResponse {
  summary: ApiSummary;
  albums: ApiAlbumEntry[];
  listening_daily: ApiDailyEntry[];
  tracks: ApiTrackEntry[];
}

interface DayPoint { date: string; minutes: number }
interface WeekPoint { week: string; minutes: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashId(id: string) {
  // djb2 — uniform spread across COVER_TONES; charCode sum collided too often.
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h) ^ id.charCodeAt(i);
  return h >>> 0;
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}min`;
  return `${h}h ${String(m).padStart(2, "0")}`;
}

// ── API helpers ───────────────────────────────────────────────────────────────

function fillDailyData(entries: ApiDailyEntry[]): DayPoint[] {
  const map: Record<string, number> = {};
  for (const e of entries) map[e.listen_date] = e.listening_time_min;
  const result: DayPoint[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    result.push({ date: dateStr, minutes: map[dateStr] ?? 0 });
  }
  return result;
}

function mapApiResponse(res: ApiArtistResponse): { artist: ArtistData; daily: DayPoint[] } {
  const { summary, albums, listening_daily, tracks } = res;
  const daily = fillDailyData(listening_daily);

  const topTracks = [...tracks]
    .sort((a, b) => a.artist_track_rank - b.artist_track_rank)
    .slice(0, 10)
    .map(t => ({ name: t.track_name, album: t.album_name, time: fmtDuration(t.listening_time_min), plays: t.plays }));

  const topAlbums = [...albums]
    .sort((a, b) => b.listening_time_min - a.listening_time_min)
    .slice(0, 10)
    .map(a => ({ name: a.album_name, year: a.release_year, time: fmtDuration(a.listening_time_min), plays: a.plays }));

  const artist: ArtistData = {
    id: summary.artist_id,
    name: summary.artist_name,
    imageUrl: summary.artist_image_url,
    genres: summary.genres,
    firstListened: summary.first_listened_year,
    totalMinutes: summary.total_listening_time_min,
    distinctTracks: summary.distinct_tracks_listened,
    totalPlays: summary.total_plays,
    allTimeRank: summary.all_time_rank,
    topTracks,
    topAlbums,
    albums: [...albums]
      .sort((a, b) => b.release_year - a.release_year)
      .map(a => ({
        id: a.album_id,
        name: a.album_name,
        year: a.release_year,
        totalTracks: a.total_tracks,
        listenedTracks: a.listened_tracks,
        totalMinutes: a.listening_time_min,
        plays: a.plays,
        isStudio: a.is_studio_album,
        imageUrl: a.album_image_url,
      })),
  };

  return { artist, daily };
}

function weeklyFromDaily(daily: DayPoint[]): WeekPoint[] {
  const weeks: WeekPoint[] = [];
  for (let end = daily.length; end > 0; end -= 7) {
    const start = Math.max(0, end - 7);
    const slice = daily.slice(start, end);
    weeks.unshift({
      week: slice[0].date,
      minutes: slice.reduce((s, d) => s + d.minutes, 0),
    });
    if (start === 0) break;
  }
  return weeks;
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

const HEATMAP_MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function buildHeatmapGrid(data: DayPoint[]) {
  const map: Record<string, number> = {};
  for (const d of data) map[d.date] = d.minutes;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const rangeStart = new Date(today); rangeStart.setDate(today.getDate() - 364);

  const gridStart = new Date(rangeStart);
  const dow = (rangeStart.getDay() + 6) % 7;
  gridStart.setDate(rangeStart.getDate() - dow);

  const weeks: (DayPoint | null)[][] = [];
  const monthPositions: { month: string; col: number }[] = [];
  let lastMonth = -1;
  const cursor = new Date(gridStart);
  let weekIdx = 0;

  while (cursor <= today) {
    const week: (DayPoint | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if (cursor > today || cursor < rangeStart) {
        week.push(null);
      } else {
        const dateStr = cursor.toISOString().slice(0, 10);
        if (cursor.getDate() === 1) {
          const m = cursor.getMonth();
          if (m !== lastMonth) {
            monthPositions.push({ month: HEATMAP_MONTHS[m], col: weekIdx });
            lastMonth = m;
          }
        }
        week.push({ date: dateStr, minutes: map[dateStr] ?? 0 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    weekIdx++;
  }

  return { weeks, monthPositions };
}

function heatmapLevel(minutes: number, max: number): number {
  if (minutes === 0) return 0;
  const r = minutes / max;
  if (r < 0.2) return 1;
  if (r < 0.45) return 2;
  if (r < 0.75) return 3;
  return 4;
}

const HEAT_CLASS = [
  "bg-(--color-bg-muted)",
  "bg-(--color-fg-disabled)",
  "bg-(--color-fg-subtle)",
  "bg-(--color-fg-muted)",
  "bg-(--color-fg)",
];

const HEATMAP_GAP = 2;
const HEATMAP_YLABEL_W = 12;
const HEATMAP_YLABEL_GAP = 8;

function Heatmap({ data }: { data: DayPoint[] }) {
  const max = useMemo(() => Math.max(...data.map(d => d.minutes), 1), [data]);
  const { weeks, monthPositions } = useMemo(() => buildHeatmapGrid(data), [data]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(11);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const N = weeks.length;
    const compute = (w: number) => {
      const c = (w - HEATMAP_GAP * (N - 1)) / N;
      // Fill the container width on desktop; floor at 10px so the grid scrolls
      // (rather than shrinking to dust) on narrow viewports, and cap at 22px so
      // the 7 rows stay within the card height on very wide screens.
      setCell(Math.max(10, Math.min(22, c)));
    };
    const ro = new ResizeObserver(([e]) => compute(e.contentRect.width));
    ro.observe(el);
    compute(el.offsetWidth);
    return () => ro.disconnect();
  }, [weeks.length]);

  // Land scrolled to the right — today is on the right edge, like GitHub.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [cell, weeks.length]);

  const gridWidth = weeks.length * cell + (weeks.length - 1) * HEATMAP_GAP;

  return (
    <div className="flex items-start gap-2">
      {/* Day-of-week labels stay outside the scroll container so they remain visible while the grid scrolls. */}
      <div
        className="flex shrink-0 flex-col"
        style={{ width: HEATMAP_YLABEL_W, marginTop: 18, gap: HEATMAP_GAP }}
      >
        {["L", "M", "M", "J", "V", "S", "D"].map((label, i) => (
          <div key={i} style={{ height: cell, lineHeight: `${cell}px` }}
            className="text-right text-[8px] text-(--color-fg-subtle)">
            {label}
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="scrollbar-none min-w-0 flex-1 overflow-x-auto pb-1">
        <div style={{ width: gridWidth }}>
          <div className="relative mb-0.5 h-4">
            {monthPositions.map(({ month, col }) => (
              <span key={`${month}-${col}`}
                style={{ position: "absolute", left: col * (cell + HEATMAP_GAP) }}
                className="text-2xs text-(--color-fg-subtle)">
                {month}
              </span>
            ))}
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${weeks.length}, ${cell}px)`,
            gridTemplateRows: `repeat(7, ${cell}px)`,
            gridAutoFlow: "column",
            gap: HEATMAP_GAP,
          }}>
            {weeks.flatMap((week, wi) =>
              week.map((day, di) => {
                const key = `${wi}-${di}`;
                if (day === null) return <div key={key} style={{ width: cell, height: cell }} />;
                const dateLabel = new Date(day.date + "T12:00").toLocaleDateString("fr-FR", {
                  day: "numeric", month: "short", year: "numeric",
                });
                const title = day.minutes > 0 ? `${dateLabel} — ${fmtDuration(day.minutes)}` : `${dateLabel} — aucune écoute`;
                return (
                  <div key={key} title={title}
                    className={cn("rounded-[2px]", HEAT_CLASS[heatmapLevel(day.minutes, max)])}
                    style={{ width: cell, height: cell }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Weekly curve ────────────────────────────────────────────────────────────

function WeeklyCurve({ data }: { data: WeekPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const chartData = useMemo(() =>
    data.map(d => ({
      label: new Date(d.week + "T12:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      minutes: d.minutes,
    })), [data]);

  const interval = Math.max(1, Math.ceil(chartData.length / 6));

  if (!mounted) return <div className="h-full" />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--color-fg-subtle)", fontFamily: "var(--font-mono)" }}
          axisLine={false} tickLine={false} interval={interval}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--color-fg-subtle)", fontFamily: "var(--font-mono)" }}
          axisLine={false} tickLine={false} width={28}
          tickFormatter={(v: number) => (v >= 60 ? `${Math.round(v / 60)}h` : `${v}m`)}
        />
        <Tooltip
          cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1, strokeDasharray: "3 3" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const v = payload[0]?.value as number;
            return (
              <div className="rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-elevated) px-3 py-2"
                style={{ boxShadow: "var(--shadow-md)" }}>
                <p className="mb-0.5 text-xs text-(--color-fg-muted)">Sem. du {label}</p>
                <p className="font-mono text-xs font-medium tabular-nums text-(--color-fg)">
                  {v > 0 ? fmtDuration(v) : "Pas d'écoute"}
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone" dataKey="minutes"
          stroke="var(--color-chart-1)" strokeWidth={1.5}
          fill="var(--color-chart-1)" fillOpacity={0.06}
          dot={false}
          activeDot={{ r: 3, fill: "var(--color-chart-1)", stroke: "var(--color-bg-elevated)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Hero card ─────────────────────────────────────────────────────────────────

function HeroCard({ artist }: { artist: ArtistData }) {
  const initials = artist.name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const studio = artist.albums.filter(a => a.isStudio);
  const completeStudio = studio.filter(a => a.listenedTracks >= a.totalTracks).length;
  const stats = [
    { label: "Depuis",         value: String(artist.firstListened) },
    { label: "Titres écoutés", value: artist.distinctTracks.toLocaleString("fr-FR") },
    { label: "Temps total",    value: fmtDuration(artist.totalMinutes) },
    { label: "Albums complets", value: `${completeStudio}/${studio.length}` },
    { label: "Rang all-time",  value: `#${artist.allTimeRank}` },
  ];

  return (
    <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-5">
      <div className="flex items-start gap-4">
        {artist.imageUrl ? (
          <img src={artist.imageUrl} alt={artist.name} loading="lazy"
            className="h-14 w-14 shrink-0 rounded-(--radius-md) object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-bg-muted) text-xl font-semibold text-(--color-fg)">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold leading-tight tracking-[-0.02em] text-(--color-fg)">
            {artist.name}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {artist.genres.map(g => (
              <span key={g} className="inline-flex h-5 items-center rounded-full border border-(--color-border) px-2 text-2xs font-medium text-(--color-fg-muted)">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-x-4 gap-y-4 border-t border-(--color-border) pt-4 sm:grid-cols-5">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
              {label}
            </span>
            <span className="font-mono text-xl font-medium tabular-nums leading-tight text-(--color-fg)">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Album gallery ─────────────────────────────────────────────────────────────

// Deterministic grayscale placeholders — no real cover art with mock data.
// Only design tokens are used so the covers stay theme-aware.
const COVER_TONES = [
  { bg: "var(--color-bg-muted)",      fg: "var(--color-fg-muted)" },
  { bg: "var(--color-fg-disabled)",   fg: "var(--color-bg-elevated)" },
  { bg: "var(--color-fg-subtle)",     fg: "var(--color-bg-elevated)" },
  { bg: "var(--color-fg-muted)",      fg: "var(--color-bg-elevated)" },
  { bg: "var(--color-border-strong)", fg: "var(--color-fg)" },
];

function coverInitials(name: string): string {
  return name.replace(/[^\p{L}\s]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

function AlbumCard({ album }: { album: StudioAlbum }) {
  const tone = COVER_TONES[hashId(album.name) % COVER_TONES.length];
  const pct = Math.round((album.listenedTracks / album.totalTracks) * 100);
  const complete = album.listenedTracks >= album.totalTracks;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-(--radius-md) border border-(--color-border)"
        style={{ background: tone.bg }}
      >
        {album.imageUrl ? (
          <img src={album.imageUrl} alt={album.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-medium" style={{ color: tone.fg }}>
            {coverInitials(album.name)}
          </span>
        )}
        {complete && (
          <span
            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-(--color-bg-elevated)"
            title="Album écouté en entier"
          >
            <Check size={12} strokeWidth={2} className="text-(--color-success)" />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-(--color-fg)" title={album.name}>
          {album.name}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="font-mono text-xs tabular-nums text-(--color-fg-subtle)">{album.year}</span>
          <span className="font-mono text-xs tabular-nums text-(--color-fg-muted)">
            {album.listenedTracks}<span className="text-(--color-fg-subtle)">/{album.totalTracks}</span>
          </span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-(--color-bg-muted)">
          <div className="h-full rounded-full bg-(--color-fg)" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function AlbumGallery({ albums }: { albums: StudioAlbum[] }) {
  const sorted = useMemo(
    () => [...albums].sort((a, b) => b.year - a.year),
    [albums]
  );
  if (!sorted.length) return null;

  return (
    <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)">
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          Discographie
        </span>
        <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">{sorted.length}</span>
      </div>
      <div className="scrollbar-none flex gap-7 overflow-x-auto p-4">
        {sorted.map(album => (
          <div key={album.id} className="w-32 shrink-0">
            <AlbumCard album={album} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rankings ──────────────────────────────────────────────────────────────────

function TopRanking({
  title,
  entries,
  className,
}: {
  title: string;
  entries: { name: string; sub?: string; time: string; plays: number }[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)", className)}>
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{title}</span>
        {entries.length > 0 && (
          <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">{entries.length}</span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-(--color-fg-subtle)">
          Données non disponibles
        </div>
      ) : (
        entries.map((entry, i) => (
          <div
            key={`${entry.name}-${i}`}
            className={cn(
              "flex h-14 items-center gap-2.5 px-4 transition-colors hover:bg-(--color-bg-muted)",
              i < entries.length - 1 && "border-b border-(--color-border)"
            )}
          >
            <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-(--color-fg-subtle)">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-(--color-fg)">{entry.name}</div>
              {entry.sub && <div className="truncate text-xs text-(--color-fg-subtle)">{entry.sub}</div>}
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-xs font-medium tabular-nums text-(--color-fg)">{entry.time}</div>
              <div className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">{entry.plays}×</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Listening stats card ──────────────────────────────────────────────────────

function ListeningStats({ daily, weekly, className }: { daily: DayPoint[]; weekly: WeekPoint[]; className?: string }) {
  const activeDays = useMemo(() => daily.filter(d => d.minutes > 0).length, [daily]);
  const maxDay = useMemo(() => Math.max(...daily.map(d => d.minutes), 0), [daily]);
  const maxWeek = useMemo(() => Math.max(...weekly.map(w => w.minutes), 0), [weekly]);
  const streak = useMemo(() => {
    let max = 0, cur = 0;
    for (const d of daily) { if (d.minutes > 0) { cur++; max = Math.max(max, cur); } else cur = 0; }
    return max;
  }, [daily]);
  const avgActive = useMemo(() => {
    const active = daily.filter(d => d.minutes > 0);
    return active.length ? Math.round(active.reduce((s, d) => s + d.minutes, 0) / active.length) : 0;
  }, [daily]);
  const weeklyAvg = useMemo(() => {
    const total = daily.reduce((s, d) => s + d.minutes, 0);
    return Math.round(total / 52);
  }, [daily]);

  const cells = [
    { label: "Jours actifs",    value: String(activeDays),      sub: "sur 365" },
    { label: "Durée moy./jour", value: fmtDuration(avgActive),  sub: "jours actifs seulement" },
    { label: "Record journée",  value: fmtDuration(maxDay),     sub: "en une journée" },
    { label: "Record semaine",  value: fmtDuration(maxWeek),    sub: "en une semaine" },
    { label: "Série max",       value: `${streak}j`,            sub: "consécutifs" },
    { label: "Moy. hebdo",      value: fmtDuration(weeklyAvg),  sub: "sur 52 semaines" },
  ];

  return (
    <div className={cn("overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)", className)}>
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          Statistiques d'écoute
        </span>
        <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">365 j</span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-(--color-border) sm:grid-cols-3">
        {cells.map(({ label, value, sub }) => (
          <div key={label} className="flex flex-col gap-1 bg-(--color-bg-elevated) p-4">
            <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{label}</span>
            <span className="font-mono text-xl font-medium tabular-nums leading-tight text-(--color-fg)">{value}</span>
            <span className="text-2xs text-(--color-fg-subtle)">{sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Artist selector ───────────────────────────────────────────────────────────

function ArtistSelector({ artists, currentId }: { artists: { id: string; name: string }[]; currentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const current = artists.find(a => a.id === currentId);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? artists.filter(a => a.name.toLowerCase().includes(q)) : artists;
  }, [artists, query]);

  function select(id: string) {
    setOpen(false);
    setQuery("");
    if (id !== currentId) router.push(`/music/artist?id=${encodeURIComponent(id)}`);
  }

  return (
    <div ref={ref} className="relative w-full sm:w-72">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-(--radius-sm) border px-3 text-sm transition-colors",
          "border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg)",
          "hover:border-(--color-border-strong)",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
        )}
      >
        <span className="truncate">{current?.name ?? "Choisir un artiste"}</span>
        <ChevronDown size={14} strokeWidth={1.5} className="shrink-0 text-(--color-fg-subtle)" />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-full overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div className="flex items-center gap-2 border-b border-(--color-border) px-3">
            <Search size={14} strokeWidth={1.5} className="shrink-0 text-(--color-fg-subtle)" />
            {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un artiste…"
              className="h-9 w-full bg-transparent text-sm text-(--color-fg) placeholder:text-(--color-fg-subtle) focus:outline-none"
            />
          </div>
          <div className="scrollbar-none max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-(--color-fg-subtle)">Aucun artiste</div>
            ) : (
              filtered.map(a => {
                const isActive = a.id === currentId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => select(a.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                      "hover:bg-(--color-bg-muted)",
                      isActive ? "text-(--color-accent)" : "text-(--color-fg)"
                    )}
                  >
                    <span className="truncate">{a.name}</span>
                    {isActive && <Check size={14} strokeWidth={1.5} className="shrink-0 text-(--color-accent)" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bento skeleton ────────────────────────────────────────────────────────────

function BentoSkeleton() {
  const Sk = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse rounded-(--radius-md) bg-(--color-bg-muted)", className)} />
  );
  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Sk className="h-[168px] lg:col-span-12" />
        <Sk className="h-[276px] lg:col-span-8 lg:h-[292px]" />
        <Sk className="h-[400px] lg:col-span-4 lg:row-span-2 lg:h-[600px]" />
        <Sk className="h-[200px] lg:col-span-8 lg:h-[292px]" />
        <Sk className="h-[216px] lg:col-span-12" />
        <Sk className="h-[600px] lg:col-span-6" />
        <Sk className="h-[400px] lg:col-span-6 lg:h-[600px]" />
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ArtistView({ artistId }: { artistId?: string }) {
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [daily, setDaily] = useState<DayPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectorArtists, setSelectorArtists] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    apiFetch("/webapp/artist")
      .then(r => r.json())
      .then((res: { artist_id: string; artist_name: string }[]) =>
        setSelectorArtists(res.map(a => ({ id: a.artist_id, name: a.artist_name })))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!artistId) return;
    setLoading(true);
    setError(false);
    setArtist(null);
    apiFetch(`/webapp/artist/${encodeURIComponent(artistId)}`)
      .then(r => r.json())
      .then((res: ApiArtistResponse) => {
        const mapped = mapApiResponse(res);
        setArtist(mapped.artist);
        setDaily(mapped.daily);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [artistId]);

  const weekly = useMemo(() => weeklyFromDaily(daily), [daily]);
  const yearMinutes = useMemo(() => daily.reduce((s, d) => s + d.minutes, 0), [daily]);
  // 365 days = 52.14 weeks; divide by 52 to read as "minutes par semaine moyenne"
  // (weekly.length renvoie 53 buckets — biaiserait la moyenne à la baisse).
  const weeklyAvg = Math.round(yearMinutes / 52);

  const topTracksForRanking = useMemo(() => (artist?.topTracks ?? []).map(t => ({
    name: t.name, sub: t.album, time: t.time, plays: t.plays,
  })), [artist]);

  const topAlbumsForRanking = useMemo(() => (artist?.topAlbums ?? []).map(a => ({
    name: a.name, sub: String(a.year), time: a.time, plays: a.plays,
  })), [artist]);

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b border-(--color-border) bg-(--color-bg)">
        <div className="flex w-full items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/music"
            aria-label="Retour aux classements"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) transition-colors hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
          </Link>
          <ArtistSelector artists={selectorArtists} currentId={artistId ?? ""} />
        </div>
      </div>

      {!artistId ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <div className="max-w-xs space-y-2 text-center">
            <p className="text-sm font-medium text-(--color-fg)">Choisis un artiste</p>
            <p className="text-sm text-(--color-fg-subtle)">
              Utilise le sélecteur ci-dessus pour ouvrir le focus d'un artiste.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center py-24 text-sm text-(--color-fg-subtle)">
          Impossible de charger les données de cet artiste.
        </div>
      ) : loading || !artist ? (
        <BentoSkeleton />
      ) : (
        /* Bento grid */
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Hero — full width */}
            <div className="lg:col-span-12">
              <HeroCard artist={artist} />
            </div>

            {/* Weekly listening curve — left 8 cols */}
            <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) lg:col-span-8 lg:h-[292px]">
              <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5">
                <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                  Temps d'écoute hebdomadaire
                </span>
                <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                  moy. {fmtDuration(weeklyAvg)}/sem · 52 sem.
                </span>
              </div>
              <div className="p-4">
                <div className="h-[220px]">
                  <WeeklyCurve data={weekly} />
                </div>
              </div>
            </div>

            {/* Top Albums — right 4 cols, spans 2 rows */}
            <div className="lg:col-span-4 lg:row-span-2 lg:h-[600px]">
              <TopRanking title="Top albums" entries={topAlbumsForRanking} />
            </div>

            {/* Activity heatmap — left 8 cols */}
            <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) lg:col-span-8 lg:h-[292px]">
              <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5">
                <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                  Activité sur 365 jours
                </span>
                <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
                  {fmtDuration(yearMinutes)}
                </span>
              </div>
              <div className="p-4">
                <Heatmap data={daily} />
              </div>
            </div>

            {/* Album gallery — full width */}
            <div className="lg:col-span-12">
              <AlbumGallery albums={artist.albums} />
            </div>

            {/* Top Tracks — left 6 cols */}
            <div className="lg:col-span-6">
              <TopRanking title="Top titres" entries={topTracksForRanking} />
            </div>

            {/* Listening stats — right 6 cols */}
            <div className="lg:col-span-6">
              <ListeningStats daily={daily} weekly={weekly} />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
