import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-(--color-border) bg-(--color-bg-subtle)",
        collapsed ? "w-12" : "w-[360px]"
      )}
    >
      <div
        className={cn(
          "flex h-12 shrink-0 items-center border-b border-(--color-border)",
          collapsed ? "justify-center" : "justify-between px-4"
        )}
      >
        {!collapsed && (
          <span className="text-sm font-semibold tracking-[-0.02em] text-(--color-fg)">
            ELA DP
          </span>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Ouvrir la sidebar" : "Fermer la sidebar"}
          className="flex h-7 w-7 items-center justify-center rounded-[--radius-sm] text-(--color-fg-subtle) hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-1 flex-col overflow-y-auto" />
      )}
    </aside>
  );
}
