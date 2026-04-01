import type { NewsArticle, Mineral, SentimentType } from "@/types";

import { createAdminClient } from "@/lib/supabase/admin";

import { scrapeMetalPrices } from "./metalprices.scraper";
import { scrapeMiningNews } from "./mining.scraper";
import {
  COUNTRY_KEYWORDS,
  MINERAL_KEYWORDS,
  findCountries,
  findKeywordMatches,
  uniqueNonEmpty,
} from "./shared";

const POSITIVE_SENTIMENT_KEYWORDS = [
  "hausse",
  "record",
  "croissance",
  "demande",
  "decouverte",
  "découverte",
  "expansion",
  "rally",
  "surge",
  "growth",
  "strong demand",
  "approval",
  "restart",
  "rebound",
] as const;

const NEGATIVE_SENTIMENT_KEYWORDS = [
  "baisse",
  "chute",
  "fermeture",
  "crise",
  "penurie",
  "pénurie",
  "retard",
  "faillite",
  "strike",
  "disruption",
  "decline",
  "weak demand",
  "suspension",
  "delay",
] as const;

type ScraperRunOptions = {
  allowFallback?: boolean;
};

type ScrapedData = {
  pricesUpdated: number;
  articlesScraped: number;
  prices: Partial<Mineral>[];
  articles: Partial<NewsArticle>[];
};

type ScraperSyncResult = ScrapedData & {
  mineralsUpserted: number;
  priceHistoryInserted: number;
  newsArticlesUpserted: number;
  syncedAt: string;
};

type PersistedMineralRow = {
  id: string;
  symbol: string;
  name: string;
  category: Mineral["category"];
  unit: string;
  current_price: number | null;
  week_high: number | null;
  week_low: number | null;
  month_high: number | null;
  month_low: number | null;
  currency: string | null;
  description: string | null;
  main_producers: string[] | null;
  use_cases: string[] | null;
  image_url: string | null;
};

type PriceHistoryRow = {
  mineral_id: string;
  price: number | null;
  source: string | null;
  recorded_at: string | null;
};

type MineralSeedDefinition = {
  id: string;
  name: string;
  category: Mineral["category"];
  unit: string;
  description: string;
  mainProducers: string[];
  useCases: string[];
};

const SCRAPER_PRICE_SOURCE = "minealert-scraper";
const SEED_PRICE_SOURCE = "minealert-seed";
const SEED_NEWS_URL_PREFIX = "https://minealert.local/";

const MINERAL_DEFINITIONS: Readonly<Record<string, MineralSeedDefinition>> = {
  XAU: {
    id: "mineral-xau",
    name: "Or",
    category: "precious_metals",
    unit: "oz",
    description: "Metal precieux refuge mondial tres suivi par les investisseurs.",
    mainProducers: ["Chine", "Australie", "Russie", "Canada"],
    useCases: ["Investissement", "Bijoux", "Electronique"],
  },
  XAG: {
    id: "mineral-xag",
    name: "Argent",
    category: "precious_metals",
    unit: "oz",
    description: "Metal precieux a fort usage industriel, notamment dans le solaire.",
    mainProducers: ["Mexique", "Perou", "Chine"],
    useCases: ["Bijoux", "Solaire", "Electronique"],
  },
  XPT: {
    id: "mineral-xpt",
    name: "Platine",
    category: "precious_metals",
    unit: "oz",
    description: "Metal precieux industriel utilise dans les catalyseurs et alliages speciaux.",
    mainProducers: ["Afrique du Sud", "Russie", "Zimbabwe"],
    useCases: ["Catalyseurs", "Bijoux", "Industrie"],
  },
  CU: {
    id: "mineral-cu",
    name: "Cuivre",
    category: "base_metals",
    unit: "lb",
    description: "Metal de base central pour les reseaux electriques et l'electrification.",
    mainProducers: ["Chili", "Perou", "Congo", "Chine"],
    useCases: ["Cables", "Construction", "Vehicules electriques"],
  },
} as const;

