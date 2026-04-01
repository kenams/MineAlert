import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  Gem,
  Globe2,
  LayoutDashboard,
  Map,
  Settings,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";

export type LayoutNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/**
 * Navigation principale du dashboard MineAlert.
 */
export const MAIN_NAV_ITEMS: readonly LayoutNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/minerais", label: "Minerais", icon: Gem },
  { href: "/dashboard/actualites", label: "Actualités", icon: Globe2 },
  { href: "/dashboard/alertes", label: "Alertes", icon: BellRing },
  { href: "/dashboard/carte", label: "Carte mondiale", icon: Map },
] as const;

/**
 * Navigation secondaire liée au compte utilisateur.
 */
export const ACCOUNT_NAV_ITEMS: readonly LayoutNavItem[] = [
  { href: "/dashboard/profil", label: "Mon profil", icon: UserCircle2 },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
  { href: "/dashboard/plan", label: "Mon plan", icon: ShieldCheck },
] as const;

/**
 * Détermine si une entrée de navigation doit être considérée comme active.
 */
export function isNavItemActive(currentPath: string | undefined, href: string): boolean {
  if (!currentPath) {
    return href === "/dashboard";
  }

  if (href === "/dashboard") {
    return currentPath === "/dashboard";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}
