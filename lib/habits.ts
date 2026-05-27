export interface HabitEntry {
  date: string;
  mood: number | null;
  productivity: number | null;
  ate_well: boolean | null;
  alcohol: boolean | null;
  screens_before_bed: boolean | null;
}

export type HabitStore = Record<string, HabitEntry>;

const STORAGE_KEY = "ela-habits-v1";

export function emptyEntry(date: string): HabitEntry {
  return {
    date,
    mood: null,
    productivity: null,
    ate_well: null,
    alcohol: null,
    screens_before_bed: null,
  };
}

export function loadStore(): HabitStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HabitStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStore(store: HabitStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + n);
  return toLocalISODate(d);
}

export function isComplete(entry: HabitEntry | undefined): boolean {
  if (!entry) return false;
  return (
    entry.mood !== null &&
    entry.productivity !== null &&
    entry.ate_well !== null &&
    entry.alcohol !== null &&
    entry.screens_before_bed !== null
  );
}

export function hasAnyValue(entry: HabitEntry | undefined): boolean {
  if (!entry) return false;
  return (
    entry.mood !== null ||
    entry.productivity !== null ||
    entry.ate_well !== null ||
    entry.alcohol !== null ||
    entry.screens_before_bed !== null
  );
}

export function avgMood(store: HabitStore, days: number, today: string): number | null {
  const values: number[] = [];
  for (let i = 0; i < days; i++) {
    const e = store[addDays(today, -i)];
    if (e?.mood != null) values.push(e.mood);
  }
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function currentStreak(store: HabitStore, today: string): number {
  let streak = 0;
  let cursor = today;
  if (!hasAnyValue(store[cursor])) cursor = addDays(cursor, -1);
  while (hasAnyValue(store[cursor])) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function filledCount(store: HabitStore, days: number, today: string): number {
  let count = 0;
  for (let i = 0; i < days; i++) {
    if (hasAnyValue(store[addDays(today, -i)])) count += 1;
  }
  return count;
}
