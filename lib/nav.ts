import { Home, Activity, Music, BookHeart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  separator?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Synthèse quotidienne", href: "/daily", icon: BookHeart, separator: true },
  { label: "Activités", href: "/activities", icon: Activity },
  { label: "Musique", href: "/music", icon: Music },
];
