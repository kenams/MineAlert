"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { UserPlan } from "@/types";

import {
  ACCOUNT_NAV_ITEMS,
  MAIN_NAV_ITEMS,
  isNavItemActive,
} from "./navigation";

export type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  currentPath?: string;
  userPlan?: UserPlan;
  userName?: string;
  className?: string;
};

function getPlanLabel(userPlan: UserPlan | undefined): string | null {
  if (userPlan === "pro") {
    return "PRO";
  }

  if (userPlan === "business") {
    return "BUSINESS";
  }

  return null;
}

/**
 * Navigation mobile latérale du dashboard avec backdrop et fermeture contrôlée.
 */
export function MobileNav({
  open,
  onClose,
  currentPath,
  userPlan = "free",
  userName = "Investisseur",
  className,
}: MobileNavProps): JSX.Element | null {
  const planLabel = getPlanLabel(userPlan);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0A0A0A]/50 lg:hidden"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className={cn(
          "flex h-full w-[88%] max-w-sm flex-col border-r border-white/10 bg-[#0A0A0A] px-4 py-5 text-white shadow-2xl",
          className
        )}
        onClick={(event) => event.stopPropagation()}
        aria-label="Navigation mobile"
      >
        <div className="flex items-center justify-between gap-3 pb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2" onClick={onClose}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#D4AF37] text-sm font-bold text-[#0A0A0A]">
              M
            </span>
            <span className="text-lg font-semibold tracking-wide text-[#D4AF37]">
              MineAlert
            </span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 min-w-0 rounded-full border border-white/10 p-0 text-white hover:bg-white/10"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
              {userName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("") || "MA"}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{userName}</p>
              {planLabel ? (
                <div className="pt-1">
                  <Badge variant="gold" compact>
                    {planLabel}
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-white/55">Plan gratuit</p>
              )}
            </div>
          </div>
        </div>

        <nav className="space-y-8 overflow-y-auto">
          <div className="space-y-2">
            <p className="px-3 text-xs font-medium uppercase tracking-[0.24em] text-white/45">
              Marchés
            </p>

            <ul className="space-y-1.5">
              {MAIN_NAV_ITEMS.map((item) => {
                const active = isNavItemActive(currentPath, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                        active
                          ? "bg-[#1B4332] text-white"
                          : "text-white/72 hover:bg-white/6 hover:text-white"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-2">
            <p className="px-3 text-xs font-medium uppercase tracking-[0.24em] text-white/45">
              Compte
            </p>

            <ul className="space-y-1.5">
              {ACCOUNT_NAV_ITEMS.map((item) => {
                const active = isNavItemActive(currentPath, item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/72 hover:bg-white/6 hover:text-white"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          <SignOutButton
            variant="outline"
            fullWidth
            className="border-white/15 text-white hover:bg-white/10 hover:text-white"
            label="Se déconnecter"
          />
        </div>
      </aside>
    </div>
  );
}
