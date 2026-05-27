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
 * Approximation linéaire par index — suffisant pour positionner un marqueur de hover.
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
