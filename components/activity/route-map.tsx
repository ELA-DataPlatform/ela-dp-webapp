"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { useActivityFocus } from "./focus-context";
import { coordAtKm, coordAtKmTrace } from "./utils";
import type { ActivityDetail, Track } from "./mock-data";

// Mapbox static API : max 1280 px par côté, min raisonnable 280.
const MAP_MAX = 1280;
const MAP_MIN = 280;

// Quantize pour éviter de refetcher l'image à chaque pixel de resize.
function quantize(v: number, step = 32) {
  return Math.max(MAP_MIN, Math.min(MAP_MAX, Math.round(v / step) * step));
}

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

// Décime la trace pour rentrer dans la limite d'URL Mapbox (~8192 chars).
// Le rendu visuel n'a pas besoin de plus de ~500 points à cette taille d'image.
function decimate<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const stride = (arr.length - 1) / (maxPoints - 1);
  const out: T[] = [];
  for (let i = 0; i < maxPoints - 1; i++) {
    out.push(arr[Math.floor(i * stride)]);
  }
  out.push(arr[arr.length - 1]);
  return out;
}

function computeBounds(coords: [number, number][], mapW: number, mapH: number) {
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const lngSpan = maxLng - minLng || 0.001;
  const latSpan = maxLat - minLat || 0.001;
  // Padding réduit (3% horizontal, 5% vertical) + zoom fractionnaire pour
  // remplir au max. Mapbox Static accepte les zooms décimaux jusqu'à 22.
  const zoom = Math.min(
    22,
    Math.max(
      1,
      Math.min(
        Math.log2(((mapW * 0.97) / lngSpan) * (360 / 512)),
        Math.log2(((mapH * 0.95) / latSpan) * (170 / 512))
      )
    )
  );
  return {
    centerLat: (minLat + maxLat) / 2,
    centerLng: (minLng + maxLng) / 2,
    zoom: Math.round(zoom * 100) / 100,
  };
}

function buildMapUrl(coords: [number, number][], dark: boolean, mapW: number, mapH: number) {
  const bounds = computeBounds(coords, mapW, mapH);
  const { centerLat, centerLng, zoom } = bounds;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || coords.length < 2) return { url: null as string | null, ...bounds };

  const decimated = decimate(coords, 500);
  const encoded = encodeURIComponent(encodePolyline(decimated));
  const path = `path-3+2563eb-0.9(${encoded})`;
  const [sLat, sLng] = coords[0];
  const startPin = `pin-s+2563eb(${sLng},${sLat})`;
  const mapStyle = dark ? "dark-v11" : "light-v11";
  const url =
    `https://api.mapbox.com/styles/v1/mapbox/${mapStyle}/static/` +
    `${startPin},${path}/${centerLng},${centerLat},${zoom},0,0/${mapW}x${mapH}@2x` +
    `?attribution=false&logo=false&access_token=${token}`;
  return { url, ...bounds };
}

function latLngToPercent(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  mapW: number,
  mapH: number,
) {
  const worldSize = 512 * Math.pow(2, zoom);
  const mercY = (phi: number) => {
    const s = Math.sin((phi * Math.PI) / 180);
    return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * worldSize;
  };
  const px =
    ((lng + 180) / 360) * worldSize -
    ((centerLng + 180) / 360) * worldSize +
    mapW / 2;
  const py = mercY(lat) - mercY(centerLat) + mapH / 2;
  return {
    left: `${((px / mapW) * 100).toFixed(2)}%`,
    top: `${((py / mapH) * 100).toFixed(2)}%`,
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
  showAlbums,
}: {
  coordinates: [number, number][];
  tracks: Track[];
  dark: boolean;
  hoveredCoord: [number, number] | null;
  showAlbums: boolean;
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
      {showAlbums && tracks.map((track, i) => {
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [showAlbums, setShowAlbums] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setSize({ w: quantize(r.width), h: quantize(r.height) });
      }
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!activity.coordinates.length) {
    return (
      <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-2 bg-(--color-bg-subtle)">
        <span className="text-sm font-medium text-(--color-fg)">Pas de tracé GPS</span>
        <span className="text-xs text-(--color-fg-subtle)">Activité indoor ou sur tapis</span>
      </div>
    );
  }

  const mapW = size?.w ?? 800;
  const mapH = size?.h ?? 500;
  const { url, centerLat, centerLng, zoom } = buildMapUrl(activity.coordinates, dark, mapW, mapH);
  const hoveredCoord = hoveredKm != null
    ? (activity.gpsTrace?.length
        ? coordAtKmTrace(activity.gpsTrace, hoveredKm)
        : coordAtKm(activity.coordinates, hoveredKm, activity.distanceKm))
    : null;

  return (
    <div ref={containerRef} className="relative h-full min-h-[280px] w-full overflow-hidden">
      {url && size ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Tracé GPS"
            className="h-full w-full"
            style={
              dark
                ? { filter: "contrast(1.05) brightness(0.9)" }
                : { filter: "grayscale(0.3) contrast(1.1)" }
            }
          />

          {showAlbums && activity.tracks.map((track, i) => {
            const pos = latLngToPercent(track.coordinates[0], track.coordinates[1], centerLat, centerLng, zoom, mapW, mapH);
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
            const pos = latLngToPercent(hoveredCoord[0], hoveredCoord[1], centerLat, centerLng, zoom, mapW, mapH);
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

          <button
            onClick={() => setShowAlbums((v) => !v)}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-(--radius-sm) border px-2 py-1 backdrop-blur-sm transition-colors"
            style={{
              background: showAlbums ? "rgba(37,99,235,0.75)" : "rgba(0,0,0,0.40)",
              borderColor: showAlbums ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.20)",
            }}
            aria-label="Afficher les albums écoutés"
            aria-pressed={showAlbums}
          >
            <div className="h-2 w-2 rounded-full bg-white/90" />
            <span className="font-mono text-2xs text-white/90">Albums écoutés</span>
          </button>
        </>
      ) : (
        <>
          <SvgRoute
            coordinates={activity.coordinates}
            tracks={activity.tracks}
            dark={dark}
            hoveredCoord={hoveredCoord}
            showAlbums={showAlbums}
          />
          <button
            onClick={() => setShowAlbums((v) => !v)}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-(--radius-sm) border px-2 py-1 transition-colors"
            style={{
              background: showAlbums ? "rgba(37,99,235,0.75)" : "rgba(0,0,0,0.40)",
              borderColor: showAlbums ? "rgba(255,255,255,0.40)" : "rgba(255,255,255,0.20)",
            }}
            aria-label="Afficher les albums écoutés"
            aria-pressed={showAlbums}
          >
            <div className="h-2 w-2 rounded-full bg-white/90" />
            <span className="font-mono text-2xs text-white/90">Albums écoutés</span>
          </button>
        </>
      )}
    </div>
  );
}
