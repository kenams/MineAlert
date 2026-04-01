import { randomUUID } from "node:crypto";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { ALERT_LIMITS, WATCHLIST_LIMITS } from "@/lib/utils/constants";
import {
  buildDemoPriceHistory,
  DEMO_ALERTS,
  DEMO_MINERALS,
  DEMO_MINES,
  DEMO_NEWS,
  DEMO_USER_PROFILE,
} from "@/lib/mock-data";
import {
  requireAuthenticatedUser,
} from "@/lib/server/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CurrencyCode,
  Mine,
  Mineral,
  NewsArticle,
  NewsFilters,
  PriceHistory,
  UserAlert,
  UserProfile,
} from "@/types";

type MineralRow = {
  id: string;
  name: string;
  symbol: string;
  category: Mineral["category"];
  unit: string;
  current_price: number | null;
  price_change_24h: number | null;
  price_change_percent: number | null;
  week_high: number | null;
  week_low: number | null;
  month_high: number | null;
  month_low: number | null;
  currency: string | null;
  description: string | null;
  main_producers: string[] | null;
  use_cases: string[] | null;
  image_url: string | null;
  last_updated: string | null;
};

type PriceHistoryRow = {
  mineral_id: string;
  price: number;
  currency: string | null;
  source: string | null;
  recorded_at: string | null;
};

type NewsArticleRow = {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  url: string;
  source: string;
  source_url: string | null;
  published_at: string | null;
  scraped_at: string | null;
  minerals: string[] | null;
  countries: string[] | null;
  sentiment: NewsArticle["sentiment"] | null;
  relevance_score: number | null;
  image_url: string | null;
  is_breaking: boolean | null;
};

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  plan: UserProfile["plan"];
  watchlist: string[] | null;
  alerts_count: number | null;
  created_at: string | null;
};

type UserAlertRow = {
  id: string;
  user_id: string;
  mineral_id: string;
  type: UserAlert["type"];
  threshold: number;
  currency: string | null;
  is_active: boolean | null;
  triggered_at: string | null;
  created_at: string | null;
};

type MineRow = {
  id: string;
  name: string;
  company: string | null;
  country: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  minerals: string[] | null;
  status: Mine["status"] | null;
  production: number | null;
  production_unit: string | null;
  description: string | null;
  website: string | null;
};

export type CreateAlertInput = {
  mineralId: string;
  type: UserAlert["type"];
  threshold: number;
  currency: CurrencyCode;
};

export type CreateWatchlistInput = {
  mineralId: string;
};

const DEMO_USER_ID = DEMO_USER_PROFILE.id;
let demoAlertsStore: UserAlert[] = [...DEMO_ALERTS];
let demoWatchlistStore: string[] = [...DEMO_USER_PROFILE.watchlist];

function mapAlertCondition(type: UserAlert["type"]): UserAlert["condition"] {
  if (type === "price_below") {
    return "less_than";
  }

  if (type === "price_above" || type === "change_percent") {
    return "greater_than";
  }

  return "equals";
}

function mapMineralRow(row: MineralRow): Mineral {
  return {
    id: row.id,
    name: row.name,
    symbol: row.symbol,
    category: row.category,
    unit: row.unit,
    currentPrice: row.current_price ?? 0,
    priceChange24h: row.price_change_24h ?? 0,
    priceChangePercent24h: row.price_change_percent ?? 0,
    weekHigh: row.week_high ?? 0,
    weekLow: row.week_low ?? 0,
    monthHigh: row.month_high ?? 0,
    monthLow: row.month_low ?? 0,
    currency: row.currency === "EUR" ? "EUR" : "USD",
    lastUpdated: row.last_updated ?? new Date().toISOString(),
    description: row.description ?? "",
    mainProducers: row.main_producers ?? [],
    useCases: row.use_cases ?? [],
    imageUrl: row.image_url ?? undefined,
  };
}

function mapNewsRow(row: NewsArticleRow): NewsArticle {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary ?? "",
    content: row.content ?? "",
    url: row.url,
    source: row.source,
    sourceUrl: row.source_url ?? "",
    publishedAt: row.published_at ?? new Date().toISOString(),
    scrapedAt: row.scraped_at ?? new Date().toISOString(),
    minerals: row.minerals ?? [],
    countries: row.countries ?? [],
    sentiment: row.sentiment ?? "neutral",
    relevanceScore: row.relevance_score ?? 50,
    imageUrl: row.image_url ?? undefined,
    isBreaking: row.is_breaking ?? false,
  };
}

