import type {
  AlertType,
  CurrencyCode,
  MineStatus,
  MineralCategory,
  SentimentType,
  UserPlan,
} from "@/types";

import { createT, type DictKey } from "@/lib/i18n";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale";
import {
  DATA_FRESHNESS_WARNING_THRESHOLD_MS,
  DEFAULT_CURRENCY,
} from "@/lib/utils/constants";

/**
 * Code BCP 47 utilisé pour Intl selon la locale.
 */
export function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : "fr-FR";
}

/**
 * Retourne une date valide ou null si l'entrée est invalide.
 */
export function safeDate(value: string | Date): Date | null {
  const parsedDate = value instanceof Date ? value : new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

/**
 * Vérifie qu'une date fournie peut être interprétée correctement.
 */
export function isValidDate(value: string | Date): boolean {
  return safeDate(value) !== null;
}

/**
 * Formate un prix dans la locale demandée (3 898,90 $ en français, $3,898.90 en anglais).
 */
export function formatPrice(
  price: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  locale: Locale = DEFAULT_LOCALE
): string {
  const safePrice = Number.isFinite(price) ? price : 0;

  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safePrice);
}

/**
 * Formate un nombre simple dans la locale demandée.
 */
export function formatNumber(
  value: number,
  maximumFractionDigits = 2,
  locale: Locale = DEFAULT_LOCALE
): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(safeValue);
}

/**
 * Formate un nombre de manière compacte pour les grands volumes.
 */
export function formatCompactNumber(value: number, locale: Locale = DEFAULT_LOCALE): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat(intlLocale(locale), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(safeValue);
}

/**
 * Formate une variation en pourcentage avec son signe explicite.
 */
export function formatChange(change: number): string {
  const safeChange = Number.isFinite(change) ? change : 0;
  const sign = safeChange >= 0 ? "+" : "";

  return `${sign}${safeChange.toFixed(2)}%`;
}

/**
 * Formate un pourcentage numérique sans logique métier additionnelle.
 */
export function formatPercent(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  const sign = safeValue >= 0 ? "+" : "";

  return `${sign}${safeValue.toFixed(2)}%`;
}

/**
 * Formate une date complète pour l'affichage des actualités et historiques.
 */
export function formatDate(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const parsedDate = safeDate(date);

  if (!parsedDate) {
    return createT(locale)("common.unknownDate");
  }

  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

/**
 * Date seule (jour, mois, année) dans la locale demandée.
 */
export function formatDay(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const parsedDate = safeDate(date);

  return parsedDate ? parsedDate.toLocaleDateString(intlLocale(locale)) : createT(locale)("common.unknownDate");
}

/**
 * Date et heure courtes dans la locale demandée.
 */
export function formatDateTime(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const parsedDate = safeDate(date);

  return parsedDate ? parsedDate.toLocaleString(intlLocale(locale)) : createT(locale)("common.unknownDate");
}

/**
 * Retourne un libellé relatif simple à partir d'une date.
 */
export function timeAgo(date: string, locale: Locale = DEFAULT_LOCALE): string {
  const t = createT(locale);
  const parsedDate = safeDate(date);

  if (!parsedDate) {
    return t("common.unknownDateLower");
  }

  const diff = Date.now() - parsedDate.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 60) {
    return t("common.agoMinutes", { n: minutes });
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return t("common.agoHours", { n: hours });
  }

  const days = Math.floor(hours / 24);
  return t("common.agoDays", { n: days });
}

/**
 * Retourne un libelle relatif a partir d'un age exprime en millisecondes.
 */
export function formatRelativeAge(ageMs: number, locale: Locale = DEFAULT_LOCALE): string {
  const t = createT(locale);
  const safeAge = Math.max(0, Math.floor(ageMs));
  const minutes = Math.floor(safeAge / 60000);

  if (minutes < 1) {
    return t("common.agoLessThanMinute");
  }

  if (minutes < 60) {
    return t("common.agoMinutesSpaced", { n: minutes });
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return t("common.agoHoursSpaced", { n: hours });
  }

  const days = Math.floor(hours / 24);
  return t("common.agoDaysSpaced", { n: days });
}

/**
 * Formate un resume lisible de la fraicheur globale des donnees.
 */
export function formatDataFreshnessLabel(
  latestDataAgeMs: number | null,
  freshnessStatus: "fresh" | "stale" | "unavailable",
  locale: Locale = DEFAULT_LOCALE
): string {
  const t = createT(locale);

  if (freshnessStatus === "unavailable" || latestDataAgeMs === null) {
    return t("common.unavailable");
  }

  const relativeAge = formatRelativeAge(latestDataAgeMs, locale);

  if (freshnessStatus === "stale" || latestDataAgeMs > DATA_FRESHNESS_WARNING_THRESHOLD_MS) {
    return t("common.late", { age: relativeAge });
  }

  return relativeAge;
}

/**
 * Traduit le libellé de cadence de synchronisation renvoyé par la configuration serveur.
 */
export function formatRefreshLabel(label: string, locale: Locale = DEFAULT_LOCALE): string {
  const keys: Record<string, DictKey> = {
    "quotidienne + a la demande": "refresh.daily",
    frequente: "refresh.frequent",
    manuelle: "refresh.manual",
    locale: "refresh.local",
  };
  const key = keys[label];

  return key ? createT(locale)(key) : label;
}

/**
 * Retourne un libellé lisible pour un plan d'abonnement.
 */
export function formatPlanName(plan: UserPlan, locale: Locale = DEFAULT_LOCALE): string {
  return createT(locale)(`plan.${plan}`);
}

/**
 * Retourne un libellé lisible pour un type d'alerte.
 */
export function formatAlertType(type: AlertType, locale: Locale = DEFAULT_LOCALE): string {
  return createT(locale)(`alertType.${type}`);
}

/**
 * Retourne le libellé métier d'une catégorie de minerai.
 */
export function formatMineralCategory(
  category: MineralCategory,
  locale: Locale = DEFAULT_LOCALE
): string {
  return createT(locale)(`category.${category}`);
}

/**
 * Retourne un libellé lisible pour le statut d'une mine.
 */
export function formatMineStatus(status: MineStatus, locale: Locale = DEFAULT_LOCALE): string {
  return createT(locale)(`mineStatus.${status}`);
}

/**
 * Retourne un libellé lisible pour le sentiment d'un article.
 */
export function formatSentiment(sentiment: SentimentType, locale: Locale = DEFAULT_LOCALE): string {
  return createT(locale)(`sentiment.${sentiment}`);
}