/**
 * Analyse le ton d'un texte à partir d'une liste de mots-clés simples.
 */
export function analyseSentiment(text: string): SentimentType {
  const normalizedText = text.toLowerCase();

  const positiveScore = POSITIVE_SENTIMENT_KEYWORDS.reduce(
    (score, keyword) => score + (normalizedText.includes(keyword) ? 1 : 0),
    0
  );
  const negativeScore = NEGATIVE_SENTIMENT_KEYWORDS.reduce(
    (score, keyword) => score + (normalizedText.includes(keyword) ? 1 : 0),
    0
  );

  if (positiveScore > negativeScore) {
    return "positive";
  }

  if (negativeScore > positiveScore) {
    return "negative";
  }

  return "neutral";
}

/**
 * Détecte les minerais mentionnés dans un texte et retourne une liste unique.
 */
export function detectMinerals(text: string): string[] {
  return findKeywordMatches(text, MINERAL_KEYWORDS);
}

/**
 * Détecte les pays mentionnés dans un texte et retourne une liste unique.
 */
export function detectCountries(text: string): string[] {
  return findCountries(text);
}

function roundTo(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return uniqueNonEmpty(values.filter((value): value is string => Boolean(value)));
}

function getMineralDefinition(symbol: string): MineralSeedDefinition {
  const definition = MINERAL_DEFINITIONS[symbol];

  if (definition) {
    return definition;
  }

  return {
    id: `mineral-${symbol.toLowerCase()}`,
    name: symbol,
    category: "base_metals",
    unit: "unit",
    description: `Minerai ${symbol} synchronise par le scraper MineAlert.`,
    mainProducers: [],
    useCases: [],
  };
}

function calculatePriceExtrema(prices: number[]): { low: number; high: number } {
  const validPrices = prices.filter((value) => Number.isFinite(value) && value > 0);
  const fallback = validPrices[0] ?? 0;

  return {
    low: validPrices.length > 0 ? Math.min(...validPrices) : fallback,
    high: validPrices.length > 0 ? Math.max(...validPrices) : fallback,
  };
}

async function runScrapers(
  options: ScraperRunOptions = {}
): Promise<ScrapedData> {
  const [pricesResult, articlesResult] = await Promise.allSettled([
    scrapeMetalPrices({ allowFallback: options.allowFallback }),
    scrapeMiningNews({ allowFallback: options.allowFallback }),
  ]);

  const prices = pricesResult.status === "fulfilled" ? pricesResult.value : [];
  const rawArticles =
    articlesResult.status === "fulfilled" ? articlesResult.value : [];

  const articles = rawArticles.map((article) => {
    const text = [article.title, article.summary, article.content]
      .filter((value): value is string => Boolean(value))
      .join(" ");

    return {
      ...article,
      minerals:
        article.minerals && article.minerals.length > 0
          ? article.minerals
          : detectMinerals(text),
      countries:
        article.countries && article.countries.length > 0
          ? article.countries
          : detectCountries(text),
      sentiment: article.sentiment ?? analyseSentiment(text),
    };
  });

  return {
    pricesUpdated: prices.length,
    articlesScraped: articles.length,
    prices,
    articles,
  };
}

