import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { UserPlan } from "@/types";

import {
  ACCOUNT_NAV_ITEMS,
  MAIN_NAV_ITEMS,
  isNavItemActive,
} from "./navigation";

export type SidebarProps = {
  currentPath?: string;
  userPlan?: UserPlan;
  userName?: string;
  userEmail?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
};

function getPlanBadgeLabel(userPlan: UserPlan | undefined): string | null {
  if (userPlan === "pro") {
    return "PRO";
  }

  if (userPlan === "business") {
    return "BUSINESS";
  }

  return null;
}

/**
 * Sidebar desktop du dashboard MineAlert, pensée pour une navigation dense mais lisible.
 */
export function Sidebar({
  currentPath,
  userPlan = "free",
  userName = "Investisseur",
  userEmail,
  collapsed = false,
  onToggleCollapse,
  className,
}: SidebarProps): JSX.Element {
  const planBadge = getPlanBadgeLabel(userPlan);
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "MA";

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-[#1B4332]/10 bg-[#0A0A0A] text-white lg:flex",
        collapsed ? "w-[92px]" : "w-60",
        className
      )}
      aria-label="Navigation principale"
    >
      <div className="flex w-full flex-col px-4 py-5">
        <div className="flex items-center justify-between gap-3 pb-6">
          <Link
            href="/dashboard"
            className={cn(
              "inline-flex items-center gap-2 transition hover:opacity-90",
              collapsed && "justify-center"
            )}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37] text-sm font-bold text-[#0A0A0A]">
              M
            </span>
            {!collapsed ? (
              <span className="text-lg font-semibold tracking-wide text-[#D4AF37]">
                MineAlert
              </span>
            ) : null}
          </Link>

          {onToggleCollapse ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="hidden h-9 w-9 min-w-0 rounded-full border border-white/10 p-0 text-white hover:bg-white/10 xl:inline-flex"
              aria-label={collapsed ? "Ouvrir la sidebar" : "Réduire la sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          ) : null}
        </div>

        <nav className="space-y-8">
          <div className="space-y-2">
            {!collapsed ? (
              <p className="px-3 text-xs font-medium uppercase tracking-[0.24em] text-white/45">
                Marchés
              </p>
            ) : null}

            <ul className="space-y-1.5">
              {MAIN_NAV_ITEMS.map((item) => {
                const active = isNavItemActive(currentPath, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                        active
                          ? "bg-[#1B4332] text-white shadow-[0_10px_24px_-16px_rgba(27,67,50,0.9)]"
                          : "text-white/72 hover:bg-white/6 hover:text-white",
                        collapsed && "justify-center px-0"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed ? <span className="font-medium">{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-2">
            {!collapsed ? (
              <p className="px-3 text-xs font-medium uppercase tracking-[0.24em] text-white/45">
                Compte
              </p>
            ) : null}

            <ul className="space-y-1.5">
              {ACCOUNT_NAV_ITEMS.map((item) => {
                const active = isNavItemActive(currentPath, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/72 hover:bg-white/6 hover:text-white",
                        collapsed && "justify-center px-0"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed ? <span className="font-medium">{item.label}</span> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
              {initials}
            </div>

            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{userName}</p>
                <p className="truncate text-xs text-white/55">
                  {userEmail ?? "Pret pour le dashboard"}
                </p>
              </div>
            ) : null}
          </div>

          {!collapsed && planBadge ? (
            <div className="mt-4">
              <Badge variant="gold" compact>
                {planBadge}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
