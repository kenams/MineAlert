/**
 * Devise prise en charge dans l'application.
 */
export type CurrencyCode = "USD" | "EUR";

/**
 * Catégories de minerais et métaux suivis.
 */
export type MineralCategory =
  | "precious_metals"
  | "base_metals"
  | "battery_metals"
  | "rare_earths"
  | "energy_metals"
  | "bulk_commodities";

/**
 * Sentiment détecté sur une actualité.
 */
export type SentimentType = "positive" | "negative" | "neutral";

/**
 * Statut d'une mine.
 */
export type MineStatus = "active" | "exploration" | "suspended" | "closed";

/**
 * Plans d'abonnement disponibles.
 */
export type UserPlan = "free" | "pro" | "business";

/**
 * Types d'alertes configurables par l'utilisateur.
 */
export type AlertType =
  | "price_above"
  | "price_below"
  | "change_percent"
  | "news_keyword";

/**
 * Conditions de comparaison utilisées par le moteur d'alertes.
 */
export type AlertCondition = "greater_than" | "less_than" | "equals";

/**
 * Données d'un minerai ou métal suivi par la plateforme.
 */
export type Mineral = {
  id: string;
  name: string;
  symbol: string;
  category: MineralCategory;
  unit: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  weekHigh: number;
  weekLow: number;
  monthHigh: number;
  monthLow: number;
  currency: CurrencyCode;
  lastUpdated: string;
  description: string;
  mainProducers: string[];
  useCases: string[];
  imageUrl?: string;
};

/**
 * Article d'actualité collecté et enrichi pour la veille minière.
 */
export type NewsArticle = {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  scrapedAt: string;
  minerals: string[];
  countries: string[];
  sentiment: SentimentType;
  relevanceScore: number;
  imageUrl?: string;
  isBreaking: boolean;
};

/**
 * Fiche descriptive d'une mine.
 */
export type Mine = {
  id: string;
  name: string;
  company: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
  minerals: string[];
  status: MineStatus;
  production?: number;
  productionUnit?: string;
  description: string;
  website?: string;
};

/**
 * Alerte configurée par un utilisateur sur un minerai.
 */
export type UserAlert = {
  id: string;
  userId: string;
  mineralId: string;
  mineral?: Mineral;
  type: AlertType;
  condition: AlertCondition;
  threshold: number;
  currency: CurrencyCode;
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
};

/**
 * Profil utilisateur exploité dans le SaaS.
 */
export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  plan: UserPlan;
  watchlist: string[];
  alertsCount: number;
  alertsLimit: number;
  createdAt: string;
};

/**
 * Point de prix historique pour les graphiques.
 */
export type PriceHistory = {
  mineralId: string;
  price: number;
  currency: string;
  timestamp: string;
  source: string;
};

/**
 * Etat de fraicheur global des donnees alimentees par le scraping.
 */
export type DataFreshnessStatus = {
  mode: "live" | "demo";
  latestPriceUpdateAt: string | null;
  latestNewsUpdateAt: string | null;
  latestDataAt: string | null;
  latestDataAgeMs: number | null;
  freshnessStatus: "fresh" | "stale" | "unavailable";
};

/**
 * Réponse API standardisée pour toutes les routes applicatives.
 */
export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message?: string;
  error?: string;
};

/**
 * Variante paginée d'une réponse API pour les listes.
 */
export type PaginatedResponse<T> = ApiResponse<T[]> & {
  total: number;
  page: number;
  totalPages: number;
};

/**
 * Filtres réutilisables pour le flux d'actualités.
 */
export type NewsFilters = {
  mineral?: string;
  country?: string;
  sentiment?: SentimentType;
  source?: string;
  page?: number;
};