async function persistScrapedData(scrapedData: ScrapedData): Promise<{
  mineralsUpserted: number;
  priceHistoryInserted: number;
  newsArticlesUpserted: number;
  syncedAt: string;
}> {
  const client = createAdminClient();
  const syncedAt = new Date().toISOString();

  const priceEntries = scrapedData.prices.filter(
    (entry): entry is Partial<Mineral> & { symbol: string; currentPrice: number } =>
      typeof entry.symbol === "string" &&
      typeof entry.currentPrice === "number" &&
      Number.isFinite(entry.currentPrice) &&
      entry.currentPrice > 0
  );

  const symbols = [...new Set(priceEntries.map((entry) => entry.symbol.toUpperCase()))];

  let mineralsUpserted = 0;
  let priceHistoryInserted = 0;

  if (symbols.length > 0) {
    const { data: existingMineralsData, error: existingMineralsError } = await client
      .from("minerals")
      .select(
        "id,symbol,name,category,unit,current_price,week_high,week_low,month_high,month_low,currency,description,main_producers,use_cases,image_url"
      )
      .in("symbol", symbols);

    if (existingMineralsError) {
      throw existingMineralsError;
    }

    const existingMinerals = (existingMineralsData ?? []) as PersistedMineralRow[];
    const existingBySymbol = new Map(
      existingMinerals.map((row) => [row.symbol.toUpperCase(), row])
    );
    const managedMineralIds = [
      ...new Set(
        priceEntries.map((entry) => {
          const symbol = entry.symbol.toUpperCase();
          const definition = getMineralDefinition(symbol);
          return existingBySymbol.get(symbol)?.id ?? definition.id;
        })
      ),
    ];

    const { error: deleteSeedHistoryError } = await client
      .from("price_history")
      .delete()
      .in("mineral_id", managedMineralIds)
      .eq("source", SEED_PRICE_SOURCE);

    if (deleteSeedHistoryError) {
      throw deleteSeedHistoryError;
    }

    const monthWindowStart = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: historyData, error: historyError } = managedMineralIds.length
      ? await client
          .from("price_history")
          .select("mineral_id,price,source,recorded_at")
          .in("mineral_id", managedMineralIds)
          .eq("source", SCRAPER_PRICE_SOURCE)
          .gte("recorded_at", monthWindowStart)
      : { data: [], error: null };

    if (historyError) {
      throw historyError;
    }

    const historyRows = (historyData ?? []) as PriceHistoryRow[];
    const historyByMineralId = new Map<string, PriceHistoryRow[]>();

    for (const row of historyRows) {
      const rows = historyByMineralId.get(row.mineral_id) ?? [];
      rows.push(row);
      historyByMineralId.set(row.mineral_id, rows);
    }

    const mineralPayload = priceEntries.map((entry) => {
      const symbol = entry.symbol.toUpperCase();
      const definition = getMineralDefinition(symbol);
      const existing = existingBySymbol.get(symbol);
      const mineralId = existing?.id ?? definition.id;
      const currentPrice = roundTo(entry.currentPrice);
      const monthHistoryRows = (historyByMineralId.get(mineralId) ?? []).sort(
        (firstRow, secondRow) => {
          const firstTime = firstRow.recorded_at
            ? new Date(firstRow.recorded_at).getTime()
            : 0;
          const secondTime = secondRow.recorded_at
            ? new Date(secondRow.recorded_at).getTime()
            : 0;

          return secondTime - firstTime;
        }
      );
      const previousPrice =
        monthHistoryRows.find(
          (row) => typeof row.price === "number" && row.price > 0
        )?.price ?? currentPrice;
      const priceChange24h = roundTo(currentPrice - previousPrice);
      const priceChangePercent =
        previousPrice > 0 ? roundTo((priceChange24h / previousPrice) * 100, 2) : 0;

      const weekHistoryPrices = monthHistoryRows
        .filter((row) => {
          if (!row.recorded_at) {
            return false;
          }

          return (
            new Date(row.recorded_at).getTime() >=
            Date.now() - 7 * 24 * 60 * 60 * 1000
          );
        })
        .map((row) => row.price ?? 0);
      const monthHistoryPrices = monthHistoryRows.map((row) => row.price ?? 0);

      const weekExtrema = calculatePriceExtrema([...weekHistoryPrices, currentPrice]);
      const monthExtrema = calculatePriceExtrema([...monthHistoryPrices, currentPrice]);

      return {
        id: mineralId,
        symbol,
        name: existing?.name ?? entry.name ?? definition.name,
        category: existing?.category ?? definition.category,
        unit: existing?.unit ?? definition.unit,
        current_price: currentPrice,
        price_change_24h: priceChange24h,
        price_change_percent: priceChangePercent,
        week_high: roundTo(weekExtrema.high),
        week_low: roundTo(weekExtrema.low),
        month_high: roundTo(monthExtrema.high),
        month_low: roundTo(monthExtrema.low),
        currency: existing?.currency === "EUR" ? "EUR" : entry.currency ?? "USD",
        description: existing?.description ?? definition.description,
        main_producers: existing?.main_producers ?? definition.mainProducers,
        use_cases: existing?.use_cases ?? definition.useCases,
        image_url: existing?.image_url ?? null,
        is_active: true,
        last_updated: syncedAt,
      };
    });

    const { error: upsertMineralsError } = await client
      .from("minerals")
      .upsert(mineralPayload, { onConflict: "id" });

    if (upsertMineralsError) {
      throw upsertMineralsError;
    }

    const historyPayload = mineralPayload.map((entry) => ({
      mineral_id: entry.id,
      price: entry.current_price,
      currency: entry.currency,
      source: SCRAPER_PRICE_SOURCE,
      recorded_at: syncedAt,
    }));

    const { error: insertHistoryError } = await client
      .from("price_history")
      .insert(historyPayload);

    if (insertHistoryError) {
      throw insertHistoryError;
    }

    mineralsUpserted = mineralPayload.length;
    priceHistoryInserted = historyPayload.length;
  }

  const newsPayload = scrapedData.articles
    .filter(
      (article): article is Partial<NewsArticle> & { title: string; url: string; source: string } =>
        typeof article.title === "string" &&
        article.title.trim().length > 0 &&
        typeof article.url === "string" &&
        article.url.trim().length > 0 &&
        typeof article.source === "string" &&
        article.source.trim().length > 0
    )
    .map((article) => ({
      title: article.title.trim(),
      summary: article.summary?.trim() ?? "",
      content: article.content?.trim() ?? article.summary?.trim() ?? "",
      url: article.url.trim(),
      source: article.source.trim(),
      source_url: article.sourceUrl?.trim() || null,
      published_at: article.publishedAt ?? syncedAt,
      scraped_at: article.scrapedAt ?? syncedAt,
      minerals: uniqueStrings(article.minerals ?? []),
      countries: uniqueStrings(article.countries ?? []),
      sentiment: article.sentiment ?? analyseSentiment(article.title),
      relevance_score: article.relevanceScore ?? 50,
      image_url: article.imageUrl ?? null,
      is_breaking: article.isBreaking ?? false,
    }));

  let newsArticlesUpserted = 0;

  if (newsPayload.length > 0) {
    const { error: deleteSeedNewsError } = await client
      .from("news_articles")
      .delete()
      .like("url", `${SEED_NEWS_URL_PREFIX}%`);

    if (deleteSeedNewsError) {
      throw deleteSeedNewsError;
    }

    const { error: upsertNewsError } = await client
      .from("news_articles")
      .upsert(newsPayload, { onConflict: "url" });

    if (upsertNewsError) {
      throw upsertNewsError;
    }

    newsArticlesUpserted = newsPayload.length;
  }

  return {
    mineralsUpserted,
    priceHistoryInserted,
    newsArticlesUpserted,
    syncedAt,
  };
}

/**
 * Lance les scrapers principaux en parallèle et retourne un résumé exploitable pour la suite.
 */
export async function runAllScrapers(
  options: ScraperRunOptions = {}
): Promise<ScrapedData> {
  return runScrapers(options);
}

/**
 * Lance les scrapers live puis persiste les vraies données dans Supabase.
 */
export async function syncScrapedData(): Promise<ScraperSyncResult> {
  const scrapedData = await runScrapers({ allowFallback: false });
  const persistedSummary = await persistScrapedData(scrapedData);

  return {
    ...scrapedData,
    ...persistedSummary,
  };
}
