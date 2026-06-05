import { Home, Activity, Music, BookHeart, UserRound, ListChecks, MessageSquare } from "lucide-react";
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
  { label: "Habitudes", href: "/habits", icon: ListChecks },
  { label: "Activités", href: "/activities", icon: Activity, separator: true },
  { label: "Musique", href: "/music", icon: Music, separator: true },
  { label: "Focus artiste", href: "/music/artist", icon: UserRound },
  { label: "Chat", href: "/chat", icon: MessageSquare, separator: true },
];
