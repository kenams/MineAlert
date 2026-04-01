import { createHash } from "node:crypto";

import { load } from "cheerio";
import { parseStringPromise } from "xml2js";

import type { NewsArticle } from "@/types";

import {
  MINERAL_KEYWORDS,
  findCountries,
  findKeywordMatches,
  toSafeIsoDate,
  toSafeUrl,
  uniqueNonEmpty,
} from "./shared";

type NewsSource = {
  source: string;
  sourceUrl: string;
  feedUrl: string;
};

type RssItem = {
  title?: unknown;
  link?: unknown;
  description?: unknown;
  summary?: unknown;
  content?: unknown;
  "content:encoded"?: unknown;
  pubDate?: unknown;
  published?: unknown;
  updated?: unknown;
  source?: unknown;
};

type ParsedChannel = {
  item?: unknown[];
};

type ParsedFeed = {
  entry?: unknown[];
};

const SCRAPER_USER_AGENT = "MineAlertBot/1.0";
const FETCH_TIMEOUT_MS = 8000;
const MAX_ARTICLES = 50;
const MAX_ARTICLE_AGE_DAYS = 45;

const RSS_SOURCES: readonly NewsSource[] = [
  {
    source: "Google News",
    sourceUrl: "https://news.google.com",
    feedUrl:
      "https://news.google.com/rss/search?q=mining+commodities&hl=en-US&gl=US&ceid=US:en",
  },
  {
    source: "Google News",
    sourceUrl: "https://news.google.com",
    feedUrl:
      "https://news.google.com/rss/search?q=gold+mining&hl=en-US&gl=US&ceid=US:en",
  },
  {
    source: "Google News",
    sourceUrl: "https://news.google.com",
    feedUrl:
      "https://news.google.com/rss/search?q=copper+mining&hl=en-US&gl=US&ceid=US:en",
  },
  {
    source: "Google News",
    sourceUrl: "https://news.google.com",
    feedUrl:
      "https://news.google.com/rss/search?q=lithium+mining&hl=en-US&gl=US&ceid=US:en",
  },
  {
    source: "Google News",
    sourceUrl: "https://news.google.com",
    feedUrl:
      "https://news.google.com/rss/search?q=uranium+mining&hl=en-US&gl=US&ceid=US:en",
  },
] as const;

const RELEVANCE_KEYWORDS = [
  "mine",
  "mining",
  "metal",
  "commodity",
  "exploration",
  "production",
  "deposit",
  "battery",
  "project",
  "smelter",
  "ore",
] as const;

const MOCK_ARTICLES: Partial<NewsArticle>[] = [
  {
    id: "mock-news-1",
    title: "Le cuivre reste soutenu par la demande infrastructurelle",
    summary:
      "Les analystes observent un regain d'intérêt pour le cuivre sur fond de dépenses énergétiques et industrielles.",
    content:
      "Les flux restent orientés vers le cuivre, notamment au Chili et en Chine, avec un sentiment constructif.",
    url: "https://example.com/mock/cuivre-hausse",
    source: "Reuters",
    sourceUrl: "https://www.reuters.com",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["cuivre"],
    countries: ["Chili", "Chine"],
    sentiment: "positive",
    relevanceScore: 86,
    isBreaking: false,
  },
  {
    id: "mock-news-2",
    title: "Le lithium surveillé après plusieurs annonces de capacité",
    summary:
      "Le marché du lithium reste prudent malgré des anticipations de reprise de la demande batteries.",
    content:
      "L'Australie et l'Argentine demeurent au centre des discussions sur l'équilibre du marché du lithium.",
    url: "https://example.com/mock/lithium-marche",
    source: "Mining.com",
    sourceUrl: "https://www.mining.com",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["lithium"],
    countries: ["Australie", "Argentine"],
    sentiment: "neutral",
    relevanceScore: 79,
    isBreaking: false,
  },
  {
    id: "mock-news-3",
    title: "L'or profite d'un regain d'aversion au risque",
    summary:
      "Le métal jaune attire les capitaux défensifs dans un environnement plus incertain.",
    content:
      "L'or retrouve un rôle de refuge alors que les marchés anticipent davantage de volatilité globale.",
    url: "https://example.com/mock/or-refuge",
    source: "Kitco",
    sourceUrl: "https://www.kitco.com",
    publishedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    scrapedAt: new Date().toISOString(),
    minerals: ["or"],
    countries: ["États-Unis"],
    sentiment: "positive",
    relevanceScore: 90,
    isBreaking: true,
  },
] as const;

