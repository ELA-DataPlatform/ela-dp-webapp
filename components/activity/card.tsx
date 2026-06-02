import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-bg-elevated)",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  label,
  meta,
  action,
  className,
}: {
  label: string;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-9 items-center justify-between gap-3 border-b border-(--color-border) bg-(--color-bg-subtle) px-4 sm:px-5",
        className
      )}
    >
      <span className="text-2xs font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {label}
      </span>
      <div className="flex items-center gap-3">
        {meta && (
          <span className="font-mono text-2xs tabular-nums text-(--color-fg-subtle)">
            {meta}
          </span>
        )}
        {action}
      </div>
    </div>
  );
}
