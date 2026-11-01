import type { LucideIcon } from "lucide-react";
import {
  BellRing,
  Gem,
  FileText,
  Globe2,
  LayoutDashboard,
  Map,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";

import type { DictKey } from "@/lib/i18n";
import { stripLocale } from "@/lib/i18n/paths";

export type LayoutNavItem = {
  href: string;
  labelKey: DictKey;
  icon: LucideIcon;
};

/**
 * Navigation principale du dashboard MineAlert.
 */
export const MAIN_NAV_ITEMS: readonly LayoutNavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/dashboard/minerais", labelKey: "nav.minerals", icon: Gem },
  { href: "/dashboard/actualites", labelKey: "nav.news", icon: Globe2 },
  { href: "/dashboard/alertes", labelKey: "nav.alerts", icon: BellRing },
  { href: "/dashboard/depots", labelKey: "nav.filings", icon: FileText },
  { href: "/dashboard/risque-pays", labelKey: "nav.countryRisk", icon: ShieldAlert },
  { href: "/dashboard/carte", labelKey: "nav.map", icon: Map },
] as const;

/**
 * Navigation secondaire liée au compte utilisateur.
 */
export const ACCOUNT_NAV_ITEMS: readonly LayoutNavItem[] = [
  { href: "/dashboard/profil", labelKey: "nav.profile", icon: UserCircle2 },
  { href: "/dashboard/parametres", labelKey: "nav.settings", icon: Settings },
  { href: "/dashboard/plan", labelKey: "nav.plan", icon: ShieldCheck },
] as const;

/**
 * Détermine si une entrée de navigation doit être considérée comme active (le préfixe de langue est ignoré).
 */
export function isNavItemActive(currentPath: string | undefined, href: string): boolean {
  if (!currentPath) {
    return href === "/dashboard";
  }

  const { path } = stripLocale(currentPath);

  if (href === "/dashboard") {
    return path === "/dashboard";
  }

  return path === href || path.startsWith(`${href}/`);
}
