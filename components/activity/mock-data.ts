export interface ChartPoint {
  distKm: number;
  paceSecPerKm: number;
  gapSecPerKm: number;
  hrBpm: number;
  cadenceSpm: number;
  elevM: number;
}

export interface Lap {
  km: number;
  paceSecPerKm: number;
  gapSecPerKm: number;
  hrBpm: number;
  cadenceSpm: number;
  elevGainM: number;
}

export type SegmentKind = "warmup" | "interval" | "recovery" | "cooldown";

export interface Segment {
  id: number;
  kind: SegmentKind;
  name: string;
  startKm: number;
  endKm: number;
  distanceKm: number;
  durationSec: number;
  avgPaceSec: number;
  avgHrBpm: number;
  avgCadenceSpm: number;
}

export interface Track {
  startAtKm: number;
  durationSec: number;
  trackName: string;
  artistName: string;
  albumName: string;
  albumColor: string;
  coordinates: [number, number];
}

export interface HRZone {
  zone: 1 | 2 | 3 | 4 | 5;
  label: string;
  minBpm: number;
  maxBpm: number;
  timeSec: number;
}

export interface HistoricalActivity {
  id: number;
  dateDisplay: string;
  distanceKm: number;
  durationSec: number;
  avgPaceSec: number;
  avgHrBpm: number;
  isPB?: boolean;
}

export interface ActivityConditions {
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windKmh: number;
  windDir: string;
  weatherLabel: string;
  shoeName: string;
  shoeTotalKm: number;
  rpe: number;
}

export interface ActivityDetail {
  id: number;
  title: string;
  type: "run" | "trail" | "bike";
  typeLabel: string;
  dateDisplay: string;
  startTimeLocal: string;
  distanceKm: number;
  durationSec: number;
  elevGainM: number;
  elevLossM: number;
  paceSecPerKm: number;
  gapSecPerKm: number;
  avgHrBpm: number;
  maxHrBpm: number;
  hrMax: number;
  cadenceAvg: number;
  caloriesKcal: number;
  trainingLoad: number;
  aerobicLoad: number;
  anaerobicLoad: number;
  decouplingPct: number;
  coordinates: [number, number][];
  chartData: ChartPoint[];
  laps: Lap[];
  segments: Segment[];
  tracks: Track[];
  hrZones: HRZone[];
  history: HistoricalActivity[];
  conditions: ActivityConditions;
  deltas: {
    distancePct: number;
    paceSec: number;
    hrBpm: number;
    loadPct: number;
  };
}

const GPS_TRACE: [number, number][] = [
  [47.6582, -2.7590], [47.6558, -2.7568], [47.6533, -2.7542], [47.6505, -2.7512],
  [47.6483, -2.7478], [47.6466, -2.7442], [47.6458, -2.7403], [47.6462, -2.7365],
  [47.6480, -2.7330], [47.6508, -2.7308], [47.6538, -2.7295], [47.6565, -2.7300],
  [47.6590, -2.7315], [47.6610, -2.7348], [47.6624, -2.7388], [47.6630, -2.7430],
  [47.6622, -2.7468], [47.6615, -2.7505], [47.6618, -2.7542], [47.6608, -2.7568],
  [47.6596, -2.7578], [47.6582, -2.7590],
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
    const cadence = 174 + Math.sin(i * 0.4) * 3 + Math.sin(t * Math.PI * 1.5) * 2;
    // GAP : ajuste l'allure en fonction de la pente locale — montée plus rapide en GAP
    const slopeFactor = Math.sin(t * Math.PI * 2.8) * 0.05;
    const gap = pace - pace * slopeFactor;
    pts.push({
      distKm: dist,
      paceSecPerKm: Math.max(265, Math.min(385, Math.round(pace))),
      gapSecPerKm: Math.max(260, Math.min(380, Math.round(gap))),
      hrBpm: Math.max(128, Math.min(178, Math.round(hr))),
      cadenceSpm: Math.round(cadence),
      elevM: Math.max(5, Math.round(elev)),
    });
  }
  return pts;
}

const CHART_DATA = generateChartData();

