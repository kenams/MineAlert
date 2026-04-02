import "server-only";

import { DATA_FRESHNESS_WARNING_THRESHOLD_MS } from "@/lib/utils/constants";

const serverDeprecationWarnings = new Set<string>();

export type ScraperRuntimeProfile = {
  syncStrategy: "auto_worker" | "scheduled_daily" | "manual";
  expectedRefreshLabel: string;
  expectedFreshnessWindowMs: number | null;
};

function warnServerDeprecated(variableName: string, replacement: string): void {
  const warningKey = `${variableName}->${replacement}`;

  if (serverDeprecationWarnings.has(warningKey)) {
    return;
  }

  serverDeprecationWarnings.add(warningKey);
  console.warn(
    `[MineAlert] "${variableName}" is deprecated. Use "${replacement}" instead.`
  );
}

function readPrimaryOrLegacy(primaryName: string, legacyName: string): string {
  const primaryValue = process.env[primaryName]?.trim() || "";

  if (primaryValue) {
    return primaryValue;
  }

  const legacyValue = process.env[legacyName]?.trim() || "";

  if (legacyValue) {
    warnServerDeprecated(legacyName, primaryName);
    return legacyValue;
  }

  return "";
}

/**
 * Retourne la clé serveur Supabase. Accepte temporairement SUPABASE_SERVICE_KEY comme alias legacy.
 */
export function getSupabaseServiceRoleKey(): string {
  const primaryKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (primaryKey) {
    return primaryKey;
  }

  const legacyKey = process.env.SUPABASE_SERVICE_KEY?.trim() || "";

  if (legacyKey) {
    warnServerDeprecated(
      "SUPABASE_SERVICE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY"
    );
    return legacyKey;
  }

  throw new Error(
    "[MineAlert] Missing SUPABASE_SERVICE_ROLE_KEY on the server."
  );
}

/**
 * Retourne le secret cron si présent. La route /api/scraper décide ensuite si la requête doit être rejetée.
 */
export function getCronSecret(): string | null {
  const value = process.env.CRON_SECRET?.trim() || "";
  return value || null;
}

/**
 * Retourne la clé Resend si elle existe. L'absence est gérée proprement par l'appelant.
 */
export function getResendApiKey(): string | null {
  const value = process.env.RESEND_API_KEY?.trim() || "";
  return value || null;
}

export function isCronSecretConfigured(): boolean {
  return getCronSecret() !== null;
}

export function isResendConfigured(): boolean {
  return getResendApiKey() !== null;
}

export function isScraperAutoSyncEnabled(): boolean {
  return process.env.SCRAPER_AUTO_SYNC_ENABLED !== "false";
}

export function isScraperBootSyncEnabled(): boolean {
  return process.env.SCRAPER_BOOT_SYNC_ENABLED !== "false";
}

export function getScraperCronExpression(): string {
  return (
    readPrimaryOrLegacy("SCRAPER_CRON_EXPRESSION", "SCRAPER_SYNC_CRON") ||
    "*/5 * * * *"
  );
}

export function getConfiguredSiteUrl(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";

  if (siteUrl) {
    return siteUrl;
  }

  const legacyAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";

  if (legacyAppUrl) {
    warnServerDeprecated("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL");
    return legacyAppUrl;
  }

  return null;
}

export function getConfiguredScraperBaseUrl(): string | null {
  const scraperBaseUrl = process.env.SCRAPER_BASE_URL?.trim() || "";

  if (scraperBaseUrl) {
    return scraperBaseUrl;
  }

  const legacyInternalUrl = process.env.SCRAPER_INTERNAL_URL?.trim() || "";

  if (legacyInternalUrl) {
    warnServerDeprecated("SCRAPER_INTERNAL_URL", "SCRAPER_BASE_URL");
    return legacyInternalUrl;
  }

  return getConfiguredSiteUrl();
}

export function getScraperRuntimeProfile(): ScraperRuntimeProfile {
  if (process.env.VERCEL === "1" && !isScraperAutoSyncEnabled()) {
    return {
      syncStrategy: "scheduled_daily",
      expectedRefreshLabel: "quotidienne",
      expectedFreshnessWindowMs: 30 * 60 * 60 * 1000,
    };
  }

  if (isScraperAutoSyncEnabled()) {
    return {
      syncStrategy: "auto_worker",
      expectedRefreshLabel: "frequente",
      expectedFreshnessWindowMs: DATA_FRESHNESS_WARNING_THRESHOLD_MS,
    };
  }

  return {
    syncStrategy: "manual",
    expectedRefreshLabel: "manuelle",
    expectedFreshnessWindowMs: 24 * 60 * 60 * 1000,
  };
}
