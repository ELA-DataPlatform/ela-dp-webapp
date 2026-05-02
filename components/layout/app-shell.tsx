"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden lg:flex-row">
      {/* Barre de navigation mobile — masquée sur desktop */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-(--color-border) bg-(--color-bg-subtle) px-4 lg:hidden">
        <span className="text-sm font-semibold tracking-[-0.02em] text-(--color-fg)">ELA DP</span>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-9 w-9 items-center justify-center rounded-[--radius-sm] text-(--color-fg-subtle) hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
        >
          <Menu className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </header>

      {/* Sidebar desktop — masquée sur mobile */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        className="hidden lg:flex"
      />

      {/* Backdrop + drawer sidebar mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
