"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrackEntry { name: string; album: string; time: string; plays: number }
interface AlbumEntry { name: string; year: number; time: string; plays: number }
interface AlbumData {
  name: string; year: number;
  totalTracks: number; listenedTracks: number;
  totalMinutes: number; plays: number;
}
interface ArtistData {
  id: string; name: string;
  genres: string[]; firstListened: number;
  totalMinutes: number; totalPlays: number; allTimeRank: number;
  topTracks: TrackEntry[];
  topAlbums: AlbumEntry[];
  albums: AlbumData[];
  weeklyMinutes: number[]; // 26 values, oldest → newest
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function seededRand(seed: number) {
  let s = ((seed >>> 0) ^ 0xdeadbeef) >>> 0;
  return () => {
    s = (s ^ (s << 13)) >>> 0;
    s = (s ^ (s >> 17)) >>> 0;
    s = (s ^ (s << 5)) >>> 0;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateHeatmap(artistId: string) {
  const seed = artistId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) * 31337;
  const rand = seededRand(seed);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const result: { date: string; minutes: number }[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const r = rand();
    const minutes = r < 0.55 ? Math.floor(rand() * 130) + 5 : 0;
    result.push({ date: d.toISOString().slice(0, 10), minutes });
  }
  return result;
}

function fmtMins(min: number) {
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}`;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const RADIOHEAD: ArtistData = {
  id: "radiohead", name: "Radiohead",
  genres: ["Alt Rock", "Experimental", "Post-Rock"],
  firstListened: 2018, totalMinutes: 7458, totalPlays: 992, allTimeRank: 1,
  topTracks: [
    { name: "Weird Fishes / Arpeggi",          album: "In Rainbows",  time: "62h 14", plays: 498 },
    { name: "Everything in Its Right Place",   album: "Kid A",        time: "44h 30", plays: 380 },
    { name: "How to Disappear Completely",     album: "Kid A",        time: "38h 12", plays: 310 },
    { name: "Pyramid Song",                    album: "Amnesiac",     time: "32h 08", plays: 268 },
    { name: "Reckoner",                        album: "In Rainbows",  time: "28h 44", plays: 238 },
    { name: "Exit Music (For a Film)",         album: "OK Computer",  time: "24h 20", plays: 202 },
    { name: "Idioteque",                       album: "Kid A",        time: "20h 10", plays: 168 },
    { name: "Fake Plastic Trees",              album: "The Bends",    time: "16h 44", plays: 140 },
    { name: "The National Anthem",             album: "Kid A",        time: "13h 20", plays: 112 },
    { name: "Paranoid Android",                album: "OK Computer",  time: "10h 28", plays:  88 },
  ],
  topAlbums: [
    { name: "Kid A",         year: 2000, time: "68h 20", plays: 547 },
    { name: "OK Computer",   year: 1997, time: "62h 44", plays: 537 },
    { name: "In Rainbows",   year: 2007, time: "45h 30", plays: 365 },
    { name: "Amnesiac",      year: 2001, time: "32h 10", plays: 258 },
    { name: "The Bends",     year: 1995, time: "24h 44", plays: 198 },
  ],
  albums: [
    { name: "Kid A",              year: 2000, totalTracks: 10, listenedTracks: 10, totalMinutes: 4100, plays: 547 },
    { name: "OK Computer",        year: 1997, totalTracks: 12, listenedTracks: 12, totalMinutes: 3764, plays: 537 },
    { name: "In Rainbows",        year: 2007, totalTracks: 10, listenedTracks:  9, totalMinutes: 2730, plays: 365 },
    { name: "Amnesiac",           year: 2001, totalTracks: 11, listenedTracks: 10, totalMinutes: 1930, plays: 258 },
    { name: "The Bends",          year: 1995, totalTracks: 12, listenedTracks:  9, totalMinutes: 1484, plays: 198 },
    { name: "Hail to the Thief",  year: 2003, totalTracks: 14, listenedTracks:  8, totalMinutes:  980, plays: 134 },
    { name: "A Moon Shaped Pool", year: 2016, totalTracks: 11, listenedTracks:  6, totalMinutes:  640, plays:  88 },
    { name: "Pablo Honey",        year: 1993, totalTracks: 12, listenedTracks:  4, totalMinutes:  280, plays:  42 },
  ],
  weeklyMinutes: [0, 45, 120, 85, 30, 0, 200, 150, 90, 65, 40, 0, 110, 180, 240, 90, 50, 0, 75, 130, 95, 60, 0, 170, 210, 140],
};

const DAFT_PUNK: ArtistData = {
  id: "daft-punk", name: "Daft Punk",
  genres: ["Electronic", "House", "Disco"],
  firstListened: 2017, totalMinutes: 6522, totalPlays: 1089, allTimeRank: 2,
  topTracks: [
    { name: "Get Lucky",                        album: "Random Access Memories", time: "24h 50", plays: 248 },
    { name: "Around the World",                 album: "Homework",               time: "22h 10", plays: 220 },
    { name: "Lose Yourself to Dance",           album: "Random Access Memories", time: "18h 30", plays: 186 },
    { name: "Harder, Better, Faster, Stronger", album: "Discovery",              time: "16h 20", plays: 162 },
    { name: "One More Time",                    album: "Discovery",              time: "14h 10", plays: 142 },
    { name: "Da Funk",                          album: "Homework",               time: "12h 30", plays: 124 },
    { name: "Instant Crush",                    album: "Random Access Memories", time: "10h 50", plays: 108 },
    { name: "Digital Love",                     album: "Discovery",              time: "9h 20",  plays:  93 },
    { name: "Give Life Back to Music",          album: "Random Access Memories", time: "7h 50",  plays:  78 },
    { name: "Face to Face",                     album: "Discovery",              time: "6h 20",  plays:  63 },
  ],
  topAlbums: [
    { name: "Random Access Memories", year: 2013, time: "30h 44", plays: 314 },
    { name: "Discovery",              year: 2001, time: "26h 20", plays: 264 },
    { name: "Homework",               year: 1997, time: "22h 10", plays: 220 },
    { name: "Human After All",        year: 2005, time: "14h 30", plays: 145 },
    { name: "Alive 2007",             year: 2007, time: "10h 20", plays: 103 },
  ],
  albums: [
    { name: "Random Access Memories", year: 2013, totalTracks: 13, listenedTracks: 13, totalMinutes: 2764, plays: 314 },
    { name: "Discovery",              year: 2001, totalTracks: 14, listenedTracks: 14, totalMinutes: 2380, plays: 264 },
    { name: "Homework",               year: 1997, totalTracks: 16, listenedTracks: 12, totalMinutes: 1930, plays: 220 },
    { name: "Human After All",        year: 2005, totalTracks: 10, listenedTracks:  8, totalMinutes: 1230, plays: 145 },
    { name: "Alive 2007",             year: 2007, totalTracks: 14, listenedTracks: 10, totalMinutes:  880, plays: 103 },
    { name: "Alive 1997",             year: 2001, totalTracks:  8, listenedTracks:  5, totalMinutes:  490, plays:  58 },
  ],
  weeklyMinutes: [30, 90, 60, 180, 50, 20, 240, 130, 70, 90, 40, 0, 150, 200, 110, 80, 0, 60, 140, 100, 50, 0, 160, 190, 75, 120],
};

const TAME_IMPALA: ArtistData = {
  id: "tame-impala", name: "Tame Impala",
  genres: ["Psychedelic Rock", "Dream Pop", "Neo-Psychedelia"],
  firstListened: 2019, totalMinutes: 5790, totalPlays: 960, allTimeRank: 3,
  topTracks: [
    { name: "The Less I Know the Better",    album: "Currents",     time: "48h 20", plays: 420 },
    { name: "New Person, Same Old Mistakes", album: "Currents",     time: "32h 10", plays: 268 },
    { name: "Eventually",                    album: "Currents",     time: "26h 50", plays: 224 },
    { name: "Let It Happen",                 album: "Currents",     time: "22h 30", plays: 188 },
    { name: "Elephant",                      album: "Lonerism",     time: "18h 20", plays: 153 },
    { name: "Apocalypse Dreams",             album: "Lonerism",     time: "14h 40", plays: 122 },
    { name: "Feels Like We Only Go Backwards", album: "Lonerism",   time: "11h 20", plays:  94 },
    { name: "Yes I'm Changing",              album: "Currents",     time: "8h 50",  plays:  74 },
    { name: "Endors Toi",                    album: "Lonerism",     time: "6h 40",  plays:  56 },
    { name: "One More Year",                 album: "The Slow Rush", time: "5h 10", plays:  43 },
  ],
  topAlbums: [
    { name: "Currents",      year: 2015, time: "32h 50", plays: 563 },
    { name: "Lonerism",      year: 2012, time: "24h 20", plays: 314 },
    { name: "InnerSpeaker",  year: 2010, time: "16h 10", plays: 210 },
    { name: "The Slow Rush", year: 2020, time: "10h 40", plays: 138 },
  ],
  albums: [
    { name: "Currents",        year: 2015, totalTracks: 13, listenedTracks: 13, totalMinutes: 3010, plays: 563 },
    { name: "Lonerism",        year: 2012, totalTracks: 12, listenedTracks: 12, totalMinutes: 2380, plays: 314 },
    { name: "InnerSpeaker",    year: 2010, totalTracks: 10, listenedTracks:  9, totalMinutes: 1540, plays: 210 },
    { name: "The Slow Rush",   year: 2020, totalTracks: 12, listenedTracks:  8, totalMinutes:  980, plays: 138 },
    { name: "Tame Impala (EP)", year: 2008, totalTracks:  5, listenedTracks:  3, totalMinutes:  320, plays:  44 },
  ],
  weeklyMinutes: [0, 70, 140, 95, 45, 10, 220, 170, 80, 55, 30, 0, 130, 210, 100, 60, 0, 90, 150, 110, 40, 0, 190, 230, 65, 145],
};

const PHOENIX: ArtistData = {
  id: "phoenix", name: "Phoenix",
  genres: ["Indie Pop", "Synth Pop", "New Wave"],
  firstListened: 2019, totalMinutes: 5052, totalPlays: 880, allTimeRank: 4,
  topTracks: [
    { name: "1901",                  album: "Wolfgang Amadeus Phoenix",     time: "54h 40", plays: 556 },
    { name: "Lisztomania",           album: "Wolfgang Amadeus Phoenix",     time: "32h 20", plays: 320 },
    { name: "Entertainment",         album: "Bankrupt!",                    time: "22h 10", plays: 218 },
    { name: "Too Young",             album: "Alphabetical",                 time: "16h 40", plays: 165 },
    { name: "Long Distance Call",    album: "It's Never Been Like That",    time: "12h 30", plays: 124 },
    { name: "Trying to Be Cool",     album: "Bankrupt!",                    time: "9h 20",  plays:  92 },
    { name: "J-Boy",                 album: "Ti Amo",                       time: "7h 10",  plays:  71 },
    { name: "If I Ever Feel Better", album: "United",                       time: "5h 40",  plays:  56 },
    { name: "Bourgeois",             album: "Wolfgang Amadeus Phoenix",     time: "4h 30",  plays:  44 },
    { name: "Fools",                 album: "It's Never Been Like That",    time: "3h 20",  plays:  33 },
  ],
  topAlbums: [
    { name: "Wolfgang Amadeus Phoenix", year: 2009, time: "26h 44", plays: 480 },
    { name: "Bankrupt!",                year: 2013, time: "18h 20", plays: 220 },
    { name: "It's Never Been Like That", year: 2006, time: "12h 10", plays: 145 },
    { name: "Ti Amo",                   year: 2017, time: "8h 40",  plays: 108 },
    { name: "United",                   year: 2000, time: "5h 30",  plays:  69 },
  ],
  albums: [
    { name: "Wolfgang Amadeus Phoenix",  year: 2009, totalTracks: 10, listenedTracks: 10, totalMinutes: 2404, plays: 480 },
    { name: "Bankrupt!",                 year: 2013, totalTracks: 11, listenedTracks: 10, totalMinutes: 1680, plays: 220 },
    { name: "It's Never Been Like That", year: 2006, totalTracks: 10, listenedTracks:  9, totalMinutes: 1090, plays: 145 },
    { name: "Ti Amo",                    year: 2017, totalTracks: 10, listenedTracks:  8, totalMinutes:  780, plays: 108 },
    { name: "United",                    year: 2000, totalTracks:  9, listenedTracks:  6, totalMinutes:  490, plays:  69 },
    { name: "Alphabetical",              year: 2004, totalTracks: 10, listenedTracks:  5, totalMinutes:  340, plays:  48 },
  ],
  weeklyMinutes: [20, 60, 100, 75, 25, 0, 180, 120, 65, 50, 35, 0, 95, 160, 85, 45, 0, 65, 120, 85, 35, 0, 145, 175, 60, 110],
};

const ARTIST_MAP: Record<string, ArtistData> = {
  "radiohead":   RADIOHEAD,
  "daft-punk":   DAFT_PUNK,
  "tame-impala": TAME_IMPALA,
  "phoenix":     PHOENIX,
};

function getFallbackArtist(id: string): ArtistData {
  const name = id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const rand = seededRand(id.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const totalMinutes = Math.floor(rand() * 3000) + 2000;
  const totalPlays = Math.floor(rand() * 400) + 200;
  return {
    id, name, genres: ["Indie"], firstListened: 2020,
    totalMinutes, totalPlays, allTimeRank: 5,
    topTracks: [], topAlbums: [], albums: [],
    weeklyMinutes: Array.from({ length: 26 }, () => Math.floor(rand() * 80)),
  };
}

const ALL_ARTISTS = [
  { id: "radiohead",          name: "Radiohead" },
  { id: "daft-punk",          name: "Daft Punk" },
  { id: "tame-impala",        name: "Tame Impala" },
  { id: "phoenix",            name: "Phoenix" },
  { id: "bon-iver",           name: "Bon Iver" },
  { id: "miles-davis",        name: "Miles Davis" },
  { id: "frank-ocean",        name: "Frank Ocean" },
  { id: "fleet-foxes",        name: "Fleet Foxes" },
  { id: "m83",                name: "M83" },
  { id: "the-xx",             name: "The xx" },
  { id: "mgmt",               name: "MGMT" },
  { id: "neutral-milk-hotel", name: "Neutral Milk Hotel" },
  { id: "four-tet",           name: "Four Tet" },
  { id: "floating-points",    name: "Floating Points" },
  { id: "modest-mouse",       name: "Modest Mouse" },
];

// ── Heatmap ───────────────────────────────────────────────────────────────────

const HEATMAP_MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function buildHeatmapGrid(data: { date: string; minutes: number }[]) {
  const map: Record<string, number> = {};
  for (const d of data) map[d.date] = d.minutes;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const rangeStart = new Date(today); rangeStart.setDate(today.getDate() - 364);

  // Align grid start to Monday
  const gridStart = new Date(rangeStart);
  const dow = (rangeStart.getDay() + 6) % 7;
  gridStart.setDate(rangeStart.getDate() - dow);

  const weeks: ({ date: string; minutes: number } | null)[][] = [];
  const monthPositions: { month: string; col: number }[] = [];
  let lastMonth = -1;
  const cursor = new Date(gridStart);
  let weekIdx = 0;

  while (cursor <= today) {
    const week: ({ date: string; minutes: number } | null)[] = [];
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

function getHeatmapClass(minutes: number, max: number): string {
  if (minutes === 0) return "bg-(--color-bg-muted)";
  const r = minutes / max;
  if (r < 0.2)  return "bg-(--color-fg-disabled)";
  if (r < 0.45) return "bg-(--color-fg-subtle)";
  if (r < 0.75) return "bg-(--color-fg-muted)";
  return "bg-(--color-fg)";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Heatmap({ artistId }: { artistId: string }) {
  const data = useMemo(() => generateHeatmap(artistId), [artistId]);
  const max = useMemo(() => Math.max(...data.map(d => d.minutes), 1), [data]);
  const { weeks, monthPositions } = useMemo(() => buildHeatmapGrid(data), [data]);

  const CELL = 11;
  const GAP = 3;

  return (
    <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", width: 10, flexShrink: 0, marginTop: 18, gap: GAP }}>
          {["L","M","M","J","V","S","D"].map((label, i) => (
            <div key={i} style={{ height: CELL, lineHeight: `${CELL}px` }}
              className="text-right text-[8px] text-(--color-fg-subtle)">
              {i % 2 === 0 ? label : ""}
            </div>
          ))}
        </div>

        {/* Grid + month labels */}
        <div>
          <div style={{ position: "relative", height: 16, marginBottom: 2 }}>
            {monthPositions.map(({ month, col }) => (
              <span key={`${month}-${col}`}
                style={{ position: "absolute", left: col * (CELL + GAP) }}
                className="text-[9px] text-(--color-fg-subtle)">
                {month}
              </span>
            ))}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${weeks.length}, ${CELL}px)`,
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gridAutoFlow: "column",
            gap: GAP,
          }}>
            {weeks.flatMap((week, wi) =>
              week.map((day, di) => {
                const key = `${wi}-${di}`;
                if (day === null) {
                  return <div key={key} style={{ width: CELL, height: CELL }} />;
                }
                const dateLabel = new Date(day.date + "T12:00").toLocaleDateString("fr-FR", {
                  day: "numeric", month: "short", year: "numeric",
                });
                const title = day.minutes > 0 ? `${dateLabel} — ${day.minutes} min` : dateLabel;
                return (
                  <div key={key} title={title}
                    className={cn("cursor-default rounded-[2px]", getHeatmapClass(day.minutes, max))}
                    style={{ width: CELL, height: CELL }}
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

function WeeklyChart({ weeklyMinutes }: { weeklyMinutes: number[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    const today = new Date();
    return weeklyMinutes.map((minutes, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (weeklyMinutes.length - 1 - i) * 7);
      return {
        week: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
        minutes,
      };
    });
  }, [weeklyMinutes]);

  if (!mounted) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={7}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 9, fill: "var(--color-fg-subtle)" }}
          axisLine={false} tickLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 9, fill: "var(--color-fg-subtle)" }}
          axisLine={false} tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--color-bg-muted)" }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const v = payload[0]?.value as number;
            return (
              <div className="rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-elevated) px-3 py-2"
                style={{ boxShadow: "var(--shadow-md)" }}>
                <p className="mb-0.5 text-xs text-(--color-fg-muted)">{label}</p>
                <p className="font-mono text-xs font-medium tabular-nums text-(--color-fg)">
                  {v > 0 ? fmtMins(v) : "Pas d'écoute"}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="minutes" fill="var(--color-fg-muted)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function HeroCard({ artist }: { artist: ArtistData }) {
  const initials = artist.name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-bg-muted) text-xl font-semibold text-(--color-fg)">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight tracking-[-0.02em] text-(--color-fg)">
            {artist.name}
          </h2>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {artist.genres.map(g => (
              <span key={g} className="inline-flex h-5 items-center rounded-full border border-(--color-border) px-2 text-[10px] font-medium text-(--color-fg-muted)">
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 divide-x divide-(--color-border) border-t border-(--color-border) pt-4">
        {[
          { label: "TEMPS TOTAL", value: fmtMins(artist.totalMinutes) },
          { label: "PLAYS",       value: artist.totalPlays.toLocaleString("fr-FR") },
          { label: "RANG",        value: `#${artist.allTimeRank}` },
          { label: "DEPUIS",      value: String(artist.firstListened) },
        ].map(({ label, value }, i) => (
          <div key={label} className={cn("flex flex-col gap-1", i === 0 ? "pr-4" : i === 3 ? "pl-4" : "px-4")}>
            <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
              {label}
            </span>
            <span className="font-mono text-2xl font-medium tabular-nums leading-tight text-(--color-fg)">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopRanking({
  title,
  entries,
}: {
  title: string;
  entries: { name: string; sub?: string; time: string; plays: number }[];
}) {
  return (
    <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)">
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
              <div className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">{entry.plays}×</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AlbumCompletion({ albums }: { albums: AlbumData[] }) {
  if (!albums.length) return null;

  return (
    <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)">
      {/* Section header */}
      <div className="border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          Albums — Complétion
        </span>
      </div>

      {/* Column headers */}
      <div className="grid items-center gap-x-4 border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2"
        style={{ gridTemplateColumns: "1fr 72px 130px 72px 44px" }}>
        {[
          { label: "Album",  align: "left" },
          { label: "Titres", align: "right" },
          { label: "Écoute", align: "left" },
          { label: "Durée",  align: "right" },
          { label: "Plays",  align: "right" },
        ].map(({ label, align }) => (
          <span key={label} className={cn(
            "text-[9px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)",
            align === "right" && "text-right"
          )}>
            {label}
          </span>
        ))}
      </div>

      {albums.map((album, i) => {
        const pct = (album.listenedTracks / album.totalTracks) * 100;
        return (
          <div
            key={album.name}
            className={cn(
              "grid items-center gap-x-4 px-4 py-3 transition-colors hover:bg-(--color-bg-muted)",
              i < albums.length - 1 && "border-b border-(--color-border)"
            )}
            style={{ gridTemplateColumns: "1fr 72px 130px 72px 44px" }}
          >
            {/* Name + year */}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-(--color-fg)">{album.name}</div>
              <div className="font-mono text-xs text-(--color-fg-subtle)">{album.year}</div>
            </div>

            {/* Track count */}
            <div className="text-right">
              <span className="font-mono text-xs tabular-nums text-(--color-fg)">{album.listenedTracks}</span>
              <span className="font-mono text-xs text-(--color-fg-subtle)">/{album.totalTracks}</span>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--color-bg-muted)">
                <div className="h-full rounded-full bg-(--color-fg)" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-[10px] tabular-nums text-(--color-fg-subtle)">
                {Math.round(pct)}%
              </span>
            </div>

            {/* Duration */}
            <div className="text-right font-mono text-xs tabular-nums text-(--color-fg)">
              {fmtMins(album.totalMinutes)}
            </div>

            {/* Plays */}
            <div className="text-right font-mono text-xs tabular-nums text-(--color-fg-subtle)">
              {album.plays}×
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ArtistView({ artistId }: { artistId: string }) {
  const router = useRouter();
  const artist = ARTIST_MAP[artistId] ?? getFallbackArtist(artistId);

  const topTracksForRanking = artist.topTracks.map(t => ({
    name: t.name, sub: t.album, time: t.time, plays: t.plays,
  }));
  const topAlbumsForRanking = artist.topAlbums.map(a => ({
    name: a.name, sub: String(a.year), time: a.time, plays: a.plays,
  }));

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-(--color-border) bg-(--color-bg) px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/music"
            aria-label="Retour aux classements"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) transition-colors hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold leading-tight tracking-[-0.02em] text-(--color-fg)">
              {artist.name}
            </h1>
            <span className="text-xs text-(--color-fg-subtle)">Analyse artiste · Spotify</span>
          </div>
        </div>
      </div>

      {/* Artist selector */}
      <div
        className="flex gap-2 overflow-x-auto border-b border-(--color-border) px-4 py-3"
        style={{ scrollbarWidth: "none" }}
      >
        {ALL_ARTISTS.map(a => (
          <button
            key={a.id}
            onClick={() => router.push(`/music/artist/${a.id}`)}
            data-active={a.id === artistId}
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors",
              "border-(--color-border) bg-(--color-bg-elevated) text-(--color-fg)",
              "hover:border-(--color-border-strong) hover:bg-(--color-bg-muted)",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
              "data-[active=true]:border-(--color-accent) data-[active=true]:bg-(--color-accent-bg) data-[active=true]:text-(--color-accent)"
            )}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Page content */}
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">

        {/* Hero */}
        <HeroCard artist={artist} />

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                Rythme d'écoute hebdomadaire
              </span>
              <span className="font-mono text-[9px] tabular-nums text-(--color-fg-subtle)">26 sem.</span>
            </div>
            <div className="h-36">
              <WeeklyChart weeklyMinutes={artist.weeklyMinutes} />
            </div>
          </div>

          <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-4">
            <div className="mb-3">
              <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                Activité sur 365 jours
              </span>
            </div>
            <Heatmap artistId={artistId} />
          </div>
        </div>

        {/* Top tracks + albums */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TopRanking title="Top titres" entries={topTracksForRanking} />
          <TopRanking title="Top albums" entries={topAlbumsForRanking} />
        </div>

        {/* Album completion */}
        <AlbumCompletion albums={artist.albums} />

      </div>
    </div>
  );
}
