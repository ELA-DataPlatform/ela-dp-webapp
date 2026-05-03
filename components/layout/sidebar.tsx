"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

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

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 p-2" aria-label="Navigation principale">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <div key={item.href} className="flex flex-col gap-0.5">
              {item.separator && (
                <hr className="my-1 border-t border-(--color-border)" />
              )}
            <Link
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex h-9 items-center gap-3 rounded-[--radius-sm] px-3",
                "text-sm font-medium transition-colors duration-[--duration-base]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                isActive
                  ? "bg-(--color-accent-bg) text-(--color-accent)"
                  : "text-(--color-fg-muted) hover:bg-(--color-bg-muted) hover:text-(--color-fg)"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
            </div>
          );
        })}
      </nav>

      <div className="flex flex-1 flex-col overflow-y-auto" />
    </aside>
  );
}
