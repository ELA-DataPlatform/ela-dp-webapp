import { MetricCard } from "@/components/ui/metric-card";
import { ActivityCard } from "@/components/ui/activity-card";
import { SectionHeader } from "@/components/ui/section-header";
import { TrainingStateCard } from "@/components/ui/training-state-card";
import { HealthCard } from "@/components/ui/health-card";

// ─── Santé — 10 derniers jours (23/4 → 2/5) ───────────────────────────────

// Sommeil : durée en minutes · moy. 10j ≈ 426 min (7h 06) · aujourd'hui 443 (7h 23)
const SLEEP_TREND = [
  { day: "23/4", value: 390 },
  { day: "24/4", value: 445 },
  { day: "25/4", value: 362 },
  { day: "26/4", value: 478 },
  { day: "27/4", value: 423 },
  { day: "28/4", value: 455 },
  { day: "29/4", value: 390 },
  { day: "30/4", value: 462 },
  { day: "1/5",  value: 430 },
  { day: "2/5",  value: 443 },
];

// HRV matinal en ms · moy. 10j ≈ 43 ms · aujourd'hui 47 ms
const HRV_TREND = [
  { day: "23/4", value: 38 },
  { day: "24/4", value: 44 },
  { day: "25/4", value: 36 },
  { day: "26/4", value: 47 },
  { day: "27/4", value: 43 },
  { day: "28/4", value: 49 },
  { day: "29/4", value: 41 },
  { day: "30/4", value: 46 },
  { day: "1/5",  value: 44 },
  { day: "2/5",  value: 47 },
];

// Sleep Score Garmin : /100 · moy. 10j ≈ 77 · aujourd'hui 80
const SLEEP_SCORE_TREND = [
  { day: "23/4", value: 72 },
  { day: "24/4", value: 81 },
  { day: "25/4", value: 65 },
  { day: "26/4", value: 85 },
  { day: "27/4", value: 76 },
  { day: "28/4", value: 83 },
  { day: "29/4", value: 68 },
  { day: "30/4", value: 79 },
  { day: "1/5",  value: 77 },
  { day: "2/5",  value: 80 },
];

// Body Battery : valeur à l'endormissement (sleep) → au réveil (wake) · 10j
const BATTERY_TREND = [
  { day: "23/4", sleep: 42, wake: 78 },
  { day: "24/4", sleep: 35, wake: 85 },
  { day: "25/4", sleep: 28, wake: 72 },
  { day: "26/4", sleep: 45, wake: 92 },
  { day: "27/4", sleep: 38, wake: 80 },
  { day: "28/4", sleep: 52, wake: 91 },
  { day: "29/4", sleep: 30, wake: 75 },
  { day: "30/4", sleep: 44, wake: 88 },
  { day: "1/5",  sleep: 55, wake: 94 },
  { day: "2/5",  sleep: 48, wake: 72 },
];

// ─── Sport — 14 derniers jours — sem. -1 (index 0-6) + sem. en cours (index 7-13)
// 19/4/2026 = dimanche → S M T W T F S · S M T W T F S
const DAILY_KM_DATA = [
  { day: "19/4", letter: "S", value: 0 },
  { day: "20/4", letter: "M", value: 8.2 },
  { day: "21/4", letter: "T", value: 0 },
  { day: "22/4", letter: "W", value: 12.4 },
  { day: "23/4", letter: "T", value: 6.1 },
  { day: "24/4", letter: "F", value: 0 },
  { day: "25/4", letter: "S", value: 14.2 },
  { day: "26/4", letter: "S", value: 0 },
  { day: "27/4", letter: "M", value: 9.8 },
  { day: "28/4", letter: "T", value: 0 },
  { day: "29/4", letter: "W", value: 12.4 },
  { day: "30/4", letter: "T", value: 7.5 },
  { day: "1/5",  letter: "F", value: 0 },
  { day: "2/5",  letter: "S", value: 17.5 },
];

const LAST_ACTIVITY_STATS = [
  { value: "12.4 km", label: "Distance" },
  { value: "1h 03",   label: "Durée" },
  { value: "5'02\"/km", label: "Allure moy." },
  { value: "152 bpm", label: "FC moy." },
  { value: "+312 m",  label: "Dénivelé +" },
];

export default function HomePage() {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-6 border-b border-(--color-border) pb-4 lg:mb-10 lg:pb-6">
        <h1 className="text-[2rem] font-semibold tracking-[-0.03em] leading-none text-(--color-fg) sm:text-[2.5rem] lg:text-[3rem]">
          Almanach
        </h1>
        <p className="mt-2 text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          {today}
        </p>
      </header>

      <section>
        <SectionHeader label="Sport · Course à pied" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:auto-rows-[280px]">
          <TrainingStateCard
            state="productive"
            metrics={[
              { label: "VO2 Max",    value: "54",  detail: "Stable" },
              { label: "Charge 7j",  value: "450", detail: "Cible 400–500" },
            ]}
            goal="Maxi-Race"
            goalDaysLeft={27}
          />
          <MetricCard
            className="sm:col-span-2"
            title="Kilomètres"
            subtitle="Semaine en cours"
            footer="Sem. -1 grisée · sem. courante en noir · Garmin Connect"
            data={DAILY_KM_DATA}
            unit="km"
            currentValue={47.2}
            previousValue={40.9}
            chartType="bar"
            deltaMode="percent"
            currentWeekStartIndex={7}
          />
          <ActivityCard
            name="Sortie longue"
            date="28 avr. 2026"
            meta="il y a 3 jours"
            stats={LAST_ACTIVITY_STATS}
            coordinates={[
              [48.8566, 2.3522],
              [48.8580, 2.3550],
              [48.8601, 2.3572],
              [48.8623, 2.3558],
              [48.8640, 2.3530],
              [48.8628, 2.3495],
              [48.8607, 2.3470],
              [48.8585, 2.3468],
              [48.8563, 2.3490],
              [48.8566, 2.3522],
            ]}
          />
        </div>
      </section>

      <section className="mt-6 lg:mt-8">
        <SectionHeader label="Santé · Récupération" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:auto-rows-[280px]">
          <HealthCard
            title="Sleep Score"
            avgValue="80 / 100"
            primaryDelta="+3 pts vs moy."
            primaryDeltaTone="success"
            trend={SLEEP_SCORE_TREND}
            footer="Score de sommeil · 10 derniers jours · Garmin Connect"
          />
          <HealthCard
            title="Sommeil"
            avgValue="7h 23"
            primaryDelta="+16 min vs moy."
            primaryDeltaTone="success"
            trend={SLEEP_TREND}
            footer="Durée · 10 derniers jours · Garmin Connect"
          />
          <HealthCard
            title="Récupération"
            avgValue="47 ms"
            primaryDelta="+3 ms vs moy."
            primaryDeltaTone="success"
            trend={HRV_TREND}
            footer="HRV matinal · 10 derniers jours · Garmin Connect"
          />
          <HealthCard
            title="Énergie"
            avgValue="72"
            primaryDelta="−11 vs moy."
            primaryDeltaTone="danger"
            trend={BATTERY_TREND}
            chartType="battery-bar"
            footer="Couché → réveil · 10 derniers jours · Garmin Connect"
          />
        </div>
      </section>
    </div>
  );
}