function mapUserRow(row: UserRow): UserProfile {
  const alertsCount = row.alerts_count ?? 0;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    plan: row.plan,
    watchlist: row.watchlist ?? [],
    alertsCount,
    alertsLimit: ALERT_LIMITS[row.plan],
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function mapMineRow(row: MineRow): Mine {
  return {
    id: row.id,
    name: row.name,
    company: row.company ?? "",
    country: row.country,
    region: row.region ?? "",
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    minerals: row.minerals ?? [],
    status: row.status ?? "active",
    production: row.production ?? undefined,
    productionUnit: row.production_unit ?? undefined,
    description: row.description ?? "",
    website: row.website ?? undefined,
  };
}

function buildDemoAlerts(): UserAlert[] {
  return demoAlertsStore.map((alert) => ({
    ...alert,
    mineral:
      alert.mineral ??
      DEMO_MINERALS.find((mineral) => mineral.id === alert.mineralId),
  }));
}

function buildDemoProfile(): UserProfile {
  return {
    ...DEMO_USER_PROFILE,
    watchlist: [...demoWatchlistStore],
    alertsCount: demoAlertsStore.length,
  };
}

function buildProfileFromAuthUser(user: User): UserProfile {
  const fullName =
    typeof user.user_metadata.full_name === "string" &&
    user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name.trim()
      : user.email ?? "Utilisateur MineAlert";

  return {
    id: user.id,
    email: user.email ?? "",
    fullName,
    plan: "free",
    watchlist: [],
    alertsCount: 0,
    alertsLimit: ALERT_LIMITS.free,
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

async function ensureUserProfileRow(
  client: SupabaseClient,
  user: User
): Promise<UserProfile> {
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (data && !error) {
    return mapUserRow(data as UserRow);
  }

  const fallbackProfile = buildProfileFromAuthUser(user);
  const { data: createdRow, error: createError } = await client
    .from("users")
    .upsert(
      {
        id: user.id,
        email: fallbackProfile.email,
        full_name: fallbackProfile.fullName,
        plan: fallbackProfile.plan,
        watchlist: fallbackProfile.watchlist,
        alerts_count: fallbackProfile.alertsCount,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (createError || !createdRow) {
    return fallbackProfile;
  }

  return mapUserRow(createdRow as UserRow);
}

function getPeriodDays(period: string): number {
  switch (period) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 30;
  }
}

function filterNewsLocally(
  articles: NewsArticle[],
  filters?: NewsFilters
): NewsArticle[] {
  return articles.filter((article) => {
    if (filters?.mineral && !article.minerals.includes(filters.mineral)) {
      return false;
    }

    if (filters?.country && !article.countries.includes(filters.country)) {
      return false;
    }

    if (filters?.sentiment && article.sentiment !== filters.sentiment) {
      return false;
    }

    if (filters?.source && article.source !== filters.source) {
      return false;
    }

    return true;
  });
}

/**
 * Indique si le projet fonctionne actuellement avec Supabase ou en mode démo.
 */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

/**
 * Récupère le profil utilisateur courant depuis Supabase si disponible, sinon le profil démo.
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  if (!isSupabaseConfigured()) {
    return buildDemoProfile();
  }

  const client = createSupabaseServerClient();
  const user = await requireAuthenticatedUser();

  return ensureUserProfileRow(client, user);
}

/**
 * Liste les minerais disponibles avec filtres simples et fallback démo.
 */
export async function getMinerals(options?: {
  category?: string;
  search?: string;
}): Promise<Mineral[]> {
  const search = options?.search?.trim().toLowerCase() ?? "";

  if (!isSupabaseConfigured()) {
    return DEMO_MINERALS.filter((mineral) => {
      if (options?.category && mineral.category !== options.category) {
        return false;
      }

      if (
        search &&
        ![mineral.name, mineral.symbol, mineral.description]
          .join(" ")
          .toLowerCase()
          .includes(search)
      ) {
        return false;
      }

      return true;
    }).sort((first, second) => first.name.localeCompare(second.name));
  }

  try {
    const client = createSupabaseServerClient();
    let query = client.from("minerals").select("*").eq("is_active", true);

    if (options?.category) {
      query = query.eq("category", options.category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,symbol.ilike.%${search}%`);
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error || !data) {
      return DEMO_MINERALS;
    }

    return (data as MineralRow[]).map(mapMineralRow);
  } catch {
    return DEMO_MINERALS;
  }
}

/**
 * Retourne le détail d'un minerai depuis Supabase ou les données démo.
 */
export async function getMineralByIdOrSymbol(
  idOrSymbol: string
): Promise<Mineral | null> {
  const normalizedId = idOrSymbol.trim();
  const normalizedSymbol = normalizedId.toUpperCase();

  if (!isSupabaseConfigured()) {
    return (
      DEMO_MINERALS.find(
        (mineral) =>
          mineral.id === normalizedId || mineral.symbol === normalizedSymbol
      ) ?? null
    );
  }

  try {
    const client = createSupabaseServerClient();
    const byId = await client
      .from("minerals")
      .select("*")
      .eq("id", normalizedId)
      .maybeSingle();

    if (byId.data) {
      return mapMineralRow(byId.data as MineralRow);
    }

    const bySymbol = await client
      .from("minerals")
      .select("*")
      .eq("symbol", normalizedSymbol)
      .maybeSingle();

    return bySymbol.data ? mapMineralRow(bySymbol.data as MineralRow) : null;
  } catch {
    return (
      DEMO_MINERALS.find(
        (mineral) =>
          mineral.id === normalizedId || mineral.symbol === normalizedSymbol
      ) ?? null
    );
  }
}

/**
 * Retourne l'historique de prix d'un minerai pour une période donnée.
 */
export async function getPriceHistoryForMineral(
  idOrSymbol: string,
  period = "30d"
): Promise<PriceHistory[]> {
  const mineral = await getMineralByIdOrSymbol(idOrSymbol);

  if (!mineral) {
    return [];
  }

  if (!isSupabaseConfigured()) {
    const points = period === "7d" ? 7 : period === "90d" ? 20 : period === "1y" ? 24 : 30;
    return buildDemoPriceHistory(mineral, points);
  }

  try {
    const client = createSupabaseServerClient();
    const days = getPeriodDays(period);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await client
      .from("price_history")
      .select("*")
      .eq("mineral_id", mineral.id)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true });

    if (error || !data || data.length === 0) {
      return buildDemoPriceHistory(mineral, period === "7d" ? 7 : 30);
    }

    return (data as PriceHistoryRow[]).map((row) => ({
      mineralId: row.mineral_id,
      price: row.price,
      currency: row.currency ?? mineral.currency,
      timestamp: row.recorded_at ?? new Date().toISOString(),
      source: row.source ?? "supabase",
    }));
  } catch {
    return buildDemoPriceHistory(mineral, period === "7d" ? 7 : 30);
  }
}

/**
 * Liste les actualités minières avec filtres et pagination.
 */
export async function getNewsArticles(options?: {
  filters?: NewsFilters;
  pageSize?: number;
}): Promise<{
  articles: NewsArticle[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const filters = options?.filters;
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = options?.pageSize ?? 20;

  if (!isSupabaseConfigured()) {
    const filteredArticles = filterNewsLocally(DEMO_NEWS, filters).sort(
      (first, second) =>
        new Date(second.publishedAt).getTime() -
        new Date(first.publishedAt).getTime()
    );
    const total = filteredArticles.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = (page - 1) * pageSize;

    return {
      articles: filteredArticles.slice(startIndex, startIndex + pageSize),
      total,
      page,
      totalPages,
    };
  }

  try {
    const client = createSupabaseServerClient();
    let query = client.from("news_articles").select("*", { count: "exact" });

    if (filters?.source) {
      query = query.eq("source", filters.source);
    }

    if (filters?.sentiment) {
      query = query.eq("sentiment", filters.sentiment);
    }

    if (filters?.mineral) {
      query = query.contains("minerals", [filters.mineral]);
    }

    if (filters?.country) {
      query = query.contains("countries", [filters.country]);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("published_at", { ascending: false })
      .range(from, to);

    if (error || !data) {
      return {
        articles: DEMO_NEWS.slice(0, pageSize),
        total: DEMO_NEWS.length,
        page: 1,
        totalPages: 1,
      };
    }

    const articles = (data as NewsArticleRow[]).map(mapNewsRow);
    const total = count ?? articles.length;

    return {
      articles,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  } catch {
    return {
      articles: DEMO_NEWS.slice(0, pageSize),
      total: DEMO_NEWS.length,
      page: 1,
      totalPages: 1,
    };
  }
}

/**
 * Retourne les alertes utilisateur, enrichies avec les données du minerai associé.
 */
export async function getUserAlerts(): Promise<UserAlert[]> {
  if (!isSupabaseConfigured()) {
    return buildDemoAlerts();
  }

  const client = createSupabaseServerClient();
  const profile = await getCurrentUserProfile();

  const { data, error } = await client
    .from("user_alerts")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const alerts = data as UserAlertRow[];
  const minerals = await getMinerals();

  return alerts.map((alert) => ({
    id: alert.id,
    userId: alert.user_id,
    mineralId: alert.mineral_id,
    type: alert.type,
    condition: mapAlertCondition(alert.type),
    threshold: alert.threshold,
    currency: alert.currency === "EUR" ? "EUR" : "USD",
    isActive: alert.is_active ?? true,
    triggeredAt: alert.triggered_at ?? undefined,
    createdAt: alert.created_at ?? new Date().toISOString(),
    mineral:
      minerals.find((mineral) => mineral.id === alert.mineral_id) ?? undefined,
  }));
}

/**
 * Crée une alerte utilisateur en respectant les limites de plan, avec fallback démo mutable.
 */
export async function createUserAlert(input: CreateAlertInput): Promise<UserAlert> {
  const profile = await getCurrentUserProfile();
  const alerts = await getUserAlerts();

  if (alerts.length >= ALERT_LIMITS[profile.plan]) {
    throw new Error("Limite d'alertes atteinte pour votre plan actuel.");
  }

  const mineral = await getMineralByIdOrSymbol(input.mineralId);

  if (!mineral) {
    throw new Error("Minerai introuvable pour créer l'alerte.");
  }

  if (!isSupabaseConfigured()) {
    const alert: UserAlert = {
      id: randomUUID(),
      userId: DEMO_USER_ID,
      mineralId: mineral.id,
      mineral,
      type: input.type,
      condition: mapAlertCondition(input.type),
      threshold: input.threshold,
      currency: input.currency,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    demoAlertsStore = [alert, ...demoAlertsStore];
    return alert;
  }

  const client = createSupabaseServerClient();
  const { data, error } = await client
    .from("user_alerts")
    .insert({
      user_id: profile.id,
      mineral_id: mineral.id,
      type: input.type,
      threshold: input.threshold,
      currency: input.currency,
      is_active: true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error("Impossible de créer l'alerte pour le moment.");
  }

  const row = data as UserAlertRow;

  return {
    id: row.id,
    userId: row.user_id,
    mineralId: row.mineral_id,
    mineral,
    type: row.type,
    condition: mapAlertCondition(row.type),
    threshold: row.threshold,
    currency: row.currency === "EUR" ? "EUR" : "USD",
    isActive: row.is_active ?? true,
    triggeredAt: row.triggered_at ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/**
 * Supprime une alerte côté Supabase ou du store démo local.
 */
export async function deleteUserAlert(alertId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    demoAlertsStore = demoAlertsStore.filter((alert) => alert.id !== alertId);
    return;
  }

  const client = createSupabaseServerClient();
  const profile = await getCurrentUserProfile();
  const { error } = await client
    .from("user_alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", profile.id);

  if (error) {
    throw new Error("Suppression d'alerte indisponible.");
  }
}

/**
 * Retourne la watchlist courante avec fallback démo.
 */
export async function getWatchlistMinerals(): Promise<Mineral[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_MINERALS.filter((mineral) =>
      demoWatchlistStore.includes(mineral.id)
    );
  }

  const client = createSupabaseServerClient();
  const profile = await getCurrentUserProfile();
  const { data, error } = await client
    .from("watchlists")
    .select("mineral_id")
    .eq("user_id", profile.id);

  if (error || !data) {
    return [];
  }

  const ids = (data as { mineral_id: string }[]).map((entry) => entry.mineral_id);
  const minerals = await getMinerals();
  return minerals.filter((mineral) => ids.includes(mineral.id));
}

/**
 * Ajoute un minerai à la watchlist côté Supabase ou dans le store démo local.
 */
export async function addMineralToWatchlist(
  input: CreateWatchlistInput
): Promise<void> {
  const profile = await getCurrentUserProfile();
  const currentWatchlist = await getWatchlistMinerals();

  if (currentWatchlist.length >= WATCHLIST_LIMITS[profile.plan]) {
    throw new Error("Limite de watchlist atteinte pour votre plan actuel.");
  }

  if (!isSupabaseConfigured()) {
    if (!demoWatchlistStore.includes(input.mineralId)) {
      demoWatchlistStore = [...demoWatchlistStore, input.mineralId];
    }
    return;
  }

  const client = createSupabaseServerClient();
  const { error } = await client.from("watchlists").insert({
    user_id: profile.id,
    mineral_id: input.mineralId,
  });

  if (error) {
    throw new Error("Ajout à la watchlist indisponible.");
  }
}

/**
 * Retire un minerai de la watchlist côté Supabase ou du store démo local.
 */
export async function removeMineralFromWatchlist(
  input: CreateWatchlistInput
): Promise<void> {
  if (!isSupabaseConfigured()) {
    demoWatchlistStore = demoWatchlistStore.filter(
      (mineralId) => mineralId !== input.mineralId
    );
    return;
  }

  const client = createSupabaseServerClient();
  const profile = await getCurrentUserProfile();
  const { error } = await client
    .from("watchlists")
    .delete()
    .eq("user_id", profile.id)
    .eq("mineral_id", input.mineralId);

  if (error) {
    throw new Error("Suppression de la watchlist indisponible.");
  }
}

/**
 * Retourne la liste des mines disponibles avec fallback démo.
 */
export async function getMines(): Promise<Mine[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_MINES;
  }

  try {
    const client = createSupabaseServerClient();
    const { data, error } = await client.from("mines").select("*");

    if (error || !data) {
      return DEMO_MINES;
    }

    return (data as MineRow[]).map(mapMineRow);
  } catch {
    return DEMO_MINES;
  }
}