type ScrapeMiningNewsOptions = {
  allowFallback?: boolean;
};

type ScraperRunStatus = "ok" | "error";

type MiningRunLog = {
  timestamp: string;
  source: string;
  articlesCount: number;
  pricesUpdated: number;
  durationMs: number;
  status: ScraperRunStatus;
  error?: string;
  allowFallback: boolean;
  fallbackUsed: boolean;
  sourceFailures: number;
  sourceCount: number;
  warning?: string;
};

const MINING_LOG_SOURCE = "google-news-rss";

function logMiningRun(payload: MiningRunLog): void {
  const serialized = JSON.stringify(payload);

  if (payload.status === "error" || payload.warning) {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

/**
 * Récupère le contenu d'un flux RSS avec timeout et en-têtes défensifs.
 */
async function fetchFeedXml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": SCRAPER_USER_AGENT,
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Flux RSS indisponible: ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Retourne une chaîne propre à partir d'une valeur XML hétérogène.
 */
function readXmlText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const firstValue = value[0];

    if (typeof firstValue === "string") {
      return firstValue.trim();
    }

    if (
      typeof firstValue === "object" &&
      firstValue !== null &&
      "_" in firstValue &&
      typeof firstValue._ === "string"
    ) {
      return firstValue._.trim();
    }
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_" in value &&
    typeof value._ === "string"
  ) {
    return value._.trim();
  }

  return "";
}

/**
 * Nettoie un fragment HTML issu d'un flux RSS en texte lisible.
 */
function cleanHtmlSnippet(value: string): string {
  if (!value) {
    return "";
  }

  const text = load(`<div>${value}</div>`).text();

  return text.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

/**
 * Extrait une URL d'un item RSS ou Atom sans supposer un format unique.
 */
function readLinkValue(value: unknown, baseUrl: string): string {
  if (typeof value === "string") {
    return toSafeUrl(value, baseUrl);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string") {
        const safeUrl = toSafeUrl(entry, baseUrl);

        if (safeUrl) {
          return safeUrl;
        }
      }

      if (
        typeof entry === "object" &&
        entry !== null &&
        "$" in entry &&
        typeof entry.$ === "object" &&
        entry.$ !== null &&
        "href" in entry.$ &&
        typeof entry.$.href === "string"
      ) {
        const safeUrl = toSafeUrl(entry.$.href, baseUrl);

        if (safeUrl) {
          return safeUrl;
        }
      }
    }
  }

  return "";
}

/**
 * Extrait le média source d'un item RSS ou Atom lorsque le flux l'expose.
 */
function readSourceValue(value: unknown): { label: string; url: string } {
  if (typeof value === "string") {
    return { label: value.trim(), url: "" };
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === "string" && entry.trim()) {
        return { label: entry.trim(), url: "" };
      }

      if (typeof entry === "object" && entry !== null) {
        const label =
          "_" in entry && typeof entry._ === "string" ? entry._.trim() : "";
        const url =
          "$" in entry &&
          typeof entry.$ === "object" &&
          entry.$ !== null &&
          "url" in entry.$ &&
          typeof entry.$.url === "string"
            ? entry.$.url.trim()
            : "";

        if (label || url) {
          return { label, url };
        }
      }
    }
  }

  if (typeof value === "object" && value !== null) {
    const label =
      "_" in value && typeof value._ === "string" ? value._.trim() : "";
    const url =
      "$" in value &&
      typeof value.$ === "object" &&
      value.$ !== null &&
      "url" in value.$ &&
      typeof value.$.url === "string"
        ? value.$.url.trim()
        : "";

    if (label || url) {
      return { label, url };
    }
  }

  return { label: "", url: "" };
}

