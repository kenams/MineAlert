import type { Mineral } from "@/types";

type ExtractedPrice = {
  currentPrice: number;
  previousClose?: number | null;
  currency?: string | null;
  quoteTime?: string | null;
};

type PriceSource = {
  name: string;
  url: string;
  responseType: "json" | "text";
  parser: (payload: unknown) => ExtractedPrice | null;
};

type MetalPriceTarget = {
  symbol: "XAU" | "XAG" | "XPT" | "CU" | "U";
  name: string;
  currency: "USD";
  /** Plage de prix plausible : toute valeur hors plage est rejetée comme erreur de source. */
  band: readonly [number, number];
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
  regularMarketTime?: number;
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

const YAHOO = (symbol: string): PriceSource => ({
  name: "yahoo-finance",
  url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
  responseType: "json",
  parser: extractPriceFromYahooChart,
});

const GOLD_API = (symbol: string): PriceSource => ({
  name: "gold-api",
  url: `https://api.gold-api.com/price/${symbol}`,
  responseType: "json",
  parser: extractPriceFromGoldApi,
});

/**
 * Cours indicatifs : contrats à terme COMEX/NYMEX/CME (Yahoo Finance), avec le spot gold-api.com en secours pour les métaux précieux.
 * Aucun prix de repli codé en dur : si aucune source valide ne répond, le minerai n'est pas mis à jour.
 */
const METAL_TARGETS: readonly MetalPriceTarget[] = [
  { symbol: "XAU", name: "Or", currency: "USD", band: [500, 20000], sources: [YAHOO("GC=F"), GOLD_API("XAU")] },
  { symbol: "XAG", name: "Argent", currency: "USD", band: [5, 500], sources: [YAHOO("SI=F"), GOLD_API("XAG")] },
  { symbol: "XPT", name: "Platine", currency: "USD", band: [300, 10000], sources: [YAHOO("PL=F"), GOLD_API("XPT")] },
  { symbol: "CU", name: "Cuivre", currency: "USD", band: [1, 30], sources: [YAHOO("HG=F")] },
  { symbol: "U", name: "Uranium", currency: "USD", band: [5, 500], sources: [YAHOO("UX=F")] },
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
    quoteTime:
      typeof meta.regularMarketTime === "number" && meta.regularMarketTime > 0
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : null,
  };
}

function extractPriceFromGoldApi(payload: unknown): ExtractedPrice | null {
  const body = payload as { price?: unknown; currency?: unknown; updatedAt?: unknown };

  if (typeof body?.price !== "number" || !Number.isFinite(body.price) || body.price <= 0) {
    return null;
  }

  const updatedAt = typeof body.updatedAt === "string" ? Date.parse(body.updatedAt) : Number.NaN;

  return {
    currentPrice: body.price,
    previousClose: null,
    currency: typeof body.currency === "string" ? body.currency : "USD",
    quoteTime: Number.isFinite(updatedAt) ? new Date(updatedAt).toISOString() : null,
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

  return {
    symbol: target.symbol,
    name: target.name,
    currentPrice,
    currency: normalizeCurrency(extractedPrice.currency ?? target.currency),
    lastUpdated: new Date().toISOString(),
    quoteTime: extractedPrice.quoteTime ?? undefined,
    // Variation par rapport à la clôture précédente fournie par la source ; absente si inconnue (jamais 0 par défaut).
    ...(previousClose !== null
      ? {
          priceChange24h: Number((currentPrice - previousClose).toFixed(4)),
          priceChangePercent24h: Number((((currentPrice - previousClose) / previousClose) * 100).toFixed(2)),
        }
      : {}),
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

      if (
        extractedPrice !== null &&
        (extractedPrice.currentPrice < target.band[0] || extractedPrice.currentPrice > target.band[1])
      ) {
        errors.push(`${source.name}: ${target.symbol} price ${extractedPrice.currentPrice} outside plausible band`);
        continue;
      }

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
  const allowFallback = false; // jamais de prix de repli : un cours inventé est pire qu'un cours absent
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

  const fallbackPrices: Partial<Mineral>[] = [];

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
