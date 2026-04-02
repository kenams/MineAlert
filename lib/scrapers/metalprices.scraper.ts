import { load } from "cheerio";

import type { Mineral } from "@/types";

type ExtractedPrice = {
  currentPrice: number;
  previousClose?: number | null;
  currency?: string | null;
};

type PriceSource = {
  name: string;
  url: string;
  responseType: "json" | "text";
  parser: (payload: unknown) => ExtractedPrice | null;
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

type YahooChartMeta = {
  currency?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: YahooChartMeta;
    }>;
  };
};

const SCRAPER_USER_AGENT = "MineAlertBot/1.0";
const FETCH_TIMEOUT_MS = 8000;
const METAL_LOG_SOURCE = "free-market-data";

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
        name: "yahoo-finance",
        url: "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d",
        responseType: "json",
        parser: extractPriceFromYahooChart,
      },
      {
        name: "stooq",
        url: "https://stooq.com/q/l/?s=xauusd",
        responseType: "text",
        parser: extractPriceFromStooqDocument,
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
        name: "yahoo-finance",
        url: "https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1m&range=1d",
        responseType: "json",
        parser: extractPriceFromYahooChart,
      },
      {
        name: "stooq",
        url: "https://stooq.com/q/l/?s=xagusd",
        responseType: "text",
        parser: extractPriceFromStooqDocument,
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
        name: "yahoo-finance",
        url: "https://query1.finance.yahoo.com/v8/finance/chart/PL=F?interval=1m&range=1d",
        responseType: "json",
        parser: extractPriceFromYahooChart,
      },
      {
        name: "stooq",
        url: "https://stooq.com/q/l/?s=xptusd",
        responseType: "text",
        parser: extractPriceFromStooqDocument,
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
        name: "yahoo-finance",
        url: "https://query1.finance.yahoo.com/v8/finance/chart/HG=F?interval=1m&range=1d",
        responseType: "json",
        parser: extractPriceFromYahooChart,
      },
      {
        name: "stooq",
        url: "https://stooq.com/q/l/?s=hgusx",
        responseType: "text",
        parser: extractPriceFromStooqDocument,
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

async function fetchSourcePayload(
  url: string,
  responseType: PriceSource["responseType"]
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": SCRAPER_USER_AGENT,
        Accept:
          responseType === "json"
            ? "application/json, text/plain, */*"
            : "text/html, text/plain, */*",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Source unavailable: ${response.status}`);
    }

    if (responseType === "json") {
      return (await response.json()) as unknown;
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function parseNumericValue(rawValue: string): number | null {
  const normalized = rawValue.replace(/\s+/g, "").replace(",", ".");
  const parsedValue = Number(normalized);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function normalizeCurrency(rawValue: string | null | undefined): Mineral["currency"] {
  return rawValue === "EUR" ? "EUR" : "USD";
}

function extractPriceFromYahooChart(payload: unknown): ExtractedPrice | null {
  const response = payload as YahooChartResponse;
  const meta = response.chart?.result?.[0]?.meta;

  if (!meta) {
    return null;
  }

  const currentPrice =
    typeof meta.regularMarketPrice === "number" && meta.regularMarketPrice > 0
      ? meta.regularMarketPrice
      : null;

  if (currentPrice === null) {
    return null;
  }

  const previousCloseCandidate =
    typeof meta.previousClose === "number" && meta.previousClose > 0
      ? meta.previousClose
      : typeof meta.chartPreviousClose === "number" && meta.chartPreviousClose > 0
        ? meta.chartPreviousClose
        : null;

  return {
    currentPrice,
    previousClose: previousCloseCandidate,
    currency: meta.currency ?? null,
  };
}

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

function extractPriceFromStooqDocument(payload: unknown): ExtractedPrice | null {
  if (typeof payload !== "string") {
    return null;
  }

  const currentPrice =
    extractPriceFromStooqCsv(payload) ??
    extractPriceFromHtml(payload) ??
    extractPriceFromRegex(payload);

  if (currentPrice === null) {
    return null;
  }

  return {
    currentPrice,
    previousClose: null,
    currency: "USD",
  };
}

function buildPriceEntry(
  target: MetalPriceTarget,
  extractedPrice: ExtractedPrice
): Partial<Mineral> {
  const currentPrice = Number(extractedPrice.currentPrice.toFixed(4));
  const previousClose =
    typeof extractedPrice.previousClose === "number" &&
    extractedPrice.previousClose > 0
      ? extractedPrice.previousClose
      : null;
  const priceChange24h =
    previousClose !== null
      ? Number((currentPrice - previousClose).toFixed(4))
      : 0;
  const priceChangePercent24h =
    previousClose !== null && previousClose > 0
      ? Number((((currentPrice - previousClose) / previousClose) * 100).toFixed(2))
      : 0;

  return {
    symbol: target.symbol,
    name: target.name,
    currentPrice,
    currency: normalizeCurrency(extractedPrice.currency ?? target.currency),
    lastUpdated: new Date().toISOString(),
    priceChange24h,
    priceChangePercent24h,
  };
}

async function scrapeTargetPrice(
  target: MetalPriceTarget,
  allowFallback: boolean
): Promise<TargetScrapeResult> {
  const errors: string[] = [];

  for (const source of target.sources) {
    try {
      const payload = await fetchSourcePayload(source.url, source.responseType);
      const extractedPrice = source.parser(payload);

      if (extractedPrice !== null) {
        return {
          entry: buildPriceEntry(target, extractedPrice),
          usedFallback: false,
          liveValueFound: true,
          errors,
        };
      }

      errors.push(`No numeric price extracted from ${source.name}:${source.url}`);
    } catch (error) {
      errors.push(
        error instanceof Error
          ? `${source.name} request failed: ${error.message}`
          : `${source.name} request failed`
      );
      continue;
    }
  }

  if (allowFallback) {
    return {
      entry: buildPriceEntry(target, {
        currentPrice: target.fallbackPrice,
        currency: target.currency,
      }),
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
          error: result.value.errors[0] ?? "No live price returned for target.",
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
    ? METAL_TARGETS.map((target) =>
        buildPriceEntry(target, {
          currentPrice: target.fallbackPrice,
          currency: target.currency,
        })
      )
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
