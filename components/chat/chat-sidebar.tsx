"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConvItem } from "./mock-data";

interface Props {
  conversations: ConvItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  isLoading?: boolean;
}

function groupByDate(conversations: ConvItem[]) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const weekStart = new Date(todayStart.getTime() - 7 * 86_400_000);

  const groups: { label: string; items: ConvItem[] }[] = [
    { label: "Aujourd'hui", items: [] },
    { label: "Hier", items: [] },
    { label: "7 derniers jours", items: [] },
    { label: "Plus ancien", items: [] },
  ];

  for (const conv of conversations) {
    const t = new Date(conv.updatedAt).getTime();
    if (t >= todayStart.getTime()) groups[0].items.push(conv);
    else if (t >= yesterdayStart.getTime()) groups[1].items.push(conv);
    else if (t >= weekStart.getTime()) groups[2].items.push(conv);
    else groups[3].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

function Skeleton() {
  return (
    <div className="px-4 py-2 space-y-3 mt-2">
      {[80, 60, 72].map((w, i) => (
        <div key={i} className="space-y-1.5">
          <div
            className="h-3 rounded-sm bg-(--color-bg-muted)"
            style={{ width: `${w}%` }}
          />
          <div className="h-2.5 w-1/2 rounded-sm bg-(--color-bg-muted)" />
        </div>
      ))}
    </div>
  );
}

export function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  isLoading,
}: Props) {
  const groups = groupByDate(conversations);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-(--color-border) bg-(--color-bg-subtle)">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-(--color-border) px-4">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-muted)">
          Conversations
        </span>
        <button
          onClick={onNew}
          aria-label="Nouveau chat"
          className="flex h-7 w-7 items-center justify-center rounded-(--radius-sm) text-(--color-fg-subtle) transition-colors duration-[--duration-base] hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {isLoading ? (
          <Skeleton />
        ) : groups.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-(--color-fg-subtle)">
            Aucune conversation
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label}>
              <div className="px-4 pb-1 pt-3">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-(--color-fg-subtle)">
                  {group.label}
                </span>
              </div>

              {group.items.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => onSelect(conv.id)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 border-l-2 px-4 py-2 text-left",
                      "transition-colors duration-[--duration-base]",
                      "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)",
                      isActive
                        ? "border-l-(--color-accent) bg-(--color-accent-bg) pl-[14px]"
                        : "border-l-transparent hover:bg-(--color-bg-muted)"
                    )}
                  >
                    <span
                      className={cn(
                        "truncate text-sm font-medium",
                        isActive ? "text-(--color-accent)" : "text-(--color-fg)"
                      )}
                    >
                      {conv.title}
                    </span>
                    {conv.isLocal && (
                      <span className="text-[11px] text-(--color-fg-subtle)">
                        Non sauvegardé
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
