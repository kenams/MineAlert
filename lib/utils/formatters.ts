import type {
  AlertType,
  CurrencyCode,
  MineStatus,
  MineralCategory,
  SentimentType,
  UserPlan,
} from "@/types";

import {
  DEFAULT_CURRENCY,
  MINERAL_CATEGORIES,
} from "@/lib/utils/constants";

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
 * Formate un prix avec la locale française et une devise donnée.
 */
export function formatPrice(
  price: number,
  currency: CurrencyCode = DEFAULT_CURRENCY
): string {
  const safePrice = Number.isFinite(price) ? price : 0;

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safePrice);
}

/**
 * Formate un nombre simple avec la locale française.
 */
export function formatNumber(value: number, maximumFractionDigits = 2): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(safeValue);
}

/**
 * Formate un nombre de manière compacte pour les grands volumes.
 */
export function formatCompactNumber(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat("fr-FR", {
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
export function formatDate(date: string): string {
  const parsedDate = safeDate(date);

  if (!parsedDate) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

/**
 * Retourne un libellé relatif simple à partir d'une date.
 */
export function timeAgo(date: string): string {
  const parsedDate = safeDate(date);

  if (!parsedDate) {
    return "date inconnue";
  }

  const diff = Date.now() - parsedDate.getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `il y a ${hours}h`;
  }

  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

/**
 * Retourne un libellé lisible pour un plan d'abonnement.
 */
export function formatPlanName(plan: UserPlan): string {
  const labels: Record<UserPlan, string> = {
    free: "Gratuit",
    pro: "Pro",
    business: "Business",
  };

  return labels[plan];
}

/**
 * Retourne un libellé lisible pour un type d'alerte.
 */
export function formatAlertType(type: AlertType): string {
  const labels: Record<AlertType, string> = {
    price_above: "Prix au-dessus",
    price_below: "Prix en dessous",
    change_percent: "Variation en pourcentage",
    news_keyword: "Mot-clé dans les actualités",
  };

  return labels[type];
}

/**
 * Retourne le libellé métier d'une catégorie de minerai.
 */
export function formatMineralCategory(category: MineralCategory): string {
  return MINERAL_CATEGORIES[category].label;
}

/**
 * Retourne un libellé lisible pour le statut d'une mine.
 */
export function formatMineStatus(status: MineStatus): string {
  const labels: Record<MineStatus, string> = {
    active: "Active",
    exploration: "Exploration",
    suspended: "Suspendue",
    closed: "Fermée",
  };

  return labels[status];
}

/**
 * Retourne un libellé lisible pour le sentiment d'un article.
 */
export function formatSentiment(sentiment: SentimentType): string {
  const labels: Record<SentimentType, string> = {
    positive: "Positif",
    negative: "Négatif",
    neutral: "Neutre",
  };

  return labels[sentiment];
}
