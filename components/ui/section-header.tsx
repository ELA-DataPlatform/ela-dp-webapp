interface SectionHeaderProps {
  label: string;
  count?: string;
}

export function SectionHeader({ label, count }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
        {label}
      </span>
      {count && (
        <span className="font-mono text-[11px] tabular-nums text-(--color-fg-subtle)">
          {count}
        </span>
      )}
    </div>
  );
}
