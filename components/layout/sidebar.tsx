export function Sidebar() {
  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col border-r border-(--color-border) bg-(--color-bg-subtle)">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center border-b border-(--color-border) px-4">
        <span className="text-sm font-semibold tracking-[-0.02em] text-(--color-fg)">
          ELA DP
        </span>
      </div>

      {/* Contenu — à remplir par page */}
      <div className="flex flex-1 flex-col overflow-y-auto" />
    </aside>
  );
}
