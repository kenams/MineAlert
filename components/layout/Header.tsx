"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import {
  Bell,
  Menu,
  Search,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils/cn";

export type HeaderProps = {
  title?: string;
  currentPath?: string;
  lastUpdated?: string;
  notificationCount?: number;
  userName?: string;
  onMenuClick?: () => void;
  onSearch?: (value: string) => void;
  className?: string;
};

/**
 * Construit un libellé de page lisible à partir du chemin courant si aucun titre n'est fourni.
 */
export function getHeaderTitle(currentPath?: string): string {
  if (!currentPath || currentPath === "/" || currentPath === "/dashboard") {
    return "Dashboard";
  }

  const segments = currentPath
    .split("/")
    .filter(Boolean)
    .filter((segment) => segment !== "dashboard")
    .map((segment) =>
      segment
        .replace(/-/g, " ")
        .replace(/^\w/, (letter) => letter.toUpperCase())
    );

  return segments.join(" / ");
}

function getUserInitials(userName: string | undefined): string {
  if (!userName) {
    return "MA";
  }

  const parts = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "MA";
}

/**
 * Barre supérieure du dashboard avec recherche, notifications et zone compte.
 */
export function Header({
  title,
  currentPath,
  lastUpdated,
  notificationCount = 0,
  userName = "Investisseur",
  onMenuClick,
  onSearch,
  className,
}: HeaderProps): JSX.Element {
  const [searchValue, setSearchValue] = useState("");
  const resolvedTitle = useMemo(
    () => title ?? getHeaderTitle(currentPath),
    [currentPath, title]
  );
  const initials = getUserInitials(userName);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setSearchValue(nextValue);
    onSearch?.(nextValue);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-[#1B4332]/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
        className
      )}
    >
      <div className="flex min-h-[60px] items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-[#0A0A0A] transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1B4332]/15 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 shrink-0">
          <p className="truncate text-base font-semibold text-[#0A0A0A] sm:text-lg">
            {resolvedTitle}
          </p>
          {lastUpdated ? (
            <p className="hidden text-xs text-slate-500 sm:block">
              Dernière mise à jour : {lastUpdated}
            </p>
          ) : null}
        </div>

        <div className="hidden min-w-0 flex-1 xl:block">
          <Input
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Rechercher un minerai, une actualité ou un pays..."
            leftIcon={<Search className="h-4 w-4" />}
            wrapperClassName="max-w-xl"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1B4332]/15"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#DC3545] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            ) : null}
          </button>

          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-[#F8F9FA] px-2 py-1.5 sm:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B4332] text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-medium text-[#0A0A0A]">
                {userName}
              </p>
              <div className="pt-0.5">
                <Badge variant="neutral" compact>
                  Compte
                </Badge>
              </div>
            </div>
          </div>

          <SignOutButton
            variant="outline"
            size="sm"
            className="hidden rounded-xl md:inline-flex"
            label="Déconnexion"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 xl:hidden">
        <Input
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="Rechercher un minerai ou une actu..."
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>
    </header>
  );
}
