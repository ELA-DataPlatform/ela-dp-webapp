// coords: [lat, lng][] — format GPS standard (Garmin, GeoJSON inversé)

interface ActivityStat {
  value: string;
  label: string;
}

interface ActivityCardProps {
  name: string;
  date: string;
  meta?: string;
  stats: ActivityStat[];
  coordinates?: [number, number][];
}

// Google Polyline Algorithm
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
  let prevLat = 0, prevLng = 0, result = "";
  for (const [lat, lng] of coords) {
    const dlat = Math.round((lat - prevLat) * 1e5);
    const dlng = Math.round((lng - prevLng) * 1e5);
    result += encodePolylineValue(dlat) + encodePolylineValue(dlng);
    prevLat = lat;
    prevLng = lng;
  }
  return result;
}

function buildMapboxUrl(coords: [number, number][]): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || coords.length < 2) return null;

  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calcul zoom depuis la bounding box (tuiles 512px, padding ~40px de chaque côté)
  const lngSpan = (maxLng - minLng) || 0.001;
  const latSpan = (maxLat - minLat) || 0.001;
  const zoom = Math.max(1, Math.floor(Math.min(
    Math.log2((720 / lngSpan) * (360 / 512)),
    Math.log2((320 / latSpan) * (170 / 512)),
  )));

  const encoded = encodeURIComponent(encodePolyline(coords));
  const path = `path-3+2563eb-0.9(${encoded})`;
  const [startLat, startLng] = coords[0];
  const startPin = `pin-s+2563eb(${startLng},${startLat})`;

  // bearing=0 (nord en haut), pitch=0 (vue strictement zénithale)
  return (
    `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/` +
    `${startPin},${path}/${centerLng},${centerLat},${zoom},0,0/800x400@2x` +
    `?attribution=false&logo=false&access_token=${token}`
  );
}

function RouteMap({ coordinates }: { coordinates?: [number, number][] }) {
  const mapboxUrl = coordinates ? buildMapboxUrl(coordinates) : null;

  if (mapboxUrl) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-(--color-bg-subtle)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mapboxUrl}
          alt="Tracé GPS"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "grayscale(0.3) contrast(1.1)" }}
        />
      </div>
    );
  }

  // Fallback SVG tant que pas de token ou de données
  return (
    <div className="relative h-full w-full overflow-hidden bg-(--color-bg-subtle)">
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="400" height="200" fill="oklch(0.965 0 0)" />
        <line x1="0" y1="100" x2="400" y2="100" stroke="oklch(0.88 0 0)" strokeWidth="6" />
        <line x1="200" y1="0" x2="200" y2="200" stroke="oklch(0.88 0 0)" strokeWidth="5" />
        <line x1="0" y1="55" x2="400" y2="55" stroke="oklch(0.91 0 0)" strokeWidth="3" />
        <line x1="0" y1="145" x2="400" y2="145" stroke="oklch(0.91 0 0)" strokeWidth="3" />
        <line x1="0" y1="28" x2="400" y2="28" stroke="oklch(0.93 0 0)" strokeWidth="2" />
        <line x1="0" y1="172" x2="400" y2="172" stroke="oklch(0.93 0 0)" strokeWidth="2" />
        <line x1="100" y1="0" x2="100" y2="200" stroke="oklch(0.91 0 0)" strokeWidth="3" />
        <line x1="300" y1="0" x2="300" y2="200" stroke="oklch(0.91 0 0)" strokeWidth="3" />
        <line x1="50" y1="0" x2="50" y2="200" stroke="oklch(0.93 0 0)" strokeWidth="2" />
        <line x1="150" y1="0" x2="150" y2="200" stroke="oklch(0.93 0 0)" strokeWidth="2" />
        <line x1="250" y1="0" x2="250" y2="200" stroke="oklch(0.93 0 0)" strokeWidth="2" />
        <line x1="350" y1="0" x2="350" y2="200" stroke="oklch(0.93 0 0)" strokeWidth="2" />
        <line x1="0" y1="160" x2="280" y2="40" stroke="oklch(0.89 0 0)" strokeWidth="4" />
        <line x1="160" y1="0" x2="400" y2="130" stroke="oklch(0.91 0 0)" strokeWidth="3" />
        <rect x="10" y="34" width="35" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="10" y="60" width="28" height="36" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="55" y="34" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="55" y="60" width="40" height="36" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="10" y="106" width="35" height="35" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="55" y="106" width="40" height="35" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="10" y="150" width="35" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="55" y="150" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="105" y="34" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="105" y="60" width="40" height="36" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="155" y="60" width="40" height="36" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="105" y="106" width="40" height="35" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="155" y="106" width="40" height="35" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="105" y="150" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="205" y="34" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="205" y="60" width="40" height="36" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="255" y="34" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="255" y="60" width="40" height="36" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="205" y="106" width="40" height="35" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="255" y="106" width="40" height="35" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="205" y="150" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="255" y="150" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="305" y="34" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="305" y="60" width="40" height="36" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="355" y="60" width="35" height="36" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="305" y="106" width="40" height="35" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="355" y="106" width="35" height="35" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="305" y="150" width="40" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="355" y="150" width="35" height="18" rx="1" fill="oklch(0.94 0 0)" />
        <rect x="155" y="34" width="40" height="18" rx="2" fill="oklch(0.91 0.02 145)" opacity="0.5" />
      </svg>
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 h-full w-full"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M 80 148 L 80 100 L 100 100 L 100 55 L 150 55 L 150 100 L 200 100 L 200 55 L 250 55 L 250 100 L 300 100 L 300 55 L 320 40 L 300 55 L 300 100 L 250 100 L 250 145 L 200 145 L 200 100 L 150 100 L 150 145 L 100 145 L 100 148 Z"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          opacity="0.9"
        />
        <circle cx="80" cy="148" r="4" fill="var(--color-accent)" />
        <circle cx="80" cy="148" r="7" stroke="var(--color-accent)" strokeWidth="1.5" opacity="0.35" />
      </svg>
    </div>
  );
}

export function ActivityCard({ name, date, meta, stats, coordinates }: ActivityCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[--radius-md] border border-(--color-border) bg-(--color-bg-elevated)">
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-(--color-border)">
        <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          Dernière activité
        </span>
        <p className="mt-1.5 text-sm font-medium text-(--color-fg)">{name}</p>
        <p className="mt-0.5 text-2xs text-(--color-fg-subtle)">
          {date}{meta && <span> · {meta}</span>}
        </p>
      </div>

      <div className="min-h-[160px] flex-1 shrink-0 border-b border-(--color-border)">
        <RouteMap coordinates={coordinates} />
      </div>

      <div className="shrink-0">
        <div className="grid grid-cols-2">
          {stats.slice(0, 4).map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col justify-center px-4 py-3"
            >
              <p className="font-mono text-sm font-medium tabular-nums text-(--color-fg)">
                {stat.value}
              </p>
              <p className="mt-0.5 text-2xs text-(--color-fg-subtle)">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
