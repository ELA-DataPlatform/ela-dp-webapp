"use client";

import { useTheme } from "@/components/theme/theme-provider";
import { useActivityFocus } from "./focus-context";
import { coordAtKm } from "./utils";
import type { ActivityDetail, Track } from "./mock-data";

const MAP_W = 800;
const MAP_H = 500;

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
  let prevLat = 0,
    prevLng = 0,
    result = "";
  for (const [lat, lng] of coords) {
    const dlat = Math.round((lat - prevLat) * 1e5);
    const dlng = Math.round((lng - prevLng) * 1e5);
    result += encodePolylineValue(dlat) + encodePolylineValue(dlng);
    prevLat = lat;
    prevLng = lng;
  }
  return result;
}

function computeBounds(coords: [number, number][]) {
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const lngSpan = maxLng - minLng || 0.001;
  const latSpan = maxLat - minLat || 0.001;
  const zoom = Math.max(
    1,
    Math.floor(
      Math.min(
        Math.log2(((MAP_W * 0.9) / lngSpan) * (360 / 512)),
        Math.log2(((MAP_H * 0.8) / latSpan) * (170 / 512))
      )
    )
  );
  return { centerLat: (minLat + maxLat) / 2, centerLng: (minLng + maxLng) / 2, zoom };
}

function buildMapUrl(coords: [number, number][], dark: boolean) {
  const bounds = computeBounds(coords);
  const { centerLat, centerLng, zoom } = bounds;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || coords.length < 2) return { url: null as string | null, ...bounds };

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

function latLngToPercent(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number
) {
  const worldSize = 512 * Math.pow(2, zoom);
  const mercY = (phi: number) => {
    const s = Math.sin((phi * Math.PI) / 180);
    return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * worldSize;
  };
  const px =
    ((lng + 180) / 360) * worldSize -
    ((centerLng + 180) / 360) * worldSize +
    MAP_W / 2;
  const py = mercY(lat) - mercY(centerLat) + MAP_H / 2;
  return {
    left: `${Math.max(2, Math.min(98, (px / MAP_W) * 100)).toFixed(1)}%`,
    top: `${Math.max(4, Math.min(96, (py / MAP_H) * 100)).toFixed(1)}%`,
  };
}

// ── SVG fallback projection (linéaire) ────────────────────────────────────────

function svgProjector(coords: [number, number][]) {
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 0.001;
  const lngSpan = maxLng - minLng || 0.001;
  const W = 800, H = 500, PAD = 56;
  return {
    W, H, PAD,
    proj(lat: number, lng: number) {
      return {
        x: PAD + ((lng - minLng) / lngSpan) * (W - 2 * PAD),
        y: PAD + ((maxLat - lat) / latSpan) * (H - 2 * PAD),
      };
    },
  };
}

function SvgRoute({
  coordinates,
  tracks,
  dark,
  hoveredCoord,
}: {
  coordinates: [number, number][];
  tracks: Track[];
  dark: boolean;
  hoveredCoord: [number, number] | null;
}) {
  const { W, H, proj } = svgProjector(coordinates);
  const pts = coordinates.map(([lat, lng]) => {
    const { x, y } = proj(lat, lng);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const bg = dark ? "oklch(0.17 0 0)" : "oklch(0.965 0 0)";
  const grid = dark ? "oklch(0.23 0 0)" : "oklch(0.90 0 0)";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      aria-label="Tracé GPS"
    >
      <rect width={W} height={H} fill={bg} />
      {[1, 2, 3, 4].map((i) => (
        <line key={`h${i}`} x1={0} y1={(H / 5) * i} x2={W} y2={(H / 5) * i} stroke={grid} strokeWidth={1} />
      ))}
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line key={`v${i}`} x1={(W / 8) * i} y1={0} x2={(W / 8) * i} y2={H} stroke={grid} strokeWidth={1} />
      ))}
      <polyline
        points={pts.join(" ")}
        stroke="#2563EB"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      {(() => {
        const { x, y } = proj(coordinates[0][0], coordinates[0][1]);
        return (
          <>
            <circle cx={x} cy={y} r={9} fill="#2563EB" fillOpacity={0.25} />
            <circle cx={x} cy={y} r={5} fill="#2563EB" />
          </>
        );
      })()}
      {tracks.map((track, i) => {
        const { x, y } = proj(track.coordinates[0], track.coordinates[1]);
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={y - 22} stroke="white" strokeWidth={1.5} opacity={0.85} />
            <circle cx={x} cy={y - 36} r={14} fill={track.albumColor} stroke="white" strokeWidth={2} />
            <text x={x} y={y - 31} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={12} fontWeight={600}>
              {track.artistName.charAt(0)}
            </text>
          </g>
        );
      })}
      {hoveredCoord && (() => {
        const { x, y } = proj(hoveredCoord[0], hoveredCoord[1]);
        return (
          <>
            <circle cx={x} cy={y} r={14} fill="white" fillOpacity={0.25} />
            <circle cx={x} cy={y} r={7} fill="white" stroke="#0A0A0A" strokeWidth={2} />
          </>
        );
      })()}
    </svg>
  );
}

export function RouteMap({ activity }: { activity: ActivityDetail }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { hoveredKm } = useActivityFocus();
  const { url, centerLat, centerLng, zoom } = buildMapUrl(activity.coordinates, dark);
  const hoveredCoord =
    hoveredKm != null ? coordAtKm(activity.coordinates, hoveredKm, activity.distanceKm) : null;

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden">
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Tracé GPS"
            className="h-full w-full object-cover"
            style={
              dark
                ? { filter: "contrast(1.05) brightness(0.9)" }
                : { filter: "grayscale(0.3) contrast(1.1)" }
            }
          />

          {activity.tracks.map((track, i) => {
            const pos = latLngToPercent(track.coordinates[0], track.coordinates[1], centerLat, centerLng, zoom);
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

          {hoveredCoord && (() => {
            const pos = latLngToPercent(hoveredCoord[0], hoveredCoord[1], centerLat, centerLng, zoom);
            return (
              <div
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: pos.left, top: pos.top }}
              >
                <div className="relative">
                  <div className="absolute inset-0 -m-2 animate-pulse rounded-full bg-white/40" />
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-(--color-fg) bg-(--color-bg-elevated)" />
                </div>
              </div>
            );
          })()}

          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-(--radius-sm) border border-white/20 bg-black/40 px-2 py-1 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-white/90" />
            <span className="font-mono text-[10px] text-white/90">Albums écoutés</span>
          </div>
        </>
      ) : (
        <SvgRoute
          coordinates={activity.coordinates}
          tracks={activity.tracks}
          dark={dark}
          hoveredCoord={hoveredCoord}
        />
      )}
    </div>
  );
}
