export interface ChartContent {
  type: "chart";
  chartType: "line" | "bar";
  title: string;
  subtitle?: string;
  data: Record<string, string | number>[];
  series: { key: string; label: string; color: string }[];
  xKey: string;
  yFormatter?: "pace" | "percent";
  reversed?: boolean;
  height?: number;
}

export type ContentBlock = { type: "text"; text: string } | ChartContent;

export interface Message {
  id: string;
  role: "user" | "assistant";
  blocks: ContentBlock[];
  timestamp: string;
}

// Utilisé dans la sidebar et la page (données BQ ou locales)
export interface ConvItem {
  id: string;
  title: string;
  updatedAt: string;
  isLocal?: boolean; // true = pas encore persisté en BQ
}

// Garde la compatibilité pour les mock data ci-dessous
export interface Conversation extends ConvItem {
  preview: string;
  messages: Message[];
}

// ── Mock chart data ────────────────────────────────────────────────

const WEEKLY_DISTANCE = [
  { week: "S-8", km: 38 },
  { week: "S-7", km: 42 },
  { week: "S-6", km: 35 },
  { week: "S-5", km: 47 },
  { week: "S-4", km: 51 },
  { week: "S-3", km: 44 },
  { week: "S-2", km: 39 },
  { week: "S-1", km: 52 },
];

const WEEKLY_PACE = [
  { week: "S-8", pace: 312 },
  { week: "S-7", pace: 308 },
  { week: "S-6", pace: 318 },
  { week: "S-5", pace: 305 },
  { week: "S-4", pace: 298 },
  { week: "S-3", pace: 302 },
  { week: "S-2", pace: 315 },
  { week: "S-1", pace: 295 },
];

const HR_ZONES = [
  { zone: "Z1", pct: 5 },
  { zone: "Z2", pct: 42 },
  { zone: "Z3", pct: 28 },
  { zone: "Z4", pct: 18 },
  { zone: "Z5", pct: 7 },
];

// ── Mock conversations ─────────────────────────────────────────────

const now = Date.now();
const min = 60_000;
const hr = 3_600_000;
const day = 86_400_000;

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    title: "Analyse de ma semaine",
    preview: "Quelle est la répartition de mes zones cardiaques ?",
    updatedAt: new Date(now - 1 * min).toISOString(),
    messages: [
      {
        id: "m1",
        role: "user",
        blocks: [
          {
            type: "text",
            text: "Montre-moi l'évolution de mes distances hebdomadaires sur les 2 derniers mois.",
          },
        ],
        timestamp: new Date(now - 15 * min).toISOString(),
      },
      {
        id: "m2",
        role: "assistant",
        blocks: [
          {
            type: "text",
            text: "Sur les 8 dernières semaines, ta charge d'entraînement est en **progression nette**. Tu passes de **38 km** en S-8 à **52 km** la semaine dernière, soit **+37 %**. Les semaines S-6 et S-2 montrent une légère baisse — ce sont tes semaines de récupération planifiées, signe d'une bonne gestion de charge.",
          },
          {
            type: "chart",
            chartType: "bar",
            title: "Distance hebdomadaire",
            subtitle: "8 dernières semaines · km",
            data: WEEKLY_DISTANCE,
            series: [{ key: "km", label: "Distance", color: "var(--color-fg)" }],
            xKey: "week",
            height: 200,
          },
        ],
        timestamp: new Date(now - 14 * min).toISOString(),
      },
      {
        id: "m3",
        role: "user",
        blocks: [
          { type: "text", text: "Mon allure s'améliore-t-elle ? Montre-moi la tendance." },
        ],
        timestamp: new Date(now - 10 * min).toISOString(),
      },
      {
        id: "m4",
        role: "assistant",
        blocks: [
          {
            type: "text",
            text: "Oui, la tendance est clairement à l'amélioration. En S-8 tu courais à **5'12\"/km** en moyenne ; la semaine dernière tu es descendu à **4'55\"/km**. La trajectoire est régulière malgré les semaines de récupération. Tu es en bonne voie pour passer sous les **4'50\"** dans les prochaines semaines.",
          },
          {
            type: "chart",
            chartType: "line",
            title: "Allure moyenne hebdomadaire",
            subtitle: "8 dernières semaines · min/km",
            data: WEEKLY_PACE,
            series: [{ key: "pace", label: "Allure", color: "var(--color-fg)" }],
            xKey: "week",
            yFormatter: "pace",
            reversed: true,
            height: 200,
          },
        ],
        timestamp: new Date(now - 8 * min).toISOString(),
      },
      {
        id: "m5",
        role: "user",
        blocks: [
          { type: "text", text: "Quelle est la répartition de mes zones cardiaques ?" },
        ],
        timestamp: new Date(now - 3 * min).toISOString(),
      },
      {
        id: "m6",
        role: "assistant",
        blocks: [
          {
            type: "text",
            text: "Tu as une base aérobie solide : **47 %** du temps en Z1-Z2, idéal pour construire l'endurance fondamentale. La Z2 à **42 %** est le cœur de ton entraînement. L'exposition à l'intensité (Z4-Z5 : **25 %** au total) est équilibrée — profil sain pour un coureur de fond.",
          },
          {
            type: "chart",
            chartType: "bar",
            title: "Répartition zones cardiaques",
            subtitle: "8 dernières semaines · % du temps total",
            data: HR_ZONES,
            series: [{ key: "pct", label: "% temps", color: "var(--color-fg)" }],
            xKey: "zone",
            yFormatter: "percent",
            height: 180,
          },
        ],
        timestamp: new Date(now - 1 * min).toISOString(),
      },
    ],
  },
  {
    id: "conv-2",
    title: "Évolution VO2max",
    preview: "Comment interpréter mes données VO2max ?",
    updatedAt: new Date(now - 3 * hr).toISOString(),
    messages: [],
  },
  {
    id: "conv-3",
    title: "Comparaison courses montagne",
    preview: "Quelle différence entre plat et dénivelé ?",
    updatedAt: new Date(now - 25 * hr).toISOString(),
    messages: [],
  },
  {
    id: "conv-4",
    title: "Préparation semi-marathon",
    preview: "Suis-je prêt pour Paris en octobre ?",
    updatedAt: new Date(now - 3 * day).toISOString(),
    messages: [],
  },
  {
    id: "conv-5",
    title: "Tendances musicales running",
    preview: "Quel BPM pour mon prochain interval ?",
    updatedAt: new Date(now - 5 * day).toISOString(),
    messages: [],
  },
];
