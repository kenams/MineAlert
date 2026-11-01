import type { Metadata } from "next";

import { getSiteUrl } from "@/lib/config/public";

import { createT } from "./index";
import type { Locale } from "./locale";
import { localePath } from "./paths";

const FALLBACK_SITE_URL = "https://mine-alert-kenams.vercel.app";

/**
 * URL publique du site, sans lever d'erreur si la variable manque pendant le build.
 */
export function siteBaseUrl(): string {
  try {
    return getSiteUrl().replace(/\/$/, "");
  } catch {
    return FALLBACK_SITE_URL;
  }
}

/**
 * Alternates canonical + hreflang (fr, en, x-default) pour une page publique.
 */
export function publicAlternates(locale: Locale, path: string): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localePath(locale, path),
    languages: {
      fr: localePath("fr", path),
      en: localePath("en", path),
      "x-default": localePath("fr", path),
    },
  };
}

/**
 * Métadonnées communes d'une page publique : titre, description, canonical et hreflang.
 */
export function publicMetadata(locale: Locale, path: string, titleKey?: "meta.loginTitle" | "meta.registerTitle"): Metadata {
  const t = createT(locale);

  return {
    title: titleKey ? t(titleKey) : "MineAlert",
    description: t("meta.description"),
    alternates: publicAlternates(locale, path),
    openGraph: {
      title: titleKey ? `${t(titleKey)} · MineAlert` : "MineAlert",
      description: t("meta.description"),
      locale: locale === "en" ? "en_US" : "fr_FR",
      url: localePath(locale, path),
      siteName: "MineAlert",
      type: "website",
    },
  };
}
