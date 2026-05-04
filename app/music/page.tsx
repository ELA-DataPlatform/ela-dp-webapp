"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";
import { apiFetch } from "@/lib/api";

// ── API types ──────────────────────────────────────────────────────────────

interface ApiTrack {
  rank: number;
  rank_previous: number | null;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_image_url: string;
  play_count: number;
  listening_time_min: number;
  is_new_entry: boolean;
}

interface ApiArtist {
  rank: number;
  rank_previous: number | null;
  artist_id: string;
  artist_name: string;
  artist_image_url: string;
  play_count: number;
  listening_time_min: number;
  is_new_entry: boolean;
}

interface ApiAlbum {
  rank: number;
  rank_previous: number | null;
  album_name: string;
  artist_name: string;
  album_image_url: string;
  play_count: number;
  listening_time_min: number;
  is_new_entry: boolean;
}

// ── Internal UI types ─────────────────────────────────────────────────────

type Period = "7d" | "30d" | "6m" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "7d",  label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "6m",  label: "6 mois" },
  { key: "all", label: "All time" },
];

type RankChange = number | "new" | null;

interface RankEntry {
  name: string;
  sub?: string;
  image?: string;
  time: string;
  plays: number;
  change: RankChange;
  href?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtMin(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}`;
}

function computeChange(rank: number, rank_previous: number | null, is_new_entry: boolean): RankChange {
  if (is_new_entry) return "new";
  if (rank_previous === null) return null;
  return rank_previous - rank;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ── Sub-components ─────────────────────────────────────────────────────────

function RankIndicator({ change }: { change: RankChange }) {
  if (change === null) return null;
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
        <ArrowUp size={8} strokeWidth={2.5} />
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-px font-mono text-[10px] tabular-nums text-(--color-danger)">
        <ArrowDown size={8} strokeWidth={2.5} />
        {Math.abs(change)}
      </span>
    );
  }
  return <span className="font-mono text-[10px] text-(--color-fg-disabled)">=</span>;
}

function Avatar({ name, image }: { name: string; image?: string }) {
  if (image) {
    return (
      <img
        src={image}
        alt=""
        className="h-8 w-8 shrink-0 rounded object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-(--color-bg-muted) text-[11px] font-semibold text-(--color-fg-muted)">
      {initials(name)}
    </div>
  );
}

function SkeletonRow({ last }: { last?: boolean }) {
  return (
    <div className={cn(
      "flex h-14 items-center gap-2.5 px-4",
      !last && "border-b border-(--color-border)"
    )}>
      <div className="h-3 w-4 animate-pulse rounded bg-(--color-bg-muted)" />
      <div className="h-3 w-4 animate-pulse rounded bg-(--color-bg-muted)" />
      <div className="h-8 w-8 animate-pulse rounded bg-(--color-bg-muted)" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-3/4 animate-pulse rounded bg-(--color-bg-muted)" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-(--color-bg-muted)" />
      </div>
      <div className="space-y-1.5 text-right">
        <div className="h-3 w-10 animate-pulse rounded bg-(--color-bg-muted)" />
        <div className="h-2.5 w-6 animate-pulse rounded bg-(--color-bg-muted)" />
      </div>
    </div>
  );
}

function RankingCard({
  title,
  entries,
  loading,
}: {
  title: string;
  entries: RankEntry[];
  loading: boolean;
}) {
  const SKELETON_COUNT = 10;

  return (
    <div className="overflow-hidden rounded-[--radius-md] border border-(--color-border) bg-(--color-bg-elevated)">
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          {title}
        </span>
        <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
          {loading ? "—" : entries.length}
        </span>
      </div>

      {loading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <SkeletonRow key={i} last={i === SKELETON_COUNT - 1} />
          ))
        : entries.map((entry, i) => {
            const rowClass = cn(
              "flex h-14 items-center gap-2.5 px-4 transition-colors hover:bg-(--color-bg-muted)",
              i < entries.length - 1 && "border-b border-(--color-border)"
            );
            const rowContent = (
              <>
                <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-(--color-fg-subtle)">
                  {i + 1}
                </span>
                <div className="flex w-5 shrink-0 items-center justify-center">
                  <RankIndicator change={entry.change} />
                </div>
                <Avatar name={entry.name} image={entry.image} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-(--color-fg)">
                    {entry.name}
                  </div>
                  {entry.sub && (
                    <div className="truncate text-xs text-(--color-fg-subtle)">
                      {entry.sub}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs font-medium tabular-nums text-(--color-fg)">
                    {entry.time}
                  </div>
                  <div className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
                    {entry.plays}×
                  </div>
                </div>
              </>
            );

            return entry.href ? (
              <Link key={i} href={entry.href} className={rowClass}>
                {rowContent}
              </Link>
            ) : (
              <div key={i} className={rowClass}>
                {rowContent}
              </div>
            );
          })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function MusicPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [tracks, setTracks] = useState<RankEntry[]>([]);
  const [artists, setArtists] = useState<RankEntry[]>([]);
  const [albums, setAlbums] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    async function load() {
      try {
        const [tracksRes, artistsRes, albumsRes] = await Promise.all([
          apiFetch(`/webapp/rankings/tracks?period=${period}`),
          apiFetch(`/webapp/rankings/artists?period=${period}`),
          apiFetch(`/webapp/rankings/albums?period=${period}`),
        ]);
        const [tracksData, artistsData, albumsData]: [ApiTrack[], ApiArtist[], ApiAlbum[]] =
          await Promise.all([tracksRes.json(), artistsRes.json(), albumsRes.json()]);

        setTracks(
          tracksData.map((t) => ({
            name: t.track_name,
            sub: t.artist_name,
            image: t.album_image_url,
            time: fmtMin(t.listening_time_min),
            plays: t.play_count,
            change: computeChange(t.rank, t.rank_previous, t.is_new_entry),
          }))
        );

        setArtists(
          artistsData.map((a) => ({
            name: a.artist_name,
            image: a.artist_image_url,
            time: fmtMin(a.listening_time_min),
            plays: a.play_count,
            change: computeChange(a.rank, a.rank_previous, a.is_new_entry),
            href: `/music/artist/${a.artist_id}`,
          }))
        );

        setAlbums(
          albumsData.map((al) => ({
            name: al.album_name,
            sub: al.artist_name,
            image: al.album_image_url,
            time: fmtMin(al.listening_time_min),
            plays: al.play_count,
            change: computeChange(al.rank, al.rank_previous, al.is_new_entry),
          }))
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-10 border-b border-(--color-border) bg-(--color-bg) px-4 py-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-[-0.02em] text-(--color-fg)">
            Classements
          </h1>
          <span className="text-xs text-(--color-fg-subtle)">Spotify · Top 20</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              data-active={period === p.key}
              className={cn(
                "inline-flex h-7 items-center rounded-full border px-3 text-xs font-medium transition-colors",
                "border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg)",
                "hover:border-(--color-border-strong) hover:bg-(--color-bg-muted)",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                "data-[active=true]:border-(--color-accent) data-[active=true]:bg-(--color-accent-bg) data-[active=true]:text-(--color-accent)"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-3">
        <RankingCard title="Titres"   entries={tracks}  loading={loading} />
        <RankingCard title="Artistes" entries={artists} loading={loading} />
        <RankingCard title="Albums"   entries={albums}  loading={loading} />
      </div>
    </div>
  );
}
