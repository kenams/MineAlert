import { NextRequest, NextResponse } from "next/server";

import { getCronSecret } from "@/lib/config/server";
import { syncScrapedData } from "@/lib/scrapers";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const FRESHNESS_WARNING_THRESHOLD_MS = 10 * 60 * 1000;
const SYNC_LOG_SOURCE = "scraper-sync-api";

type ScraperSyncLog = {
  timestamp: string;
  source: string;
  articlesCount: number;
  pricesUpdated: number;
  durationMs: number;
  status: "ok" | "error";
  error?: string;
  latestDataAt?: string | null;
  latestDataAgeMs?: number | null;
  warning?: string;
};

function logScraperSync(payload: ScraperSyncLog): void {
  const serialized = JSON.stringify(payload);

  if (payload.status === "error" || payload.warning) {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

async function getLatestDataFreshness(): Promise<{
  latestDataAt: string | null;
  latestDataAgeMs: number | null;
  isFresh: boolean;
}> {
  const client = createAdminClient();

  const [latestMineralResult, latestNewsResult] = await Promise.all([
    client
      .from("minerals")
      .select("last_updated")
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("news_articles")
      .select("scraped_at")
      .order("scraped_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (latestMineralResult.error) {
    throw latestMineralResult.error;
  }

  if (latestNewsResult.error) {
    throw latestNewsResult.error;
  }

  const mineralTimestamp =
    latestMineralResult.data &&
    typeof latestMineralResult.data.last_updated === "string"
      ? latestMineralResult.data.last_updated
      : null;
  const newsTimestamp =
    latestNewsResult.data &&
    typeof latestNewsResult.data.scraped_at === "string"
      ? latestNewsResult.data.scraped_at
      : null;

  const timestamps = [mineralTimestamp, newsTimestamp]
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return {
      latestDataAt: null,
      latestDataAgeMs: null,
      isFresh: false,
    };
  }

  const latestTimestamp = Math.max(...timestamps);
  const latestDataAt = new Date(latestTimestamp).toISOString();
  const latestDataAgeMs = Math.max(0, Date.now() - latestTimestamp);

  return {
    latestDataAt,
    latestDataAgeMs,
    isFresh: latestDataAgeMs <= FRESHNESS_WARNING_THRESHOLD_MS,
  };
}

/**
 * Declenche manuellement les scrapers live avec protection optionnelle par secret.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const expectedSecret = getCronSecret();
  const providedSecret = request.headers.get("X-Cron-Secret");
  const authorizationHeader = request.headers.get("Authorization");
  const bearerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : null;

  const isAuthorized =
    Boolean(expectedSecret) &&
    (providedSecret === expectedSecret || bearerToken === expectedSecret);

  if (!isAuthorized) {
    logScraperSync({
      timestamp: new Date().toISOString(),
      source: SYNC_LOG_SOURCE,
      articlesCount: 0,
      pricesUpdated: 0,
      durationMs: Date.now() - startedAt,
      status: "error",
      error: "Unauthorized scraper sync request.",
    });

    return NextResponse.json(
      { success: false, error: "Acces non autorise." },
      { status: 401 }
    );
  }

  try {
    const result = await syncScrapedData();
    const freshness = await getLatestDataFreshness();
    const durationMs = Date.now() - startedAt;
    const warning =
      result.articlesScraped === 0 && result.pricesUpdated === 0
        ? "sync_returned_no_fresh_data"
        : !freshness.isFresh
          ? "no_fresh_data_for_more_than_10_minutes"
          : undefined;

    logScraperSync({
      timestamp: new Date().toISOString(),
      source: SYNC_LOG_SOURCE,
      articlesCount: result.articlesScraped,
      pricesUpdated: result.pricesUpdated,
      durationMs,
      status: warning ? "error" : "ok",
      latestDataAt: freshness.latestDataAt,
      latestDataAgeMs: freshness.latestDataAgeMs,
      warning,
    });

    return NextResponse.json({
      success: true,
      articlesScraped: result.articlesScraped,
      pricesUpdated: result.pricesUpdated,
      newsArticlesUpserted: result.newsArticlesUpserted,
      mineralsUpserted: result.mineralsUpserted,
      priceHistoryInserted: result.priceHistoryInserted,
      syncedAt: result.syncedAt,
      durationMs,
      latestDataAt: freshness.latestDataAt,
      latestDataAgeMs: freshness.latestDataAgeMs,
      freshnessStatus: freshness.isFresh ? "fresh" : "stale",
      warning,
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Le scraping n'a pas pu etre execute.";

    logScraperSync({
      timestamp: new Date().toISOString(),
      source: SYNC_LOG_SOURCE,
      articlesCount: 0,
      pricesUpdated: 0,
      durationMs,
      status: "error",
      error: errorMessage,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        durationMs,
      },
      { status: 500 }
    );
  }
}