/**
 * Extrait les items RSS ou Atom d'un document xml2js sans supposer une seule structure.
 */
function extractFeedItems(parsedXml: unknown): RssItem[] {
  if (typeof parsedXml !== "object" || parsedXml === null) {
    return [];
  }

  if ("rss" in parsedXml) {
    const rssValue = parsedXml.rss;

    if (
      typeof rssValue === "object" &&
      rssValue !== null &&
      "channel" in rssValue &&
      Array.isArray(rssValue.channel)
    ) {
      const firstChannel = rssValue.channel[0] as ParsedChannel | undefined;

      if (firstChannel?.item && Array.isArray(firstChannel.item)) {
        return firstChannel.item as RssItem[];
      }
    }
  }

  if ("feed" in parsedXml) {
    const feedValue = parsedXml.feed;

    if (typeof feedValue === "object" && feedValue !== null) {
      const typedFeed = feedValue as ParsedFeed;

      if (typedFeed.entry && Array.isArray(typedFeed.entry)) {
        return typedFeed.entry as RssItem[];
      }
    }
  }

  return [];
}

/**
 * Calcule un score de pertinence simple basé sur les mots-clés et la densité sectorielle.
 */
export function calculateRelevanceScore(text: string): number {
  const normalizedText = text.toLowerCase();

  const keywordHits = RELEVANCE_KEYWORDS.reduce(
    (count, keyword) => count + (normalizedText.includes(keyword) ? 1 : 0),
    0
  );

  const mineralHits = findKeywordMatches(text, MINERAL_KEYWORDS).length;
  const countryHits = findCountries(text).length;
  const rawScore = 30 + keywordHits * 6 + mineralHits * 14 + countryHits * 6;

  return Math.max(0, Math.min(100, rawScore));
}

/**
 * Supprime les doublons d'articles à partir de leur URL normalisée.
 */
export function dedupeArticles(
  articles: Partial<NewsArticle>[]
): Partial<NewsArticle>[] {
  const seenUrls = new Set<string>();
  const seenTitleSource = new Set<string>();

  return articles.filter((article) => {
    if (!article.url) {
      return false;
    }

    const normalizedTitleSource = `${article.source ?? ""}::${article.title ?? ""}`
      .trim()
      .toLowerCase();

    if (seenUrls.has(article.url) || (normalizedTitleSource && seenTitleSource.has(normalizedTitleSource))) {
      return false;
    }

    seenUrls.add(article.url);
    if (normalizedTitleSource) {
      seenTitleSource.add(normalizedTitleSource);
    }
    return true;
  });
}

/**
 * Transforme un item RSS ou Atom en article partiel enrichi pour MineAlert.
 */
export function normalizeRssItem(
  item: RssItem,
  source: NewsSource
): Partial<NewsArticle> | null {
  const title = readXmlText(item.title);
  const url = readLinkValue(item.link, source.sourceUrl);
  const summary = cleanHtmlSnippet(
    readXmlText(item.description) || readXmlText(item.summary)
  );
  const content =
    cleanHtmlSnippet(readXmlText(item["content:encoded"]) || readXmlText(item.content)) ||
    summary;
  const itemSource = readSourceValue(item.source);

  if (!title || !url) {
    return null;
  }

  const fullText = uniqueNonEmpty([title, summary, content]).join(" ");
  const minerals = findKeywordMatches(fullText, MINERAL_KEYWORDS);
  const countries = findCountries(fullText);
  const relevanceScore = calculateRelevanceScore(fullText);
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 16);

  return {
    id: `${source.source.toLowerCase().replace(/\s+/g, "-")}-${hash}`,
    title,
    url,
    summary,
    content,
    source: itemSource.label || source.source,
    sourceUrl: itemSource.url || source.sourceUrl,
    publishedAt: toSafeIsoDate(
      readXmlText(item.pubDate) ||
        readXmlText(item.published) ||
        readXmlText(item.updated)
    ),
    scrapedAt: new Date().toISOString(),
    minerals,
    countries,
    sentiment: "neutral",
    relevanceScore,
    isBreaking: relevanceScore >= 90,
  };
}

