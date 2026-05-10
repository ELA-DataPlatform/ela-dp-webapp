"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Minus,
  Footprints,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartPoint {
  distKm: number;
  paceSecPerKm: number;
  hrBpm: number;
  elevM: number;
}

interface Lap {
  km: number;
  paceSecPerKm: number;
  hrBpm: number;
  elevGainM: number;
}

interface Track {
  startAtKm: number;
  durationSec: number;
  trackName: string;
  artistName: string;
  albumName: string;
  albumColor: string;
  coordinates: [number, number];
}

interface ActivityDetail {
  id: number;
  title: string;
  dateDisplay: string;
  distanceKm: number;
  durationMin: number;
  elevationM: number;
  paceSecPerKm: number;
  avgHrBpm: number;
  maxHrBpm: number;
  cadenceAvg: number;
  caloriesKcal: number;
  coordinates: [number, number][];
  chartData: ChartPoint[];
  laps: Lap[];
  tracks: Track[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPace(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}'${s.toString().padStart(2, "0")}"`;
}

function fmtDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}` : `${m} min`;
}

function fmtMmSs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Polyline Encoding ────────────────────────────────────────────────────────

function encodePolylineValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let result = "";
  while (v >= 0x20) {
    result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  return result + String.fromCharCode(v + 63);
}

function encodePolyline(coords: [number, number][]): string {
  let prevLat = 0, prevLng = 0, result = "";
  for (const [lat, lng] of coords) {
    const dlat = Math.round((lat - prevLat) * 1e5);
    const dlng = Math.round((lng - prevLng) * 1e5);
    result += encodePolylineValue(dlat) + encodePolylineValue(dlng);
    prevLat = lat;
    prevLng = lng;
  }
  return result;
}

// ─── Mapbox ───────────────────────────────────────────────────────────────────

const MAP_W = 800;
const MAP_H = 500;

function computeBounds(coords: [number, number][], imgW = MAP_W, imgH = MAP_H) {
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const lngSpan = (maxLng - minLng) || 0.001;
  const latSpan = (maxLat - minLat) || 0.001;
  const zoom = Math.max(1, Math.floor(Math.min(
    Math.log2((imgW * 0.9 / lngSpan) * (360 / 512)),
    Math.log2((imgH * 0.8 / latSpan) * (170 / 512)),
  )));
  return { centerLat: (minLat + maxLat) / 2, centerLng: (minLng + maxLng) / 2, zoom };
}

function buildMapUrl(coords: [number, number][], dark: boolean) {
  const bounds = computeBounds(coords);
  const { centerLat, centerLng, zoom } = bounds;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token || coords.length < 2) return { url: null, ...bounds };

  const encoded = encodeURIComponent(encodePolyline(coords));
  const path = `path-3+2563eb-0.9(${encoded})`;
  const [sLat, sLng] = coords[0];
  const startPin = `pin-s+2563eb(${sLng},${sLat})`;
  const mapStyle = dark ? "dark-v11" : "light-v11";
  const url =
    `https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/static/` +
    `${startPin},${path}/${centerLng},${centerLat},${zoom},0,0/${MAP_W}x${MAP_H}@2x` +
    `?attribution=false&logo=false&access_token=${token}`;

  return { url, ...bounds };
}

// ─── Lat/Lng → Percent on MAP_W×MAP_H image ──────────────────────────────────

function latLngToPercent(
  lat: number, lng: number,
  centerLat: number, centerLng: number,
  zoom: number,
  imgW = MAP_W, imgH = MAP_H
) {
  const worldSize = 512 * Math.pow(2, zoom);
  const mercY = (φ: number) => {
    const sinφ = Math.sin((φ * Math.PI) / 180);
    return (0.5 - Math.log((1 + sinφ) / (1 - sinφ)) / (4 * Math.PI)) * worldSize;
  };
  const px = ((lng + 180) / 360) * worldSize - ((centerLng + 180) / 360) * worldSize + imgW / 2;
  const py = mercY(lat) - mercY(centerLat) + imgH / 2;
  return {
    left: `${Math.max(5, Math.min(93, (px / imgW) * 100)).toFixed(1)}%`,
    top: `${Math.max(8, Math.min(88, (py / imgH) * 100)).toFixed(1)}%`,
  };
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// Boucle Vannes ~12.4 km : Vieux-Vannes → port → littoral est → nord → retour
// span ~2.2 km EO × 1.9 km NS pour un zoom lisible sur la carte
const GPS_TRACE: [number, number][] = [
  [47.6582, -2.7590], // 0.0 km  — Vieux Vannes, Porte Saint-Vincent
  [47.6558, -2.7568], // 0.5 km
  [47.6533, -2.7542], // 1.0 km
  [47.6505, -2.7512], // 1.5 km  — Port de Vannes
  [47.6483, -2.7478], // 2.0 km
  [47.6466, -2.7442], // 2.5 km  — Conleau, bord de mer
  [47.6458, -2.7403], // 3.0 km
  [47.6462, -2.7365], // 3.5 km
  [47.6480, -2.7330], // 4.0 km  — Virée vers le nord-est
  [47.6508, -2.7308], // 4.5 km
  [47.6538, -2.7295], // 5.0 km
  [47.6565, -2.7300], // 5.5 km
  [47.6590, -2.7315], // 6.0 km  — Quartier Beaupré
  [47.6610, -2.7348], // 6.5 km
  [47.6624, -2.7388], // 7.0 km
  [47.6630, -2.7430], // 7.5 km  — Nord, Saint-Avé direction
  [47.6622, -2.7468], // 8.0 km
  [47.6615, -2.7505], // 8.5 km
  [47.6618, -2.7542], // 9.0 km
  [47.6608, -2.7568], // 9.5 km
  [47.6596, -2.7578], // 10.0 km — Retour vers les remparts
  [47.6582, -2.7590], // 12.4 km — Arrivée
];

function generateChartData(): ChartPoint[] {
  const pts: ChartPoint[] = [];
  for (let i = 0; i <= 62; i++) {
    const dist = Math.round(i * 0.2 * 10) / 10;
    if (dist > 12.4) break;
    const t = dist / 12.4;
    const pace = 322 - t * 22 + Math.sin(t * Math.PI * 4) * 18 + Math.sin(i * 0.9) * 8;
    const hr = 136 + 32 * (1 - Math.exp(-t * 3.5)) + Math.sin(t * Math.PI * 2.5) * 7 + Math.sin(i * 0.6) * 3;
    const elev = 14 + 38 * Math.sin(t * Math.PI) + 18 * Math.sin(t * Math.PI * 2.8) + Math.cos(i * 0.7) * 3;
    pts.push({
      distKm: dist,
      paceSecPerKm: Math.max(265, Math.min(385, Math.round(pace))),
      hrBpm: Math.max(128, Math.min(178, Math.round(hr))),
      elevM: Math.max(5, Math.round(elev)),
    });
  }
  return pts;
}

const CHART_DATA = generateChartData();

const LAPS: Lap[] = [
  { km: 1,    paceSecPerKm: 322, hrBpm: 142, elevGainM: 9  },
  { km: 2,    paceSecPerKm: 316, hrBpm: 148, elevGainM: 13 },
  { km: 3,    paceSecPerKm: 309, hrBpm: 152, elevGainM: 20 },
  { km: 4,    paceSecPerKm: 318, hrBpm: 158, elevGainM: 23 },
  { km: 5,    paceSecPerKm: 326, hrBpm: 162, elevGainM: 17 },
  { km: 6,    paceSecPerKm: 304, hrBpm: 158, elevGainM: -15 },
  { km: 7,    paceSecPerKm: 300, hrBpm: 154, elevGainM: -9  },
  { km: 8,    paceSecPerKm: 296, hrBpm: 153, elevGainM: 11  },
  { km: 9,    paceSecPerKm: 301, hrBpm: 155, elevGainM: 19  },
  { km: 10,   paceSecPerKm: 294, hrBpm: 153, elevGainM: -14 },
  { km: 11,   paceSecPerKm: 304, hrBpm: 150, elevGainM: 6   },
  { km: 12,   paceSecPerKm: 307, hrBpm: 148, elevGainM: -7  },
  { km: 12.4, paceSecPerKm: 290, hrBpm: 147, elevGainM: 0   },
];

const TRACKS: Track[] = [
  {
    startAtKm: 0.5,
    durationSec: 248,
    trackName: "Running Up That Hill",
    artistName: "Kate Bush",
    albumName: "Hounds of Love",
    albumColor: "oklch(0.52 0.18 30)",
    coordinates: [47.6558, -2.7568], // ≈ km 0.5 sur le tracé
  },
  {
    startAtKm: 2.0,
    durationSec: 243,
    trackName: "Titanium",
    artistName: "David Guetta ft. Sia",
    albumName: "Nothing but the Beat",
    albumColor: "oklch(0.48 0.20 255)",
    coordinates: [47.6483, -2.7478], // ≈ km 2.0 — port
  },
  {
    startAtKm: 3.8,
    durationSec: 224,
    trackName: "Harder Better Faster Stronger",
    artistName: "Daft Punk",
    albumName: "Discovery",
    albumColor: "oklch(0.52 0.18 145)",
    coordinates: [47.6462, -2.7365], // ≈ km 3.5 — littoral est
  },
  {
    startAtKm: 5.8,
    durationSec: 262,
    trackName: "Born to Run",
    artistName: "Bruce Springsteen",
    albumName: "Born to Run",
    albumColor: "oklch(0.42 0.10 50)",
    coordinates: [47.6590, -2.7315], // ≈ km 6.0 — Beaupré
  },
  {
    startAtKm: 7.5,
    durationSec: 245,
    trackName: "Eye of the Tiger",
    artistName: "Survivor",
    albumName: "Eye of the Tiger",
    albumColor: "oklch(0.55 0.19 60)",
    coordinates: [47.6630, -2.7430], // ≈ km 7.5 — nord
  },
  {
    startAtKm: 10.0,
    durationSec: 257,
    trackName: "Can't Hold Us",
    artistName: "Macklemore & Ryan Lewis",
    albumName: "The Heist",
    albumColor: "oklch(0.32 0.08 250)",
    coordinates: [47.6596, -2.7578], // ≈ km 10.0 — retour remparts
  },
];

const MOCK_ACTIVITY: ActivityDetail = {
  id: 1,
  title: "Sortie longue — Vannes",
  dateDisplay: "Lundi 28 avril 2026",
  distanceKm: 12.4,
  durationMin: 63,
  elevationM: 124,
  paceSecPerKm: 302,
  avgHrBpm: 152,
  maxHrBpm: 174,
  cadenceAvg: 176,
  caloriesKcal: 742,
  coordinates: GPS_TRACE,
  chartData: CHART_DATA,
  laps: LAPS,
  tracks: TRACKS,
};

// ─── Recharts Tooltip ─────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; stroke: string }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) px-3 py-2" style={{ boxShadow: "var(--shadow-md)" }}>
      <p className="mb-1.5 font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
        {typeof label === "number" ? `${label.toFixed(1)} km` : ""}
      </p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: item.stroke }} />
          <span className="font-mono text-xs tabular-nums text-(--color-fg)">
            {item.name === "paceSecPerKm"
              ? fmtPace(item.value)
              : item.name === "hrBpm"
              ? `${item.value} bpm`
              : `${item.value} m`}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── SVG Fallback — tracé GPS sans token Mapbox ───────────────────────────────

function RouteMapFallback({
  coordinates,
  tracks,
  dark,
}: {
  coordinates: [number, number][];
  tracks: Track[];
  dark: boolean;
}) {
  const lats = coordinates.map((c) => c[0]);
  const lngs = coordinates.map((c) => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latSpan = (maxLat - minLat) || 0.001;
  const lngSpan = (maxLng - minLng) || 0.001;

  const W = 800, H = 500, PAD = 56;

  // projection linéaire — précise pour des zones < 20 km
  function proj(lat: number, lng: number) {
    return {
      x: PAD + ((lng - minLng) / lngSpan) * (W - 2 * PAD),
      y: PAD + ((maxLat - lat) / latSpan) * (H - 2 * PAD),
    };
  }

  const pts = coordinates.map(([lat, lng]) => {
    const { x, y } = proj(lat, lng);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const bg   = dark ? "oklch(0.17 0 0)" : "oklch(0.965 0 0)";
  const grid = dark ? "oklch(0.23 0 0)" : "oklch(0.90 0 0)";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-label="Tracé GPS"
    >
      <rect width={W} height={H} fill={bg} />

      {/* Grille discrète */}
      {[1, 2, 3, 4].map((i) => (
        <line key={`h${i}`} x1={0} y1={(H / 5) * i} x2={W} y2={(H / 5) * i}
          stroke={grid} strokeWidth={1} />
      ))}
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line key={`v${i}`} x1={(W / 8) * i} y1={0} x2={(W / 8) * i} y2={H}
          stroke={grid} strokeWidth={1} />
      ))}

      {/* Tracé GPS */}
      <polyline
        points={pts.join(" ")}
        stroke="#2563EB"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />

      {/* Point de départ */}
      {(() => {
        const { x, y } = proj(coordinates[0][0], coordinates[0][1]);
        return (
          <>
            <circle cx={x} cy={y} r={9} fill="#2563EB" fillOpacity={0.25} />
            <circle cx={x} cy={y} r={5} fill="#2563EB" />
          </>
        );
      })()}

      {/* Pins musique */}
      {tracks.map((track, i) => {
        const { x, y } = proj(track.coordinates[0], track.coordinates[1]);
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={y - 22} stroke="white" strokeWidth={1.5} opacity={0.85} />
            <circle cx={x} cy={y - 36} r={14} fill={track.albumColor} stroke="white" strokeWidth={2} />
            <text x={x} y={y - 31} textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
              {track.artistName.charAt(0)}
            </text>
          </g>
        );
      })}

      {/* Légende */}
      <g transform={`translate(${W - 8}, ${H - 8})`}>
        <rect x={-120} y={-20} width={120} height={20} rx={3}
          fill="black" fillOpacity={0.45} />
        <circle cx={-108} cy={-10} r={4} fill="white" fillOpacity={0.9} />
        <text x={-100} y={-10} dominantBaseline="middle"
          fill="white" fillOpacity={0.9} fontSize={10} fontFamily="ui-monospace, monospace">
          Albums écoutés
        </text>
      </g>
    </svg>
  );
}

// ─── Map with Album Art Pins ──────────────────────────────────────────────────

function ActivityMap({ activity, dark }: { activity: ActivityDetail; dark: boolean }) {
  const { url, centerLat, centerLng, zoom } = buildMapUrl(activity.coordinates, dark);

  return (
    <div className="relative h-full min-h-[180px] w-full overflow-hidden">
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Tracé GPS"
            className="h-full w-full object-cover"
            style={dark
              ? { filter: "contrast(1.05) brightness(0.9)" }
              : { filter: "grayscale(0.3) contrast(1.1)" }}
          />

          {/* Pins HTML (overlay sur l'image Mapbox) */}
          {activity.tracks.map((track, i) => {
            const pos = latLngToPercent(
              track.coordinates[0], track.coordinates[1],
              centerLat, centerLng, zoom
            );
            return (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-full"
                style={{ left: pos.left, top: pos.top }}
                title={`${track.trackName} — ${track.artistName}`}
              >
                <div className="flex flex-col items-center drop-shadow-md">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-sm font-semibold leading-none text-white"
                    style={{ background: track.albumColor }}
                  >
                    {track.artistName.charAt(0)}
                  </div>
                  <div className="h-2 w-px bg-white opacity-80" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-(--radius-sm) border border-white/20 bg-black/40 px-2 py-1 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-white/90" />
            <span className="font-mono text-[10px] text-white/90">Albums écoutés</span>
          </div>
        </>
      ) : (
        /* Fallback SVG — tracé + pins sans token Mapbox */
        <RouteMapFallback
          coordinates={activity.coordinates}
          tracks={activity.tracks}
          dark={dark}
        />
      )}
    </div>
  );
}

// ─── Combined Activity Chart (Allure + FC + Altitude) ────────────────────────

const SERIES_META = [
  { key: "paceSecPerKm", label: "Allure",   color: "var(--color-fg)"      },
  { key: "hrBpm",        label: "FC",        color: "var(--color-danger)"  },
  { key: "elevM",        label: "Altitude",  color: "var(--color-fg-muted)" },
] as const;

type SeriesKey = typeof SERIES_META[number]["key"];

function ActivityChart({ data }: { data: ChartPoint[] }) {
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());

  function toggle(key: SeriesKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const paceMin = Math.min(...data.map((d) => d.paceSecPerKm));
  const paceMax = Math.max(...data.map((d) => d.paceSecPerKm));
  const elevMax = Math.max(...data.map((d) => d.elevM));

  return (
    <div className="px-4 pt-4 pb-3">
      {/* Header + légende cliquable */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          Analyse
        </span>
        <div className="flex items-center gap-4">
          {SERIES_META.map((s) => (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className={cn(
                "flex items-center gap-1.5 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                hidden.has(s.key) ? "opacity-30" : "opacity-100"
              )}
            >
              <div className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
              <span className="text-[11px] text-(--color-fg-muted)">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 44, bottom: 0, left: 44 }}>
          <XAxis
            dataKey="distKm"
            tickFormatter={(v: number) => `${v}`}
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
            interval={9}
          />
          {/* Allure — axe gauche inversé (plus bas sec/km = plus rapide = plus haut) */}
          <YAxis
            yAxisId="pace"
            domain={[paceMax + 20, paceMin - 20]}
            tickFormatter={fmtPace}
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          {/* FC — axe droit */}
          <YAxis
            yAxisId="hr"
            orientation="right"
            domain={[110, 185]}
            tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--color-fg-subtle)" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          {/* Altitude — axe masqué, échelle ×4 pour occuper le quart bas du graphique */}
          <YAxis yAxisId="elev" hide domain={[0, elevMax * 4]} />

          <Tooltip content={<ChartTooltip />} />

          {/* Altitude en fond (rendu en premier) */}
          {!hidden.has("elevM") && (
            <Area
              yAxisId="elev"
              type="monotone"
              dataKey="elevM"
              stroke="var(--color-fg-muted)"
              strokeWidth={1}
              fill="var(--color-fg-muted)"
              fillOpacity={0.13}
              dot={false}
              activeDot={false}
            />
          )}
          {/* Allure */}
          {!hidden.has("paceSecPerKm") && (
            <Area
              yAxisId="pace"
              type="monotone"
              dataKey="paceSecPerKm"
              stroke="var(--color-fg)"
              strokeWidth={1.5}
              fill="var(--color-fg)"
              fillOpacity={0.07}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          )}
          {/* FC — par-dessus */}
          {!hidden.has("hrBpm") && (
            <Line
              yAxisId="hr"
              type="monotone"
              dataKey="hrBpm"
              stroke="var(--color-danger)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Laps Table ───────────────────────────────────────────────────────────────

function LapsTable({ laps }: { laps: Lap[] }) {
  const avgPace = Math.round(laps.reduce((s, l) => s + l.paceSecPerKm, 0) / laps.length);
  const bestPace = Math.min(...laps.map((l) => l.paceSecPerKm));

  return (
    <div>
      <div className="border-b border-(--color-border) bg-(--color-bg-subtle) px-5 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
            Splits par km
          </span>
          <span className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
            moy. {fmtPace(avgPace)}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[3rem_1fr_1fr_1fr] border-b border-(--color-border) bg-(--color-bg-subtle) px-5 py-2">
        {["Km", "Allure", "FC", "Dénivelé"].map((h) => (
          <span key={h} className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-(--color-border)">
        {laps.map((lap) => {
          const isBest = lap.paceSecPerKm === bestPace;
          const delta = lap.paceSecPerKm - avgPace;
          const isFast = delta < -4;
          const isSlow = delta > 4;

          return (
            <div
              key={lap.km}
              className={cn(
                "grid grid-cols-[3rem_1fr_1fr_1fr] px-5 py-2.5 transition-colors hover:bg-(--color-bg-muted)",
                isBest && "bg-(--color-accent-bg)"
              )}
            >
              <span className="font-mono text-xs font-medium tabular-nums text-(--color-fg-subtle)">
                {lap.km}
              </span>
              <span
                className={cn(
                  "font-mono text-sm tabular-nums",
                  isFast && "text-(--color-success)",
                  isSlow && "text-(--color-danger)",
                  !isFast && !isSlow && "text-(--color-fg)"
                )}
              >
                {fmtPace(lap.paceSecPerKm)}
              </span>
              <span className="font-mono text-sm tabular-nums text-(--color-fg)">
                {lap.hrBpm}{" "}
                <span className="text-xs text-(--color-fg-subtle)">bpm</span>
              </span>
              <div className="flex items-center gap-1">
                {lap.elevGainM > 0 ? (
                  <ChevronUp className="h-3 w-3 shrink-0 text-(--color-fg-subtle)" strokeWidth={2} />
                ) : lap.elevGainM < 0 ? (
                  <ChevronDown className="h-3 w-3 shrink-0 text-(--color-fg-subtle)" strokeWidth={2} />
                ) : (
                  <Minus className="h-3 w-3 shrink-0 text-(--color-fg-subtle)" strokeWidth={2} />
                )}
                <span className="font-mono text-sm tabular-nums text-(--color-fg-subtle)">
                  {Math.abs(lap.elevGainM)} m
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Music Timeline ───────────────────────────────────────────────────────────

function MusicTimeline({ tracks }: { tracks: Track[] }) {
  const totalMin = Math.round(tracks.reduce((s, t) => s + t.durationSec, 0) / 60);

  return (
    <div>
      <div className="border-b border-(--color-border) bg-(--color-bg-subtle) px-5 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
            Musique
          </span>
          <span className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
            {tracks.length} titres · {totalMin} min
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2.25rem_1fr_auto] border-b border-(--color-border) bg-(--color-bg-subtle) px-5 py-2">
        {["", "Titre", "Km / Durée"].map((h, i) => (
          <span
            key={i}
            className={cn(
              "text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)",
              i === 2 && "text-right"
            )}
          >
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-(--color-border)">
        {tracks.map((track, i) => (
          <div key={i} className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 px-5 py-3 transition-colors hover:bg-(--color-bg-muted)">
            {/* Album avatar */}
            <div
              className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-sm font-semibold text-white"
              style={{ background: track.albumColor }}
            >
              {track.artistName.charAt(0)}
            </div>

            {/* Track info */}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-(--color-fg)">
                {track.trackName}
              </div>
              <div className="mt-0.5 truncate text-xs text-(--color-fg-subtle)">
                {track.artistName} · {track.albumName}
              </div>
            </div>

            {/* km + duration */}
            <div className="shrink-0 text-right">
              <div className="font-mono text-xs font-medium tabular-nums text-(--color-fg)">
                km {track.startAtKm.toFixed(1)}
              </div>
              <div className="mt-0.5 font-mono text-xs tabular-nums text-(--color-fg-subtle)">
                {fmtMmSs(track.durationSec)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LLM Analysis Card ───────────────────────────────────────────────────────

const MOCK_ANALYSIS = `Cette sortie de 12,4 km présente un profil d'effort bien maîtrisé. Le négatif split observé entre les 6 premiers kilomètres (allure moyenne 5'12"/km) et les 6 derniers (4'58"/km) indique une gestion conservatrice de l'effort en début de séance — une stratégie cohérente pour une sortie longue.

