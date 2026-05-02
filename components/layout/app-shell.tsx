"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {/* Strip permanente */}
      <div className="flex w-12 shrink-0 flex-col border-r border-(--color-border) bg-(--color-bg-subtle)">
        <div className="flex h-12 shrink-0 items-center justify-center border-b border-(--color-border)">
          <button
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex h-9 w-9 items-center justify-center rounded-[--radius-sm] text-(--color-fg-subtle) hover:bg-(--color-bg-muted) hover:text-(--color-fg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
          >
            <Menu className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Nav icons — toujours cliquables même sidebar fermée */}
        <nav className="flex flex-col gap-0.5 px-1.5 pt-2" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-[--radius-sm]",
                  "transition-colors duration-[--duration-base]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)",
                  isActive
                    ? "bg-(--color-accent-bg) text-(--color-accent)"
                    : "text-(--color-fg-subtle) hover:bg-(--color-bg-muted) hover:text-(--color-fg)"
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle — ancré en bas de la strip */}
        <div className="mt-auto flex flex-col items-center pb-2 px-1.5">
          <ThemeToggle />
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer sidebar — overlay au-dessus de la strip et du contenu */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Contenu principal — prend toute la largeur restante */}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
