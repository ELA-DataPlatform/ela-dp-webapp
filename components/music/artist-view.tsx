"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Search, Check } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrackEntry { name: string; album: string; time: string; plays: number }
interface AlbumRankEntry { name: string; year: number; time: string; plays: number }
interface StudioAlbum {
  name: string; year: number;
  totalTracks: number; listenedTracks: number;
  totalMinutes: number; plays: number;
  isStudio: boolean;
}
interface ArtistData {
  id: string; name: string;
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

interface DayPoint { date: string; minutes: number }
interface WeekPoint { week: string; minutes: number }

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

function hashId(id: string) {
  return id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}min`;
  return `${h}h ${String(m).padStart(2, "0")}`;
}

// Listening over the last 365 days, with a slow seasonal swing so both the
// heatmap and the weekly curve show plausible ebbs and flows.
function generateDailyListening(artistId: string): DayPoint[] {
  const rand = seededRand(hashId(artistId) * 31337 + 7);
  const phase = rand() * Math.PI * 2;
  const cycles = 1.5 + rand();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const result: DayPoint[] = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const t = (364 - i) / 364;
    const season = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * cycles + phase);
    const active = rand() < 0.3 + 0.45 * season;
    const minutes = active ? Math.round((rand() * 80 + 12) * (0.4 + season)) : 0;
    result.push({ date: d.toISOString().slice(0, 10), minutes });
  }
  return result;
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

// ── Mock data ─────────────────────────────────────────────────────────────────

const RADIOHEAD: ArtistData = {
  id: "radiohead", name: "Radiohead",
  genres: ["Alt Rock", "Experimental", "Post-Rock"],
  firstListened: 2018, totalMinutes: 7458, distinctTracks: 74, totalPlays: 992, allTimeRank: 1,
  topTracks: [
    { name: "Weird Fishes / Arpeggi",        album: "In Rainbows", time: "62h 14", plays: 498 },
    { name: "Everything in Its Right Place", album: "Kid A",       time: "44h 30", plays: 380 },
    { name: "How to Disappear Completely",   album: "Kid A",       time: "38h 12", plays: 310 },
    { name: "Pyramid Song",                  album: "Amnesiac",    time: "32h 08", plays: 268 },
    { name: "Reckoner",                      album: "In Rainbows", time: "28h 44", plays: 238 },
    { name: "Exit Music (For a Film)",       album: "OK Computer", time: "24h 20", plays: 202 },
    { name: "Idioteque",                     album: "Kid A",       time: "20h 10", plays: 168 },
    { name: "Fake Plastic Trees",            album: "The Bends",   time: "16h 44", plays: 140 },
    { name: "The National Anthem",           album: "Kid A",       time: "13h 20", plays: 112 },
    { name: "Paranoid Android",              album: "OK Computer", time: "10h 28", plays:  88 },
  ],
  topAlbums: [
    { name: "Kid A",       year: 2000, time: "68h 20", plays: 547 },
    { name: "OK Computer", year: 1997, time: "62h 44", plays: 537 },
    { name: "In Rainbows", year: 2007, time: "45h 30", plays: 365 },
    { name: "Amnesiac",    year: 2001, time: "32h 10", plays: 258 },
    { name: "The Bends",   year: 1995, time: "24h 44", plays: 198 },
  ],
  albums: [
    { name: "A Moon Shaped Pool", year: 2016, totalTracks: 11, listenedTracks:  6, totalMinutes:  640, plays:  88, isStudio: true },
    { name: "In Rainbows",        year: 2007, totalTracks: 10, listenedTracks:  9, totalMinutes: 2730, plays: 365, isStudio: true },
    { name: "Hail to the Thief",  year: 2003, totalTracks: 14, listenedTracks:  8, totalMinutes:  980, plays: 134, isStudio: true },
    { name: "Amnesiac",           year: 2001, totalTracks: 11, listenedTracks: 10, totalMinutes: 1930, plays: 258, isStudio: true },
    { name: "Kid A",              year: 2000, totalTracks: 10, listenedTracks: 10, totalMinutes: 4100, plays: 547, isStudio: true },
    { name: "OK Computer",        year: 1997, totalTracks: 12, listenedTracks: 12, totalMinutes: 3764, plays: 537, isStudio: true },
    { name: "The Bends",          year: 1995, totalTracks: 12, listenedTracks:  9, totalMinutes: 1484, plays: 198, isStudio: true },
    { name: "Pablo Honey",        year: 1993, totalTracks: 12, listenedTracks:  4, totalMinutes:  280, plays:  42, isStudio: true },
  ],
};

const DAFT_PUNK: ArtistData = {
  id: "daft-punk", name: "Daft Punk",
  genres: ["Electronic", "House", "Disco"],
  firstListened: 2017, totalMinutes: 6522, distinctTracks: 63, totalPlays: 1089, allTimeRank: 2,
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
  ],
  albums: [
    { name: "Random Access Memories", year: 2013, totalTracks: 13, listenedTracks: 13, totalMinutes: 2764, plays: 314, isStudio: true },
    { name: "Human After All",        year: 2005, totalTracks: 10, listenedTracks:  8, totalMinutes: 1230, plays: 145, isStudio: true },
    { name: "Discovery",              year: 2001, totalTracks: 14, listenedTracks: 14, totalMinutes: 2380, plays: 264, isStudio: true },
    { name: "Homework",               year: 1997, totalTracks: 16, listenedTracks: 12, totalMinutes: 1930, plays: 220, isStudio: true },
    { name: "Alive 2007",             year: 2007, totalTracks: 14, listenedTracks: 10, totalMinutes:  880, plays: 103, isStudio: false },
    { name: "Alive 1997",             year: 2001, totalTracks:  8, listenedTracks:  5, totalMinutes:  490, plays:  58, isStudio: false },
  ],
};

const TAME_IMPALA: ArtistData = {
  id: "tame-impala", name: "Tame Impala",
  genres: ["Psychedelic Rock", "Dream Pop", "Neo-Psychedelia"],
  firstListened: 2019, totalMinutes: 5790, distinctTracks: 48, totalPlays: 960, allTimeRank: 3,
  topTracks: [
    { name: "The Less I Know the Better",      album: "Currents",      time: "48h 20", plays: 420 },
    { name: "New Person, Same Old Mistakes",   album: "Currents",      time: "32h 10", plays: 268 },
    { name: "Eventually",                      album: "Currents",      time: "26h 50", plays: 224 },
    { name: "Let It Happen",                   album: "Currents",      time: "22h 30", plays: 188 },
    { name: "Elephant",                        album: "Lonerism",      time: "18h 20", plays: 153 },
    { name: "Apocalypse Dreams",               album: "Lonerism",      time: "14h 40", plays: 122 },
    { name: "Feels Like We Only Go Backwards", album: "Lonerism",      time: "11h 20", plays:  94 },
    { name: "Yes I'm Changing",                album: "Currents",      time: "8h 50",  plays:  74 },
    { name: "Endors Toi",                      album: "Lonerism",      time: "6h 40",  plays:  56 },
    { name: "One More Year",                   album: "The Slow Rush",  time: "5h 10",  plays:  43 },
  ],
  topAlbums: [
    { name: "Currents",      year: 2015, time: "32h 50", plays: 563 },
    { name: "Lonerism",      year: 2012, time: "24h 20", plays: 314 },
    { name: "InnerSpeaker",  year: 2010, time: "16h 10", plays: 210 },
    { name: "The Slow Rush", year: 2020, time: "10h 40", plays: 138 },
  ],
  albums: [
    { name: "The Slow Rush",    year: 2020, totalTracks: 12, listenedTracks:  8, totalMinutes:  980, plays: 138, isStudio: true },
    { name: "Currents",         year: 2015, totalTracks: 13, listenedTracks: 13, totalMinutes: 3010, plays: 563, isStudio: true },
    { name: "Lonerism",         year: 2012, totalTracks: 12, listenedTracks: 12, totalMinutes: 2380, plays: 314, isStudio: true },
    { name: "InnerSpeaker",     year: 2010, totalTracks: 10, listenedTracks:  9, totalMinutes: 1540, plays: 210, isStudio: true },
    { name: "Tame Impala (EP)", year: 2008, totalTracks:  5, listenedTracks:  3, totalMinutes:  320, plays:  44, isStudio: false },
  ],
};

const PHOENIX: ArtistData = {
  id: "phoenix", name: "Phoenix",
  genres: ["Indie Pop", "Synth Pop", "New Wave"],
  firstListened: 2019, totalMinutes: 5052, distinctTracks: 50, totalPlays: 880, allTimeRank: 4,
  topTracks: [
    { name: "1901",                  album: "Wolfgang Amadeus Phoenix",  time: "54h 40", plays: 556 },
    { name: "Lisztomania",           album: "Wolfgang Amadeus Phoenix",  time: "32h 20", plays: 320 },
    { name: "Entertainment",         album: "Bankrupt!",                 time: "22h 10", plays: 218 },
    { name: "Too Young",             album: "Alphabetical",              time: "16h 40", plays: 165 },
    { name: "Long Distance Call",    album: "It's Never Been Like That", time: "12h 30", plays: 124 },
    { name: "Trying to Be Cool",     album: "Bankrupt!",                 time: "9h 20",  plays:  92 },
    { name: "J-Boy",                 album: "Ti Amo",                    time: "7h 10",  plays:  71 },
    { name: "If I Ever Feel Better", album: "United",                    time: "5h 40",  plays:  56 },
    { name: "Bourgeois",             album: "Wolfgang Amadeus Phoenix",  time: "4h 30",  plays:  44 },
    { name: "Fools",                 album: "It's Never Been Like That", time: "3h 20",  plays:  33 },
  ],
  topAlbums: [
    { name: "Wolfgang Amadeus Phoenix",  year: 2009, time: "26h 44", plays: 480 },
    { name: "Bankrupt!",                 year: 2013, time: "18h 20", plays: 220 },
    { name: "It's Never Been Like That", year: 2006, time: "12h 10", plays: 145 },
    { name: "Ti Amo",                    year: 2017, time: "8h 40",  plays: 108 },
    { name: "United",                    year: 2000, time: "5h 30",  plays:  69 },
  ],
  albums: [
    { name: "Ti Amo",                    year: 2017, totalTracks: 10, listenedTracks:  8, totalMinutes:  780, plays: 108, isStudio: true },
    { name: "Bankrupt!",                 year: 2013, totalTracks: 11, listenedTracks: 10, totalMinutes: 1680, plays: 220, isStudio: true },
    { name: "Wolfgang Amadeus Phoenix",  year: 2009, totalTracks: 10, listenedTracks: 10, totalMinutes: 2404, plays: 480, isStudio: true },
    { name: "It's Never Been Like That", year: 2006, totalTracks: 10, listenedTracks:  9, totalMinutes: 1090, plays: 145, isStudio: true },
    { name: "Alphabetical",              year: 2004, totalTracks: 10, listenedTracks:  5, totalMinutes:  340, plays:  48, isStudio: true },
    { name: "United",                    year: 2000, totalTracks:  9, listenedTracks:  6, totalMinutes:  490, plays:  69, isStudio: true },
  ],
};

// Somme mock du temps d'écoute cumulé sur l'ensemble des artistes (~500 artistes, distribution puissance)
const TOTAL_LISTENING_MINUTES = 200_000;

const ARTIST_MAP: Record<string, ArtistData> = {
  "radiohead":   RADIOHEAD,
  "daft-punk":   DAFT_PUNK,
  "tame-impala": TAME_IMPALA,
  "phoenix":     PHOENIX,
};

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

const FB_ALBUMS = ["Echoes", "Mirage", "Nocturne", "Horizon", "Velvet", "Parallel", "Aurora", "Lucid", "Ember", "Halcyon", "Drift", "Monolith", "Cascade", "Solstice", "Reverie", "Meridian"];
const FB_ADJ = ["Slow", "Neon", "Golden", "Hollow", "Silent", "Electric", "Crimson", "Distant", "Fading", "Midnight", "Paper", "Wild", "Frozen", "Bright", "Quiet", "Heavy"];
const FB_NOUN = ["Light", "Hearts", "Waves", "Skyline", "Machine", "Dreams", "Rivers", "Static", "Bloom", "Echo", "Smoke", "Tides", "Ghost", "Pulse", "Shadows", "Signal"];

// Fabricates a full mock page for any artist not in ARTIST_MAP, so every entry
// in the selector renders something coherent.
function getFallbackArtist(id: string, name?: string): ArtistData {
  const displayName = name ?? id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const rand = seededRand(hashId(id) * 911 + 17);
  const pick = (arr: string[]) => arr[Math.floor(rand() * arr.length)];

  const albumCount = 3 + Math.floor(rand() * 4);
  const usedAlbum = new Set<string>();
  const albums: StudioAlbum[] = [];
  for (let i = 0; i < albumCount; i++) {
    let an = pick(FB_ALBUMS);
    while (usedAlbum.has(an)) an = pick(FB_ALBUMS);
    usedAlbum.add(an);
    const totalTracks = 8 + Math.floor(rand() * 6);
    const listenedTracks = Math.min(totalTracks, Math.max(2, Math.round(totalTracks * (0.35 + rand() * 0.65))));
    const totalMinutes = Math.round(totalTracks * (18 + rand() * 22));
    albums.push({
      name: an,
      year: 2006 + Math.floor(rand() * 18),
      totalTracks, listenedTracks, totalMinutes,
      plays: Math.round(totalMinutes / 3.5),
      isStudio: true,
    });
  }
  albums.sort((a, b) => b.year - a.year);

  const topAlbums: AlbumRankEntry[] = [...albums]
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 5)
    .map(a => ({ name: a.name, year: a.year, time: fmtDuration(a.totalMinutes), plays: a.plays }));

  const topTracks: TrackEntry[] = [];
  const usedTrack = new Set<string>();
  for (let i = 0; i < 8; i++) {
    let tn = `${pick(FB_ADJ)} ${pick(FB_NOUN)}`;
    while (usedTrack.has(tn)) tn = `${pick(FB_ADJ)} ${pick(FB_NOUN)}`;
    usedTrack.add(tn);
    const album = albums[Math.floor(rand() * albums.length)];
    const mins = Math.round((8 - i) * 95 + rand() * 40);
    topTracks.push({ name: tn, album: album.name, time: fmtDuration(mins), plays: Math.round(mins / 3.2) });
  }

  return {
    id, name: displayName, genres: ["Indie"],
    firstListened: 2017 + Math.floor(rand() * 6),
    totalMinutes: albums.reduce((s, a) => s + a.totalMinutes, 0),
    distinctTracks: albums.reduce((s, a) => s + a.listenedTracks, 0),
    totalPlays: albums.reduce((s, a) => s + a.plays, 0),
    allTimeRank: 5 + Math.floor(rand() * 40),
    topTracks, topAlbums, albums,
  };
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [cell, setCell] = useState(11);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const N = weeks.length;
    const compute = (w: number) => {
      const avail = w - HEATMAP_YLABEL_W - HEATMAP_YLABEL_GAP;
      setCell(Math.max(6, Math.floor((avail - HEATMAP_GAP * (N - 1)) / N)));
    };
    const ro = new ResizeObserver(([e]) => compute(e.contentRect.width));
    ro.observe(el);
    compute(el.offsetWidth);
    return () => ro.disconnect();
  }, [weeks.length]);

  return (
    <div ref={wrapperRef} className="overflow-x-auto pb-1">
      <div className="flex items-start" style={{ gap: HEATMAP_YLABEL_GAP }}>
        {/* Y labels — outside the grid, taille synchronisée avec cell */}
        <div style={{ display: "flex", flexDirection: "column", width: HEATMAP_YLABEL_W, flexShrink: 0, marginTop: 18, gap: HEATMAP_GAP }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((label, i) => (
            <div key={i} style={{ height: cell, lineHeight: `${cell}px` }}
              className="text-right text-[8px] text-(--color-fg-subtle)">
              {label}
            </div>
          ))}
        </div>

        {/* Grid + month labels */}
        <div style={{ flex: 1 }}>
          <div style={{ position: "relative", height: 16, marginBottom: 2 }}>
            {monthPositions.map(({ month, col }) => (
              <span key={`${month}-${col}`}
                style={{ position: "absolute", left: col * (cell + HEATMAP_GAP) }}
                className="text-[9px] text-(--color-fg-subtle)">
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
                    className={cn("cursor-default rounded-[2px]", HEAT_CLASS[heatmapLevel(day.minutes, max)])}
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
          tick={{ fontSize: 9, fill: "var(--color-fg-subtle)", fontFamily: "var(--font-mono)" }}
          axisLine={false} tickLine={false} interval={interval}
        />
        <YAxis
          tick={{ fontSize: 9, fill: "var(--color-fg-subtle)", fontFamily: "var(--font-mono)" }}
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
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-(--radius-md) bg-(--color-bg-muted) text-xl font-semibold text-(--color-fg)">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold leading-tight tracking-[-0.02em] text-(--color-fg)">
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

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-(--color-border) pt-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1">
            <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
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
        <span
          className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-medium"
          style={{ color: tone.fg }}
        >
          {coverInitials(album.name)}
        </span>
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
  const studio = useMemo(
    () => albums.filter(a => a.isStudio).sort((a, b) => b.year - a.year),
    [albums]
  );
  if (!studio.length) return null;

  return (
    <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)">
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 py-2.5">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          Discographie studio
        </span>
        <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">{studio.length}</span>
      </div>
      <div className="scrollbar-none flex gap-7 overflow-x-auto p-4">
        {studio.map(album => (
          <div key={album.name} className="w-32 shrink-0">
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
              <div className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">{entry.plays}×</div>
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
  const sessionsCount = useMemo(() => daily.filter(d => d.minutes > 0).length, [daily]);

  const cells = [
    { label: "Jours actifs",    value: String(activeDays),      sub: "sur 365" },
    { label: "Durée moy./jour", value: fmtDuration(avgActive),  sub: "jours actifs seulement" },
    { label: "Record journée",  value: fmtDuration(maxDay),     sub: "en une journée" },
    { label: "Record semaine",  value: fmtDuration(maxWeek),    sub: "en une semaine" },
    { label: "Série max",       value: `${streak}j`,            sub: "consécutifs" },
    { label: "Sessions / an",   value: String(sessionsCount),   sub: "jours d'écoute" },
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
            <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">{label}</span>
            <span className="font-mono text-xl font-medium tabular-nums leading-tight text-(--color-fg)">{value}</span>
            <span className="text-[11px] text-(--color-fg-subtle)">{sub}</span>
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

// ── Main export ───────────────────────────────────────────────────────────────

export function ArtistView({ artistId }: { artistId: string }) {
  const artist = ARTIST_MAP[artistId] ?? getFallbackArtist(artistId);

  const daily = useMemo(() => generateDailyListening(artistId), [artistId]);
  const weekly = useMemo(() => weeklyFromDaily(daily), [daily]);

  const yearMinutes = useMemo(() => daily.reduce((s, d) => s + d.minutes, 0), [daily]);
  const weeklyAvg = weekly.length ? Math.round(yearMinutes / weekly.length) : 0;

  const selectorArtists = useMemo(() => {
    const list = [...ALL_ARTISTS];
    if (!list.some(a => a.id === artistId)) list.unshift({ id: artistId, name: artist.name });
    return list;
  }, [artistId, artist.name]);

  const topTracksForRanking = artist.topTracks.slice(0, 10).map(t => ({
    name: t.name, sub: t.album, time: t.time, plays: t.plays,
  }));
  const topAlbumsForRanking = artist.topAlbums.slice(0, 10).map(a => ({
    name: a.name, sub: String(a.year), time: a.time, plays: a.plays,
  }));

  return (
    <div className="flex flex-col">
      {/* Sticky header with selector */}
      <div className="sticky top-0 z-30 border-b border-(--color-border) bg-(--color-bg)">
        <div className="flex w-full flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/music"
              aria-label="Retour aux classements"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) transition-colors hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold leading-tight tracking-[-0.02em] text-(--color-fg)">
                {artist.name}
              </h1>
              <span className="text-xs text-(--color-fg-subtle)">Analyse artiste · Spotify</span>
            </div>
          </div>
          <ArtistSelector artists={selectorArtists} currentId={artistId} />
        </div>
      </div>

      {/* Bento grid */}
      <div className="w-full px-4 py-4 sm:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Hero — full width */}
          <div className="lg:col-span-12">
            <HeroCard artist={artist} />
          </div>

          {/* Weekly listening curve — left 8 cols */}
          <div className="lg:col-span-8">
            <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                  Temps d'écoute hebdomadaire
                </span>
                <span className="font-mono text-[9px] tabular-nums text-(--color-fg-subtle)">
                  moy. {fmtDuration(weeklyAvg)}/sem · 52 sem.
                </span>
              </div>
              <div className="h-48">
                <WeeklyCurve data={weekly} />
              </div>
            </div>
          </div>

          {/* Top Albums — right 4 cols, spans 2 rows */}
          <div className="lg:col-span-4 lg:row-span-2">
            <TopRanking title="Top albums" entries={topAlbumsForRanking} className="h-full" />
          </div>

          {/* Activity heatmap — left 8 cols, card shrinks to heatmap width */}
          <div className="lg:col-span-8">
            <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) p-4">
              <div className="mb-3 flex items-center gap-6">
                <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                  Activité sur 365 jours
                </span>
                <span className="font-mono text-[9px] tabular-nums text-(--color-fg-subtle)">
                  {fmtDuration(yearMinutes)}
                </span>
              </div>
              <Heatmap data={daily} />
            </div>
          </div>

          {/* Album gallery — full width */}
          <div className="lg:col-span-12">
            <AlbumGallery albums={artist.albums} />
          </div>

          {/* Top Tracks — left 6 cols */}
          <div className="lg:col-span-6">
            <TopRanking title="Top titres" entries={topTracksForRanking} className="h-full" />
          </div>

          {/* Listening stats placeholder — right 6 cols */}
          <div className="lg:col-span-6">
            <ListeningStats daily={daily} weekly={weekly} className="h-full" />
          </div>

        </div>
      </div>
    </div>
  );
}
