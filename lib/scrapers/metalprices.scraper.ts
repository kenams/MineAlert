import { load } from "cheerio";

import type { Mineral } from "@/types";

type PriceSource = {
  url: string;
  parser: (document: string) => number | null;
};

type MetalPriceTarget = {
  symbol: "XAU" | "XAG" | "XPT" | "CU";
  name: string;
  currency: "USD";
  fallbackPrice: number;
  sources: readonly PriceSource[];
};

type ScrapeMetalPricesOptions = {
  allowFallback?: boolean;
};

type ScraperRunStatus = "ok" | "error";

type TargetScrapeResult = {
  entry: Partial<Mineral> | null;
  usedFallback: boolean;
  liveValueFound: boolean;
  errors: string[];
};

type MetalRunLog = {
  timestamp: string;
  source: string;
  articlesCount: number;
  pricesUpdated: number;
  durationMs: number;
  status: ScraperRunStatus;
  error?: string;
  allowFallback: boolean;
  fallbackTargets: number;
  failedTargets: number;
  targetCount: number;
  warning?: string;
};

const SCRAPER_USER_AGENT = "MineAlertBot/1.0";
const FETCH_TIMEOUT_MS = 8000;
const METAL_LOG_SOURCE = "stooq";

const STOOQ_VALUE_SELECTORS = [
  "#aq_x_l",
  "#aq_h_l",
  "span#aq_x_l",
  "span#aq_h_l",
  "td#aq_x_l",
  "td#aq_h_l",
] as const;

const METAL_TARGETS: readonly MetalPriceTarget[] = [
  {
    symbol: "XAU",
    name: "Or",
    currency: "USD",
    fallbackPrice: 1950,
    sources: [
      {
        url: "https://stooq.com/q/l/?s=xauusd",
        parser: extractPriceFromDocument,
      },
    ],
  },
  {
    symbol: "XAG",
    name: "Argent",
    currency: "USD",
    fallbackPrice: 23.5,
    sources: [
      {
        url: "https://stooq.com/q/l/?s=xagusd",
        parser: extractPriceFromDocument,
      },
    ],
  },
  {
    symbol: "XPT",
    name: "Platine",
    currency: "USD",
    fallbackPrice: 950,
    sources: [
      {
        url: "https://stooq.com/q/l/?s=xptusd",
        parser: extractPriceFromDocument,
      },
    ],
  },
  {
    symbol: "CU",
    name: "Cuivre",
    currency: "USD",
    fallbackPrice: 3.85,
    sources: [
      {
        url: "https://stooq.com/q/l/?s=hgusx",
        parser: extractPriceFromDocument,
      },
    ],
  },
] as const;

