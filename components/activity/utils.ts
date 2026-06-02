export function fmtPace(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}'${s.toString().padStart(2, "0")}"`;
}

export function fmtDurationHm(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, "0")}` : `${m} min`;
}

export function fmtMmSs(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function fmtHmsCompact(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, "0")}`;
  return `${m}'${s.toString().padStart(2, "0")}"`;
}

export type DeltaTone = "success" | "danger" | "neutral";

/**
 * Format a numeric delta with a sign and a semantic tone.
 * `betterWhen` controls which direction is "good" :
 *  - "lower" → un nombre négatif est meilleur (ex: allure en sec/km)
 *  - "higher" → un nombre positif est meilleur (ex: distance)
 */
export function fmtDelta(
  value: number,
  opts: { suffix?: string; betterWhen?: "lower" | "higher"; decimals?: number } = {}
): { label: string; tone: DeltaTone } {
  const { suffix = "", betterWhen = "higher", decimals = 0 } = opts;
  if (Math.abs(value) < 0.05) return { label: `±0${suffix}`, tone: "neutral" };
  const sign = value > 0 ? "+" : "−";
  const abs = Math.abs(value).toFixed(decimals);
  const isGood = (betterWhen === "higher" && value > 0) || (betterWhen === "lower" && value < 0);
  return { label: `${sign}${abs}${suffix}`, tone: isGood ? "success" : "danger" };
}

/**
 * Interpolate a coordinate on a polyline at a given cumulative distance.
 * Fallback linéaire par index — utilisé uniquement si gpsTrace est absent.
 */
export function coordAtKm(
  coords: [number, number][],
  km: number,
  totalKm: number
): [number, number] {
  if (coords.length === 0) return [0, 0];
  if (km <= 0) return coords[0];
  if (km >= totalKm) return coords[coords.length - 1];
  const idx = (km / totalKm) * (coords.length - 1);
  const i = Math.floor(idx);
  const frac = idx - i;
  if (i >= coords.length - 1) return coords[coords.length - 1];
  const [lat1, lng1] = coords[i];
  const [lat2, lng2] = coords[i + 1];
  return [lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac];
}

/** Haversine distance in km between two lat/lon points. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Build a GPS trace with cumulative distances from a raw polyline (lat/lon only).
 * Cumulative distances are computed via Haversine — no dependency on distance fields.
 */
export function buildGpsTrace(
  polyline: [number, number][]
): Array<{ distKm: number; lat: number; lon: number }> {
  if (!polyline.length) return [];
  const trace: Array<{ distKm: number; lat: number; lon: number }> = [];
  let cumDist = 0;
  trace.push({ distKm: 0, lat: polyline[0][0], lon: polyline[0][1] });
  for (let i = 1; i < polyline.length; i++) {
    const [lat1, lon1] = polyline[i - 1];
    const [lat2, lon2] = polyline[i];
    cumDist += haversineKm(lat1, lon1, lat2, lon2);
    trace.push({ distKm: cumDist, lat: lat2, lon: lon2 });
  }
  return trace;
}

/**
 * Interpolate a coordinate using the timeseries GPS trace (exact cumulative distances).
 * Binary search on distKm — accurate regardless of point density variation.
 */
export function coordAtKmTrace(
  trace: Array<{ distKm: number; lat: number; lon: number }>,
  km: number
): [number, number] {
  if (!trace.length) return [0, 0];
  if (km <= trace[0].distKm) return [trace[0].lat, trace[0].lon];
  if (km >= trace[trace.length - 1].distKm) return [trace[trace.length - 1].lat, trace[trace.length - 1].lon];
  let lo = 0, hi = trace.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (trace[mid].distKm <= km) lo = mid;
    else hi = mid;
  }
  const a = trace[lo], b = trace[hi];
  const t = (km - a.distKm) / (b.distKm - a.distKm);
  return [a.lat + (b.lat - a.lat) * t, a.lon + (b.lon - a.lon) * t];
}