La fréquence cardiaque s'est stabilisée en zone 3 à partir du km 3 et n'a franchi la zone 4 que brièvement aux km 4–5, en corrélation directe avec les 40 mètres de dénivelé positif concentrés sur cette portion. Le retour rapide sous 158 bpm après le km 6 confirme une bonne récupération cardiaque active.

La cadence de 176 spm est dans la fourchette optimale pour un coureur à cette allure. Elle reste stable sur l'ensemble du parcours, ce qui suggère une bonne économie de foulée même en fin d'effort. À surveiller : les km 11–12 montrent un léger ralentissement de l'allure (+13 s/km vs la moyenne) sans hausse de FC correspondante — signe probable de fatigue neuromusculaire plutôt que cardio-vasculaire.

Recommandation : conserver ce même découpage allure pour les prochaines sorties longues, avec une attention particulière à la nutrition à partir du km 9–10 si la distance dépasse 15 km.`;

function LLMAnalysisCard({ analysis }: { analysis: string }) {
  const paragraphs = analysis.trim().split("\n\n");

  return (
    <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-5 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-(--color-fg-muted)" strokeWidth={1.5} />
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
            Analyse
          </span>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
          Claude Sonnet 4.6
        </span>
      </div>

      {/* Corps */}
      <div className="space-y-3 px-5 py-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-[1.65] text-(--color-fg)">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Grid ─────────────────────────────────────────────────────────────────

const KPI_ITEMS: { label: string; getValue: (a: ActivityDetail) => string; unit: string }[] = [
  { label: "Distance",    getValue: (a) => `${a.distanceKm.toFixed(2)}`,    unit: "km"   },
  { label: "Durée",       getValue: (a) => fmtDuration(a.durationMin),      unit: ""     },
  { label: "Allure moy.", getValue: (a) => fmtPace(a.paceSecPerKm),         unit: "/km"  },
  { label: "FC moyenne",  getValue: (a) => `${a.avgHrBpm}`,                 unit: "bpm"  },
  { label: "FC max",      getValue: (a) => `${a.maxHrBpm}`,                 unit: "bpm"  },
  { label: "Dénivelé +",  getValue: (a) => `${a.elevationM}`,               unit: "m"    },
  { label: "Cadence",     getValue: (a) => `${a.cadenceAvg}`,               unit: "spm"  },
  { label: "Calories",    getValue: (a) => `${a.caloriesKcal}`,             unit: "kcal" },
];

function KPIGrid({ activity }: { activity: ActivityDetail }) {
  return (
    <div className="grid grid-cols-4 lg:grid-cols-8">
      {KPI_ITEMS.map((kpi, i) => (
        <div
          key={kpi.label}
          className={cn(
            "flex flex-col justify-center px-4 py-4",
            i % 4 !== 3 && "border-r border-(--color-border)",
            i >= 4 && "border-t border-(--color-border) lg:border-t-0",
            i === 4 && "lg:border-l border-(--color-border)",
          )}
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
            {kpi.label}
          </span>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="font-mono text-lg font-medium tabular-nums leading-tight text-(--color-fg)">
              {kpi.getValue(activity)}
            </span>
            {kpi.unit && (
              <span className="text-xs text-(--color-fg-muted)">{kpi.unit}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityDetailPage() {
  useParams(); // reads [id] — will drive API call in future
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // TODO: look up activity by id from params; for now always show mock
  const activity = MOCK_ACTIVITY;

  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-(--color-border) bg-(--color-bg) px-5 py-3">
        <Link
          href="/activities"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) transition-colors hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
          aria-label="Retour aux activités"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </Link>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-[-0.02em] text-(--color-fg)">
            {activity.title}
          </h1>
          <p className="text-xs text-(--color-fg-subtle)">{activity.dateDisplay}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-bg-elevated) px-2.5 py-1">
          <Footprints className="h-3 w-3 text-(--color-fg-subtle)" strokeWidth={1.5} />
          <span className="text-xs font-medium text-(--color-fg-muted)">Course</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-4 p-5">

        {/* KPI card */}
        <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)">
          <KPIGrid activity={activity} />
        </div>

        {/* Map (2 cols) + Allure & FC (4 cols) — même rangée, même hauteur */}
        <div className="grid gap-4 lg:grid-cols-6">

          {/* Carte card — flex col : header fixe, map flex-1 */}
          <div className="flex flex-col overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) lg:col-span-2">
            <div className="shrink-0 border-b border-(--color-border) bg-(--color-bg-subtle) px-4 pb-2 pt-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
                Carte & parcours
              </span>
            </div>
            <div className="flex-1">
              <ActivityMap activity={activity} dark={isDark} />
            </div>
          </div>

          {/* Analyse (Allure + FC + Altitude) — col 3-6 */}
          <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated) lg:col-span-4">
            <ActivityChart data={activity.chartData} />
          </div>
        </div>

        {/* Laps + Music row */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)">
            <LapsTable laps={activity.laps} />
          </div>
          <div className="overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)">
            <MusicTimeline tracks={activity.tracks} />
          </div>
        </div>

        {/* LLM analysis */}
        <LLMAnalysisCard analysis={MOCK_ANALYSIS} />

      </div>
    </div>
  );
}