// Segments d'une séance type fractionné : échauffement + 4×(1km tempo / 0,5km récup) + retour calme
const SEGMENTS: Segment[] = [
  { id: 1, kind: "warmup",   name: "Échauffement",    startKm: 0.0,  endKm: 3.0,  distanceKm: 3.0, durationSec: 990, avgPaceSec: 330, avgHrBpm: 138, avgCadenceSpm: 172 },
  { id: 2, kind: "interval", name: "Intervalle 1",    startKm: 3.0,  endKm: 4.0,  distanceKm: 1.0, durationSec: 255, avgPaceSec: 255, avgHrBpm: 168, avgCadenceSpm: 182 },
  { id: 3, kind: "recovery", name: "Récup 1",         startKm: 4.0,  endKm: 4.5,  distanceKm: 0.5, durationSec: 173, avgPaceSec: 346, avgHrBpm: 142, avgCadenceSpm: 172 },
  { id: 4, kind: "interval", name: "Intervalle 2",    startKm: 4.5,  endKm: 5.5,  distanceKm: 1.0, durationSec: 258, avgPaceSec: 258, avgHrBpm: 171, avgCadenceSpm: 183 },
  { id: 5, kind: "recovery", name: "Récup 2",         startKm: 5.5,  endKm: 6.0,  distanceKm: 0.5, durationSec: 175, avgPaceSec: 350, avgHrBpm: 144, avgCadenceSpm: 173 },
  { id: 6, kind: "interval", name: "Intervalle 3",    startKm: 6.0,  endKm: 7.0,  distanceKm: 1.0, durationSec: 261, avgPaceSec: 261, avgHrBpm: 172, avgCadenceSpm: 184 },
  { id: 7, kind: "recovery", name: "Récup 3",         startKm: 7.0,  endKm: 7.5,  distanceKm: 0.5, durationSec: 180, avgPaceSec: 360, avgHrBpm: 145, avgCadenceSpm: 173 },
  { id: 8, kind: "interval", name: "Intervalle 4",    startKm: 7.5,  endKm: 8.5,  distanceKm: 1.0, durationSec: 264, avgPaceSec: 264, avgHrBpm: 174, avgCadenceSpm: 184 },
  { id: 9, kind: "cooldown", name: "Retour au calme", startKm: 8.5,  endKm: 12.4, distanceKm: 3.9, durationSec: 1188, avgPaceSec: 305, avgHrBpm: 134, avgCadenceSpm: 170 },
];

const LAPS: Lap[] = [
  { km: 1,  paceSecPerKm: 322, gapSecPerKm: 318, hrBpm: 142, cadenceSpm: 172, elevGainM: 9   },
  { km: 2,  paceSecPerKm: 316, gapSecPerKm: 312, hrBpm: 148, cadenceSpm: 174, elevGainM: 13  },
  { km: 3,  paceSecPerKm: 309, gapSecPerKm: 302, hrBpm: 152, cadenceSpm: 175, elevGainM: 20  },
  { km: 4,  paceSecPerKm: 318, gapSecPerKm: 308, hrBpm: 158, cadenceSpm: 176, elevGainM: 23  },
  { km: 5,  paceSecPerKm: 326, gapSecPerKm: 316, hrBpm: 162, cadenceSpm: 175, elevGainM: 17  },
  { km: 6,  paceSecPerKm: 304, gapSecPerKm: 309, hrBpm: 158, cadenceSpm: 177, elevGainM: -15 },
  { km: 7,  paceSecPerKm: 300, gapSecPerKm: 304, hrBpm: 154, cadenceSpm: 178, elevGainM: -9  },
  { km: 8,  paceSecPerKm: 296, gapSecPerKm: 294, hrBpm: 153, cadenceSpm: 178, elevGainM: 11  },
  { km: 9,  paceSecPerKm: 301, gapSecPerKm: 296, hrBpm: 155, cadenceSpm: 177, elevGainM: 19  },
  { km: 10, paceSecPerKm: 294, gapSecPerKm: 298, hrBpm: 153, cadenceSpm: 178, elevGainM: -14 },
  { km: 11, paceSecPerKm: 304, gapSecPerKm: 302, hrBpm: 150, cadenceSpm: 176, elevGainM: 6   },
  { km: 12, paceSecPerKm: 307, gapSecPerKm: 305, hrBpm: 148, cadenceSpm: 175, elevGainM: -7  },
];

const TRACKS: Track[] = [
  { startAtKm: 0.5,  durationSec: 248, trackName: "Running Up That Hill",      artistName: "Kate Bush",                albumName: "Hounds of Love",       albumColor: "oklch(0.52 0.18 30)",  coordinates: [47.6558, -2.7568] },
  { startAtKm: 2.0,  durationSec: 243, trackName: "Titanium",                  artistName: "David Guetta ft. Sia",     albumName: "Nothing but the Beat", albumColor: "oklch(0.48 0.20 255)", coordinates: [47.6483, -2.7478] },
  { startAtKm: 3.8,  durationSec: 224, trackName: "Harder Better Faster",      artistName: "Daft Punk",                albumName: "Discovery",            albumColor: "oklch(0.52 0.18 145)", coordinates: [47.6462, -2.7365] },
  { startAtKm: 5.8,  durationSec: 262, trackName: "Born to Run",               artistName: "Bruce Springsteen",        albumName: "Born to Run",          albumColor: "oklch(0.42 0.10 50)",  coordinates: [47.6590, -2.7315] },
  { startAtKm: 7.5,  durationSec: 245, trackName: "Eye of the Tiger",          artistName: "Survivor",                 albumName: "Eye of the Tiger",     albumColor: "oklch(0.55 0.19 60)",  coordinates: [47.6630, -2.7430] },
  { startAtKm: 10.0, durationSec: 257, trackName: "Can't Hold Us",             artistName: "Macklemore & Ryan Lewis",  albumName: "The Heist",            albumColor: "oklch(0.32 0.08 250)", coordinates: [47.6596, -2.7578] },
];

