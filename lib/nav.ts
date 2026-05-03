import { Home, Activity, Music } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  separator?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Activités", href: "/activities", icon: Activity, separator: true },
  { label: "Musique", href: "/music", icon: Music },
];
