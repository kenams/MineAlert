import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import cron from "node-cron";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnv(path.join(process.cwd(), ".env.local"));

const AUTO_SYNC_LOG_SOURCE = "auto-sync-worker";
const deprecationWarnings = new Set();
const isProductionRuntime =
  process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

function warnDeprecated(variableName, replacement) {
  const warningKey = `${variableName}->${replacement}`;

  if (deprecationWarnings.has(warningKey)) {
    return;
  }

  deprecationWarnings.add(warningKey);
  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      source: AUTO_SYNC_LOG_SOURCE,
      articlesCount: 0,
      pricesUpdated: 0,
      durationMs: 0,
      status: "ok",
      reason: "startup",
      warning: `${variableName}_deprecated_use_${replacement}`,
    })
  );
}

function readPrimaryOrLegacy(primaryName, legacyName) {
  const primaryValue = process.env[primaryName]?.trim() || "";

  if (primaryValue) {
    return primaryValue;
  }

  const legacyValue = process.env[legacyName]?.trim() || "";

  if (legacyValue) {
    warnDeprecated(legacyName, primaryName);
    return legacyValue;
  }

  return "";
}

function readConfiguredBaseUrl() {
  const directValue = process.env.SCRAPER_BASE_URL?.trim() || "";

  if (directValue) {
    return {
      value: directValue,
      variableName: "SCRAPER_BASE_URL",
    };
  }

  const legacyInternalUrl = process.env.SCRAPER_INTERNAL_URL?.trim() || "";

  if (legacyInternalUrl) {
    warnDeprecated("SCRAPER_INTERNAL_URL", "SCRAPER_BASE_URL");
    return {
      value: legacyInternalUrl,
      variableName: "SCRAPER_INTERNAL_URL",
    };
  }

  const canonicalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";

  if (canonicalSiteUrl) {
    return {
      value: canonicalSiteUrl,
      variableName: "NEXT_PUBLIC_SITE_URL",
    };
  }

  const legacyAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";

  if (legacyAppUrl) {
    warnDeprecated("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL");
    return {
      value: legacyAppUrl,
      variableName: "NEXT_PUBLIC_APP_URL",
    };
  }

  return null;
}