function logMetalRun(payload: MetalRunLog): void {
  const serialized = JSON.stringify(payload);

  if (payload.status === "error" || payload.warning) {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

/**
 * Récupère le contenu texte d'une source avec timeout et en-têtes défensifs.
 */
async function fetchSourceText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": SCRAPER_USER_AGENT,
        Accept: "text/html, text/plain, */*",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Source indisponible: ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convertit une chaîne numérique hétérogène en nombre exploitable.
 */
function parseNumericValue(rawValue: string): number | null {
  const normalized = rawValue.replace(/\s+/g, "").replace(",", ".");
  const parsedValue = Number(normalized);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

/**
 * Parse explicitement la reponse CSV de Stooq pour eviter les faux positifs regex.
 */
function extractPriceFromStooqCsv(document: string): number | null {
  const firstLine = document.trim().split(/\r?\n/, 1)[0] ?? "";
  const parts = firstLine.split(",").map((part) => part.trim());

  if (parts.length >= 4) {
    const parsedClose = parseNumericValue(parts[3] ?? "");

    if (parsedClose !== null) {
      return parsedClose;
    }
  }

  return null;
}

/**
 * Tente d'extraire une valeur numérique depuis des sélecteurs HTML connus.
 */
function extractPriceFromHtml(document: string): number | null {
  const $ = load(document);

  for (const selector of STOOQ_VALUE_SELECTORS) {
    const selectorText = $(selector).first().text().trim();
    const parsedValue = parseNumericValue(selectorText);

    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return null;
}

/**
 * Tente d'extraire une valeur numérique depuis des expressions simples dans le document.
 */
function extractPriceFromRegex(document: string): number | null {
  const preferredRegexes = [
    /(?:last|close|kurs|price)[^0-9-]*([0-9]+(?:[.,][0-9]+)?)/i,
    /([0-9]+(?:[.,][0-9]+)?)\s*(?:usd|eur)/i,
  ] as const;

  for (const regex of preferredRegexes) {
    const match = document.match(regex);
    const parsedValue = match?.[1] ? parseNumericValue(match[1]) : null;

    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  const genericMatches = document.match(/[0-9]+(?:[.,][0-9]+)?/g) ?? [];

  for (const match of genericMatches) {
    const parsedValue = parseNumericValue(match);

    if (parsedValue !== null && parsedValue < 1000000) {
      return parsedValue;
    }
  }

  return null;
}

/**
 * Extrait un prix probable à partir d'un document HTML ou texte simple.
 */
function extractPriceFromDocument(document: string): number | null {
  return (
    extractPriceFromStooqCsv(document) ??
    extractPriceFromHtml(document) ??
    extractPriceFromRegex(document)
  );
}

/**
 * Construit une entrée de prix minimaliste à partir d'une cible et d'un prix trouvé.
 */
function buildPriceEntry(
  target: MetalPriceTarget,
  currentPrice: number
): Partial<Mineral> {
  return {
    symbol: target.symbol,
    name: target.name,
    currentPrice,
    currency: target.currency,
    lastUpdated: new Date().toISOString(),
    priceChange24h: 0,
    priceChangePercent24h: 0,
  };
}

/**
 * Tente successivement les sources d'une cible et retourne le premier prix exploitable.
 */
async function scrapeTargetPrice(
  target: MetalPriceTarget,
  allowFallback: boolean
): Promise<TargetScrapeResult> {
  const errors: string[] = [];

  for (const source of target.sources) {
    try {
      const rawDocument = await fetchSourceText(source.url);
      const extractedPrice = source.parser(rawDocument);

      if (extractedPrice !== null) {
        return {
          entry: buildPriceEntry(target, extractedPrice),
          usedFallback: false,
          liveValueFound: true,
          errors,
        };
      }

      errors.push(`No numeric price extracted from ${source.url}`);
    } catch {
      errors.push(`Source request failed for ${source.url}`);
      continue;
    }
  }

  if (allowFallback) {
    return {
      entry: buildPriceEntry(target, target.fallbackPrice),
      usedFallback: true,
      liveValueFound: false,
      errors,
    };
  }

  return {
    entry: null,
    usedFallback: false,
    liveValueFound: false,
    errors,
  };
}

/**
 * Récupère les prix des métaux principaux et retourne un fallback mock si nécessaire.
 */
export async function scrapeMetalPrices(
  options: ScrapeMetalPricesOptions = {}
): Promise<Partial<Mineral>[]> {
  const startedAt = Date.now();
  const allowFallback = options.allowFallback ?? true;
  const results = await Promise.allSettled(
    METAL_TARGETS.map((target) => scrapeTargetPrice(target, allowFallback))
  );

  let failedTargets = 0;
  let fallbackTargets = 0;

  const prices = results.flatMap((result, index) => {
    if (result.status !== "fulfilled") {
      failedTargets += 1;
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          source: `${METAL_LOG_SOURCE}:${METAL_TARGETS[index]?.symbol ?? "unknown"}`,
          articlesCount: 0,
          pricesUpdated: 0,
          durationMs: 0,
          status: "error",
          error:
            result.reason instanceof Error
              ? result.reason.message
              : "Unhandled target scraping failure",
        })
      );
      return [];
    }

    if (!result.value.liveValueFound) {
      failedTargets += 1;
    }

    if (result.value.usedFallback) {
      fallbackTargets += 1;
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          source: `${METAL_LOG_SOURCE}:${METAL_TARGETS[index]?.symbol ?? "unknown"}`,
          articlesCount: 0,
          pricesUpdated: 0,
          durationMs: 0,
          status: "error",
          error:
            result.value.errors[0] ?? "No live price returned for target.",
          warning: "fallback_price_used",
        })
      );
    }

    if (!result.value.entry) {
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          source: `${METAL_LOG_SOURCE}:${METAL_TARGETS[index]?.symbol ?? "unknown"}`,
          articlesCount: 0,
          pricesUpdated: 0,
          durationMs: 0,
          status: "error",
          error:
            result.value.errors[0] ?? "No live price returned and fallback disabled.",
          warning: "target_returned_no_price",
        })
      );
      return [];
    }

    return [result.value.entry];
  });

  if (prices.length > 0) {
    logMetalRun({
      timestamp: new Date().toISOString(),
      source: METAL_LOG_SOURCE,
      articlesCount: 0,
      pricesUpdated: prices.length,
      durationMs: Date.now() - startedAt,
      status: failedTargets > 0 && !allowFallback ? "error" : "ok",
      allowFallback,
      fallbackTargets,
      failedTargets,
      targetCount: METAL_TARGETS.length,
      warning:
        failedTargets > 0
          ? allowFallback
            ? "partial_price_failures_with_fallback"
            : "partial_price_failures_detected"
          : undefined,
    });
    return prices;
  }

  const fallbackPrices = allowFallback
    ? METAL_TARGETS.map((target) => buildPriceEntry(target, target.fallbackPrice))
    : [];

  logMetalRun({
    timestamp: new Date().toISOString(),
    source: METAL_LOG_SOURCE,
    articlesCount: 0,
    pricesUpdated: fallbackPrices.length,
    durationMs: Date.now() - startedAt,
    status: "error",
    error: "No live prices returned from upstream sources.",
    allowFallback,
    fallbackTargets: allowFallback ? METAL_TARGETS.length : 0,
    failedTargets: METAL_TARGETS.length,
    targetCount: METAL_TARGETS.length,
    warning: allowFallback
      ? "all_price_targets_using_fallback"
      : "all_price_targets_failed_without_fallback",
  });

  return fallbackPrices;
}