// 63 min total = 3780 s. Distribution typique d'une sortie longue en endurance fondamentale + tempo.
const HR_ZONES: HRZone[] = [
  { zone: 1, label: "Récup",     minBpm: 95,  maxBpm: 126, timeSec: 240  },
  { zone: 2, label: "Endurance", minBpm: 126, maxBpm: 144, timeSec: 720  },
  { zone: 3, label: "Tempo",     minBpm: 144, maxBpm: 162, timeSec: 1920 },
  { zone: 4, label: "Seuil",     minBpm: 162, maxBpm: 171, timeSec: 720  },
  { zone: 5, label: "VO2max",    minBpm: 171, maxBpm: 180, timeSec: 180  },
];

const HISTORY: HistoricalActivity[] = [
  { id: 99, dateDisplay: "21 avr.", distanceKm: 12.5, durationSec: 3960, avgPaceSec: 317, avgHrBpm: 156 },
  { id: 98, dateDisplay: "14 avr.", distanceKm: 12.2, durationSec: 3744, avgPaceSec: 307, avgHrBpm: 154 },
  { id: 97, dateDisplay: "07 avr.", distanceKm: 13.1, durationSec: 4053, avgPaceSec: 309, avgHrBpm: 152, isPB: true },
  { id: 96, dateDisplay: "31 mars", distanceKm: 12.0, durationSec: 3768, avgPaceSec: 314, avgHrBpm: 158 },
  { id: 95, dateDisplay: "24 mars", distanceKm: 12.8, durationSec: 4044, avgPaceSec: 316, avgHrBpm: 157 },
];

export const MOCK_ACTIVITY: ActivityDetail = {
  id: 1,
  title: "Fractionné — Vannes",
  type: "run",
  typeLabel: "Course",
  dateDisplay: "Lundi 28 avril 2026",
  startTimeLocal: "07h12",
  distanceKm: 12.4,
  durationSec: 3744,
  elevGainM: 124,
  elevLossM: 98,
  paceSecPerKm: 302,
  gapSecPerKm: 298,
  avgHrBpm: 152,
  maxHrBpm: 174,
  hrMax: 188,
  cadenceAvg: 176,
  caloriesKcal: 742,
  trainingLoad: 87,
  aerobicLoad: 65,
  anaerobicLoad: 22,
  decouplingPct: 4.2,
  coordinates: GPS_TRACE,
  chartData: CHART_DATA,
  laps: LAPS,
  segments: SEGMENTS,
  tracks: TRACKS,
  hrZones: HR_ZONES,
  history: HISTORY,
  conditions: {
    tempC: 11,
    feelsLikeC: 8,
    humidityPct: 78,
    windKmh: 12,
    windDir: "NO",
    weatherLabel: "Couvert",
    shoeName: "Saucony Endorphin Pro 3",
    shoeTotalKm: 312,
    rpe: 6,
  },
  deltas: {
    distancePct: 3,
    paceSec: -8,
    hrBpm: -2,
    loadPct: 12,
  },
};

export const MOCK_VERDICT = {
  tldr: "Sortie longue maîtrisée avec un négatif split franc et une dérive cardiaque maîtrisée à 4,2 %.",
  strengths: [
    "Négatif split : 5'12\"/km sur la moitié 1, 4'58\"/km sur la moitié 2.",
    "Cadence stable à 176 spm sur toute la séance — bonne économie de foulée.",
    "Récupération cardiaque active : retour sous 158 bpm en moins d'1 km après le pic.",
  ],
  watch: [
    "Léger ralentissement km 11-12 (+13 s/km) sans hausse de FC — signe de fatigue neuromusculaire.",
    "Pic FC en zone 5 brièvement aux km 4-5 sur la portion à +40 m de D+ — anticiper la cadence en montée.",
  ],
  recommendations: [
    "Conserver ce découpage d'allure pour les prochaines sorties longues.",
    "Au-delà de 15 km, prévoir une nutrition glucidique entre km 9 et 11.",
    "Tester une foulée légèrement plus rapide (178-180 spm) en montée pour limiter la stagnation cardiaque.",
  ],
};
