import { X } from "lucide-react";

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  return (
    <aside className="flex h-full w-[360px] flex-col border-r border-(--color-border) bg-(--color-bg-subtle)">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-(--color-border) px-4">
        <span className="text-sm font-semibold tracking-[-0.02em] text-(--color-fg)">
          Almanach
        </span>
        <button
          onClick={onClose}
          aria-label="Fermer la sidebar"
          className="flex h-7 w-7 items-center justify-center rounded-[--radius-sm] text-(--color-fg-subtle) hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto" />
    </aside>
  );
}
