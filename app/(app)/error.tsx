"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="space-y-1">
        <p className="text-sm font-medium text-(--color-fg)">Une erreur est survenue</p>
        <p className="mx-auto max-w-[320px] text-sm text-(--color-fg-muted)">
          Impossible d&apos;afficher cette page. Réessaie, le problème est généralement temporaire.
        </p>
      </div>
      <button
        onClick={reset}
        className="rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg-elevated) px-3 py-2 text-sm font-medium text-(--color-fg) transition-colors hover:bg-(--color-bg-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
      >
        Réessayer
      </button>
    </div>
  );
}
