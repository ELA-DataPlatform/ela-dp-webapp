import { MetricCard } from "@/components/ui/metric-card";
import { ActivityCard } from "@/components/ui/activity-card";
import { SectionHeader } from "@/components/ui/section-header";
import { TrainingStateCard } from "@/components/ui/training-state-card";
import { HealthCard } from "@/components/ui/health-card";
import { MusicListeningCard, MusicRankingCard } from "@/components/ui/music-card";
import { DailyBriefingCard } from "@/components/ui/daily-briefing-card";

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

// ─── Musique — 10 derniers jours (23/4 → 2/5) ────────────────────────────

// Temps d'écoute quotidien en minutes
const MUSIC_TREND = [
  { day: "23/4", value: 48 },
  { day: "24/4", value: 72 },
  { day: "25/4", value: 35 },
  { day: "26/4", value: 91 },
  { day: "27/4", value: 63 },
  { day: "28/4", value: 55 },
  { day: "29/4", value: 0  },
  { day: "30/4", value: 78 },
  { day: "1/5",  value: 44 },
  { day: "2/5",  value: 66 },
];

const TOP_ARTISTS = [
  { name: "Pink Floyd",                time: "2h 34",  image: "https://picsum.photos/seed/pinkfloyd/28/28",   rankChange: 2     },
  { name: "Radiohead",                 time: "1h 47",  image: "https://picsum.photos/seed/radiohead/28/28",   rankChange: 0     },
  { name: "Bon Iver",                  time: "1h 12",  image: "https://picsum.photos/seed/boniver/28/28",     rankChange: -1    },
  { name: "Nick Cave & The Bad Seeds", time: "58 min", image: "https://picsum.photos/seed/nickcave/28/28",    rankChange: "new" as const },
  { name: "The National",              time: "45 min", image: "https://picsum.photos/seed/thenational/28/28", rankChange: -2    },
];

const TOP_ALBUMS = [
  { name: "OK Computer",               time: "1h 02", image: "https://picsum.photos/seed/okcomputer/28/28", rankChange: 1          },
  { name: "The Dark Side of the Moon", time: "43 min", image: "https://picsum.photos/seed/darkside/28/28",  rankChange: 0          },
  { name: "For Emma, Forever Ago",     time: "38 min", image: "https://picsum.photos/seed/foremma/28/28",   rankChange: -1         },
  { name: "Push the Sky Away",         time: "35 min", image: "https://picsum.photos/seed/pushsky/28/28",   rankChange: "new" as const },
  { name: "High Violet",               time: "31 min", image: "https://picsum.photos/seed/highviolet/28/28", rankChange: 2         },
];

const TOP_TRACKS = [
  { name: "Pyramid Song", time: "1h 08", image: "https://picsum.photos/seed/pyramidsong/28/28", rankChange: 0          },
  { name: "Breathe",      time: "54 min", image: "https://picsum.photos/seed/breathe/28/28",    rankChange: 3          },
  { name: "Holocene",     time: "47 min", image: "https://picsum.photos/seed/holocene/28/28",   rankChange: -1         },
  { name: "Sorrow",       time: "41 min", image: "https://picsum.photos/seed/sorrow/28/28",     rankChange: "new" as const },
  { name: "Into My Arms", time: "35 min", image: "https://picsum.photos/seed/intomyarms/28/28", rankChange: -2         },
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

      <DailyBriefingCard
        className="mb-6 lg:mb-10"
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Votre récupération est excellente ce matin — HRV à 47 ms, soit +3 ms au-dessus de votre moyenne des 10 derniers jours, et un Sleep Score de 80/100. Le Body Battery au réveil (72) est légèrement en dessous de la norme, signe d'une nuit correcte après la charge de la semaine. Votre semaine s'établit à 47,2 km, dans la cible haute de votre plan Maxi-Race (J‑27). C'est une bonne journée pour une séance à intensité modérée : seuil ou tempo court, pas d'effort maximal avant la fenêtre de récupération du week-end."
        metrics={[
          { label: "HRV",          value: "47",  unit: "ms",     delta: "+3 ms vs moy.",  tone: "success" },
          { label: "Sleep Score",  value: "80",  unit: "/ 100",  delta: "+3 pts vs moy.", tone: "success" },
          { label: "Body Battery", value: "72",                  delta: "−11 vs moy.",    tone: "danger"  },
        ]}
      />

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

      <section className="mt-6 lg:mt-8">
        <SectionHeader label="Musique · Spotify" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:auto-rows-[280px]">
          <MusicListeningCard
            trend={MUSIC_TREND}
            totalTime="9h 12"
            delta="+18% vs préc."
            deltaTone="success"
            footer="Temps d'écoute · 10 derniers jours · Spotify"
          />
          <MusicRankingCard
            title="Top Artistes"
            items={TOP_ARTISTS}
            footer="10 derniers jours · Spotify"
          />
          <MusicRankingCard
            title="Top Albums"
            items={TOP_ALBUMS}
            footer="10 derniers jours · Spotify"
          />
          <MusicRankingCard
            title="Top Titres"
            items={TOP_TRACKS}
            footer="10 derniers jours · Spotify"
          />
        </div>
      </section>
    </div>
  );
}
