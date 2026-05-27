import { Card, CardHeader } from "./card";
import { fmtMmSs } from "./utils";
import type { Track } from "./mock-data";

export function MusicTimeline({ tracks }: { tracks: Track[] }) {
  const totalMin = Math.round(tracks.reduce((s, t) => s + t.durationSec, 0) / 60);

  return (
    <Card>
      <CardHeader label="Musique" meta={`${tracks.length} titres · ${totalMin} min`} />

      <div className="divide-y divide-(--color-border)">
        {tracks.map((t, i) => (
          <div
            key={i}
            className="grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-(--color-bg-muted) sm:px-5"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-(--radius-sm) text-sm font-semibold text-white"
              style={{ background: t.albumColor }}
            >
              {t.artistName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-(--color-fg)">{t.trackName}</div>
              <div className="mt-0.5 truncate text-xs text-(--color-fg-subtle)">
                {t.artistName} · {t.albumName}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="font-mono text-xs font-medium tabular-nums text-(--color-fg)">
                km {t.startAtKm.toFixed(1)}
              </div>
              <div className="mt-0.5 font-mono text-xs tabular-nums text-(--color-fg-subtle)">
                {fmtMmSs(t.durationSec)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