function validateAbsoluteUrl(value, variableName) {
  let parsedUrl;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(
      `Invalid ${variableName}: expected an absolute URL, received "${value}".`
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(
      `Invalid ${variableName}: expected http:// or https://, received "${value}".`
    );
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

function getBaseUrl() {
  const configuredBaseUrl = readConfiguredBaseUrl();

  if (configuredBaseUrl) {
    return validateAbsoluteUrl(
      configuredBaseUrl.value,
      configuredBaseUrl.variableName
    );
  }

  if (isProductionRuntime) {
    throw new Error(
      "Missing SCRAPER_BASE_URL or NEXT_PUBLIC_SITE_URL in production."
    );
  }

  return "http://localhost:3000";
}

function getCronExpression() {
  return (
    readPrimaryOrLegacy("SCRAPER_CRON_EXPRESSION", "SCRAPER_SYNC_CRON") ||
    "*/5 * * * *"
  );
}

function getCronSecret() {
  const cronSecret = process.env.CRON_SECRET?.trim() || "";

  if (cronSecret) {
    return cronSecret;
  }

  if (isProductionRuntime && process.env.SCRAPER_AUTO_SYNC_ENABLED !== "false") {
    throw new Error("Missing CRON_SECRET for the auto-sync worker.");
  }

  return "";
}

const isEnabled = process.env.SCRAPER_AUTO_SYNC_ENABLED !== "false";
const shouldRunBootSync = process.env.SCRAPER_BOOT_SYNC_ENABLED !== "false";
let cronExpression = "";
let baseUrl = "";
let cronSecret = "";

let syncInFlight = false;

function logSyncEvent(payload) {
  const serialized = JSON.stringify(payload);

  if (payload.status === "error" || payload.warning) {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

function buildHeaders() {
  const headers = {
    Accept: "application/json",
  };

  if (cronSecret) {
    headers.Authorization = `Bearer ${cronSecret}`;
  }

  return headers;
}

async function waitForServer(maxAttempts = 40) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/login`, {
        headers: { Accept: "text/html" },
        redirect: "manual",
      });

      if (response.ok || response.status === 307 || response.status === 308) {
        return true;
      }
    } catch {
      // server not ready yet
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  return false;
}

async function runSync(reason) {
  if (syncInFlight) {
    return;
  }

  syncInFlight = true;
  const startedAt = Date.now();

  try {
    const response = await fetch(`${baseUrl}/api/scraper`, {
      headers: buildHeaders(),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        payload?.error || `Scraper sync failed with status ${response.status}`
      );
    }

    logSyncEvent({
      timestamp: new Date().toISOString(),
      source: AUTO_SYNC_LOG_SOURCE,
      articlesCount: payload?.articlesScraped ?? 0,
      pricesUpdated: payload?.pricesUpdated ?? 0,
      durationMs: Date.now() - startedAt,
      status:
        payload?.warning || payload?.freshnessStatus === "stale" ? "error" : "ok",
      latestDataAt: payload?.latestDataAt ?? null,
      latestDataAgeMs: payload?.latestDataAgeMs ?? null,
      reason,
      syncedAt: payload?.syncedAt ?? null,
      warning: payload?.warning,
    });
  } catch (error) {
    logSyncEvent({
      timestamp: new Date().toISOString(),
      source: AUTO_SYNC_LOG_SOURCE,
      articlesCount: 0,
      pricesUpdated: 0,
      durationMs: Date.now() - startedAt,
      status: "error",
      reason,
      error: error instanceof Error ? error.message : "Auto sync failed",
    });
  } finally {
    syncInFlight = false;
  }
}

async function main() {
  if (!isEnabled) {
    logSyncEvent({
      timestamp: new Date().toISOString(),
      source: AUTO_SYNC_LOG_SOURCE,
      articlesCount: 0,
      pricesUpdated: 0,
      durationMs: 0,
      status: "ok",
      reason: "startup",
      warning: "auto_sync_disabled",
    });
    return;
  }

  cronExpression = getCronExpression();
  baseUrl = getBaseUrl();
  cronSecret = getCronSecret();

  if (!cron.validate(cronExpression)) {
    logSyncEvent({
      timestamp: new Date().toISOString(),
      source: AUTO_SYNC_LOG_SOURCE,
      articlesCount: 0,
      pricesUpdated: 0,
      durationMs: 0,
      status: "error",
      reason: "startup",
      error: `Invalid cron expression "${cronExpression}"`,
    });
    process.exitCode = 1;
    return;
  }

  logSyncEvent({
    timestamp: new Date().toISOString(),
    source: AUTO_SYNC_LOG_SOURCE,
    articlesCount: 0,
    pricesUpdated: 0,
    durationMs: 0,
    status: "ok",
    reason: "startup",
    baseUrl,
    cronExpression,
  });

  const serverReady = await waitForServer();

  if (!serverReady) {
    logSyncEvent({
      timestamp: new Date().toISOString(),
      source: AUTO_SYNC_LOG_SOURCE,
      articlesCount: 0,
      pricesUpdated: 0,
      durationMs: 0,
      status: "error",
      reason: "startup",
      error: "Target server did not become ready in time",
    });
  } else if (shouldRunBootSync) {
    await runSync("boot");
  }

  cron.schedule(
    cronExpression,
    () => {
      void runSync("cron");
    },
    { timezone: "UTC" }
  );
}

main().catch((error) => {
  logSyncEvent({
    timestamp: new Date().toISOString(),
    source: AUTO_SYNC_LOG_SOURCE,
    articlesCount: 0,
    pricesUpdated: 0,
    durationMs: 0,
    status: "error",
    reason: "startup",
    error: error instanceof Error ? error.message : "Worker crashed",
  });
  process.exit(1);
});
