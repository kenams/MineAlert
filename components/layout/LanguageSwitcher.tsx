"use client";

import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import { localePath, stripLocale, type Locale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils/cn";

type LanguageSwitcherProps = {
  tone?: "light" | "dark";
  className?: string;
};

const OPTIONS: ReadonlyArray<{ locale: Locale; label: string; name: string }> = [
  { locale: "fr", label: "FR", name: "Français" },
  { locale: "en", label: "EN", name: "English" },
];

/**
 * Sélecteur de langue FR | EN. Vrais liens <a> avec rechargement complet : la locale change côté serveur.
 */
export function LanguageSwitcher({ tone = "light", className }: LanguageSwitcherProps): JSX.Element {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const t = useT();
  const { path } = stripLocale(pathname);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, target: Locale) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) {
      return;
    }

    // Conserve la query string et l'ancre, qui ne sont pas disponibles au rendu statique.
    event.preventDefault();
    window.location.assign(
      `${localePath(target, path)}${window.location.search}${window.location.hash}`
    );
  };

  return (
    <nav
      aria-label={t("common.language")}
      className={cn(
        "inline-flex items-center rounded-full border p-0.5 text-xs font-semibold",
        tone === "dark" ? "border-white/20 bg-white/5" : "border-slate-200 bg-white",
        className
      )}
    >
      {OPTIONS.map((option) => {
        const active = option.locale === locale;

        return (
          <a
            key={option.locale}
            href={localePath(option.locale, path)}
            hrefLang={option.locale}
            lang={option.locale}
            title={option.name}
            aria-current={active ? "true" : undefined}
            onClick={(event) => handleClick(event, option.locale)}
            className={cn(
              "rounded-full px-2.5 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
              active
                ? tone === "dark"
                  ? "bg-[#D4AF37] text-[#0A0A0A]"
                  : "bg-[#1B4332] text-white"
                : tone === "dark"
                  ? "text-white/70 hover:text-white"
                  : "text-slate-500 hover:text-[#0A0A0A]"
            )}
          >
            {option.label}
          </a>
        );
      })}
    </nav>
  );
}