/**
 * Récupère les actualités minières depuis plusieurs flux RSS, avec fallback mock si nécessaire.
 */
export async function scrapeMiningNews(
  options: ScrapeMiningNewsOptions = {}
): Promise<Partial<NewsArticle>[]> {
  const startedAt = Date.now();
  const allowFallback = options.allowFallback ?? true;
  let sourceFailures = 0;

  try {
    const settledResults = await Promise.allSettled(
      RSS_SOURCES.map(async (source) => {
        try {
          const xml = await fetchFeedXml(source.feedUrl);
          const parsedXml = await parseStringPromise(xml, {
            trim: true,
            explicitArray: true,
            mergeAttrs: false,
          });

          return extractFeedItems(parsedXml)
            .map((item) => normalizeRssItem(item, source))
            .filter((article): article is Partial<NewsArticle> => article !== null);
        } catch (error) {
          sourceFailures += 1;
          console.warn(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              source: `${MINING_LOG_SOURCE}:${source.feedUrl}`,
              articlesCount: 0,
              pricesUpdated: 0,
              durationMs: 0,
              status: "error" satisfies ScraperRunStatus,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown RSS source failure",
            })
          );
          return [] as Partial<NewsArticle>[];
        }
      })
    );

    const articles = settledResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    );

    const dedupedArticles = dedupeArticles(articles)
      .filter((article) => {
        if (!article.publishedAt) {
          return true;
        }

        return (
          new Date(article.publishedAt).getTime() >=
          Date.now() - MAX_ARTICLE_AGE_DAYS * 24 * 60 * 60 * 1000
        );
      })
      .sort((firstArticle, secondArticle) => {
        const firstDate = firstArticle.publishedAt
          ? new Date(firstArticle.publishedAt).getTime()
          : 0;
        const secondDate = secondArticle.publishedAt
          ? new Date(secondArticle.publishedAt).getTime()
          : 0;

        return secondDate - firstDate;
      })
      .slice(0, MAX_ARTICLES);

    if (dedupedArticles.length > 0) {
      logMiningRun({
        timestamp: new Date().toISOString(),
        source: MINING_LOG_SOURCE,
        articlesCount: dedupedArticles.length,
        pricesUpdated: 0,
        durationMs: Date.now() - startedAt,
        status: "ok",
        allowFallback,
        fallbackUsed: false,
        sourceFailures,
        sourceCount: RSS_SOURCES.length,
        warning:
          sourceFailures > 0
            ? "partial_source_failures_detected"
            : undefined,
      });

      return dedupedArticles;
    }

    const fallbackArticles = allowFallback ? [...MOCK_ARTICLES] : [];
    const warning = allowFallback
      ? "rss_empty_result_using_fallback"
      : "rss_empty_result_without_fallback";

    logMiningRun({
      timestamp: new Date().toISOString(),
      source: MINING_LOG_SOURCE,
      articlesCount: fallbackArticles.length,
      pricesUpdated: 0,
      durationMs: Date.now() - startedAt,
      status: "error",
      error: "No articles returned from upstream RSS feeds.",
      allowFallback,
      fallbackUsed: allowFallback,
      sourceFailures,
      sourceCount: RSS_SOURCES.length,
      warning,
    });

    return fallbackArticles;
  } catch (error) {
    logMiningRun({
      timestamp: new Date().toISOString(),
      source: MINING_LOG_SOURCE,
      articlesCount: 0,
      pricesUpdated: 0,
      durationMs: Date.now() - startedAt,
      status: "error",
      error:
        error instanceof Error ? error.message : "Unhandled mining scraper error",
      allowFallback,
      fallbackUsed: false,
      sourceFailures,
      sourceCount: RSS_SOURCES.length,
    });

    return allowFallback ? [...MOCK_ARTICLES] : [];
  }
}
