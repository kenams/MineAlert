import type {
  AlertType,
  CurrencyCode,
  MineStatus,
  MineralCategory,
  SentimentType,
  UserPlan,
} from "@/types";

/**
 * Nom public de l'application.
 */
export const APP_NAME = "MineAlert";

/**
 * Description courte réutilisable dans l'interface et le SEO.
 */
export const APP_DESCRIPTION =
  "Plateforme de veille minière mondiale pour suivre les prix, les actualités et les alertes sur les minerais.";

/**
 * Palette principale de l'application.
 */
export const APP_COLORS = {
  primary: "#1B4332",
  accent: "#D4AF37",
  dark: "#0A0A0A",
  background: "#F8F9FA",
  danger: "#DC3545",
} as const;

/**
 * Devise par défaut de la plateforme.
 */
export const DEFAULT_CURRENCY: CurrencyCode = "USD";

/**
 * Périodes disponibles pour l'historique des prix.
 */
export const PRICE_HISTORY_PERIODS = ["7d", "30d", "90d", "1y"] as const;

/**
 * Période d'historique utilisée par défaut.
 */
export const DEFAULT_PRICE_HISTORY_PERIOD =
  PRICE_HISTORY_PERIODS[1];

/**
 * Taille de page par défaut pour le flux d'actualités.
 */
export const NEWS_PAGE_SIZE = 20;

/**
 * Durée de mise en cache des prix en minutes.
 */
export const PRICE_CACHE_MINUTES = 5;

/**
 * Rafraichissement client des prix courants.
 */
export const LIVE_PRICES_REFRESH_MS = 60 * 1000;

/**
 * Rafraichissement client de l'historique des prix.
 */
export const LIVE_PRICE_HISTORY_REFRESH_MS = 60 * 1000;

/**
 * Rafraichissement client du flux d'actualites.
 */
export const LIVE_NEWS_REFRESH_MS = 2 * 60 * 1000;

/**
 * Rafraichissement client des donnees utilisateur du dashboard.
 */
export const LIVE_PORTFOLIO_REFRESH_MS = 60 * 1000;

/**
 * Rafraichissement client du statut global de fraicheur des donnees.
 */
export const SYSTEM_STATUS_REFRESH_MS = 60 * 1000;

/**
 * Symboles mis en avant sur le dashboard principal.
 */
export const DASHBOARD_FEATURED_SYMBOLS = ["XAU", "CU", "LI"] as const;

/**
 * Métadonnées d'affichage pour chaque catégorie de minerai.
 */
export const MINERAL_CATEGORIES: Record<
  MineralCategory,
  { label: string; color: string }
> = {
  precious_metals: { label: "Métaux précieux", color: "#D4AF37" },
  base_metals: { label: "Métaux de base", color: "#708090" },
  battery_metals: { label: "Métaux batteries", color: "#2ECC71" },
  rare_earths: { label: "Terres rares", color: "#9B59B6" },
  energy_metals: { label: "Métaux énergie", color: "#E74C3C" },
  bulk_commodities: { label: "Commodités vrac", color: "#95A5A6" },
};

/**
 * Limites d'alertes par plan utilisateur.
 */
export const ALERT_LIMITS: Record<UserPlan, number> = {
  free: 5,
  pro: 50,
  business: 500,
};

/**
 * Limites de watchlist par plan utilisateur.
 */
export const WATCHLIST_LIMITS: Record<UserPlan, number> = {
  free: 10,
  pro: 100,
  business: 1000,
};

/**
 * Fréquence de scraping globale de la plateforme.
 */
export const SCRAPE_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Seuil au-dela duquel les donnees sont considerees comme anciennes.
 */
export const DATA_FRESHNESS_WARNING_THRESHOLD_MS = 10 * 60 * 1000;

/**
 * Expression cron par defaut pour la synchronisation automatique du scraper.
 */
export const SCRAPER_SYNC_CRON_EXPRESSION = "*/5 * * * *";

/**
 * Types d'alertes autorisés dans l'application.
 */
export const SUPPORTED_ALERT_TYPES: readonly AlertType[] = [
  "price_above",
  "price_below",
  "change_percent",
  "news_keyword",
];

/**
 * Sentiments pris en charge pour le filtrage des actualités.
 */
export const SUPPORTED_SENTIMENTS: readonly SentimentType[] = [
  "positive",
  "negative",
  "neutral",
];

/**
 * Statuts de mines disponibles dans l'interface.
 */
export const SUPPORTED_MINE_STATUSES: readonly MineStatus[] = [
  "active",
  "exploration",
  "suspended",
  "closed",
];
