import "server-only";

import { getScraperRuntimeProfile } from "@/lib/config/server";
import { syncScrapedData } from "@/lib/scrapers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const ON_DEMAND_SYNC_MIN_INTERVAL_MS = 15 * 60 * 1000;
const ON_DEMAND_SYNC_STALE_THRESHOLD_MS = 15 * 60 * 1000;

type OnDemandSyncState = {
  inFlight: boolean;
  lastAttemptAt: number;
  lastSuccessAt: number;
};

declare global {
  var __minealertOnDemandSyncState: OnDemandSyncState | undefined;
}

function getOnDemandSyncState(): OnDemandSyncState {
  if (!globalThis.__minealertOnDemandSyncState) {
    globalThis.__minealertOnDemandSyncState = {
      inFlight: false,
      lastAttemptAt: 0,
      lastSuccessAt: 0,
    };
  }

  return globalThis.__minealertOnDemandSyncState;
}

async function getLatestDataAgeMs(): Promise<number | null> {
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

  const timestamps = [
    latestMineralResult.data?.last_updated,
    latestNewsResult.data?.scraped_at,
  ]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return Math.max(0, Date.now() - Math.max(...timestamps));
}

export async function maybeRunOnDemandSync(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const runtimeProfile = getScraperRuntimeProfile();

  if (runtimeProfile.syncStrategy === "auto_worker") {
    return false;
  }

  const state = getOnDemandSyncState();

  if (state.inFlight) {
    return false;
  }

  if (Date.now() - state.lastAttemptAt < ON_DEMAND_SYNC_MIN_INTERVAL_MS) {
    return false;
  }

  const latestDataAgeMs = await getLatestDataAgeMs();

  if (
    latestDataAgeMs !== null &&
    latestDataAgeMs < ON_DEMAND_SYNC_STALE_THRESHOLD_MS
  ) {
    return false;
  }

  state.inFlight = true;
  state.lastAttemptAt = Date.now();

  try {
    const result = await syncScrapedData();
    state.lastSuccessAt = Date.now();

    console.info(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        source: "on-demand-sync",
        articlesCount: result.articlesScraped,
        pricesUpdated: result.pricesUpdated,
        durationMs: Date.now() - state.lastAttemptAt,
        status: "ok",
      })
    );

    return true;
  } catch (error) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        source: "on-demand-sync",
        articlesCount: 0,
        pricesUpdated: 0,
        durationMs: Date.now() - state.lastAttemptAt,
        status: "error",
        error:
          error instanceof Error ? error.message : "On-demand sync failed",
      })
    );
    return false;
  } finally {
    state.inFlight = false;
  }
}
