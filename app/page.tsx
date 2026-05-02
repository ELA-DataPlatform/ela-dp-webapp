import { MetricCard } from "@/components/ui/metric-card";
import { ActivityCard } from "@/components/ui/activity-card";
import { SectionHeader } from "@/components/ui/section-header";
import { TrainingStateCard } from "@/components/ui/training-state-card";

// 14 derniers jours — sem. -1 (index 0-6) + sem. en cours (index 7-13)
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
  return (
    <div className="p-8">
      <section>
        <SectionHeader label="Sport · Course à pied" />
        <div className="grid grid-cols-[1fr_2fr_1fr] gap-4">
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
    </div>
  );
}
