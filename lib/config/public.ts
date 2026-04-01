type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

const deprecationWarnings = new Set<string>();

function warnDeprecated(variableName: string, replacement: string): void {
  const warningKey = `${variableName}->${replacement}`;

  if (deprecationWarnings.has(warningKey)) {
    return;
  }

  deprecationWarnings.add(warningKey);
  console.warn(
    `[MineAlert] "${variableName}" is deprecated. Use "${replacement}" instead.`
  );
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

function validateAbsoluteUrl(value: string, variableName: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(
      `[MineAlert] "${variableName}" must be an absolute URL. Received "${value}".`
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(
      `[MineAlert] "${variableName}" must start with http:// or https://.`
    );
  }

  return parsedUrl.toString();
}

function readSupabasePublishableKey(): string | null {
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

  if (publishableKey) {
    return publishableKey;
  }

  const legacyAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "";

  if (legacyAnonKey) {
    warnDeprecated(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
    return legacyAnonKey;
  }

  return null;
}

function readSupabasePublicConfigRaw(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "";
  const publishableKey = readSupabasePublishableKey();

  if (!url || !publishableKey) {
    return null;
  }

  return {
    url: validateAbsoluteUrl(url, "NEXT_PUBLIC_SUPABASE_URL"),
    publishableKey,
  };
}

function readSiteUrlRaw(): string | null {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";

  if (siteUrl) {
    return siteUrl;
  }

  const legacyAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";

  if (legacyAppUrl) {
    warnDeprecated("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL");
    return legacyAppUrl;
  }

  return null;
}

/**
 * Retourne la configuration publique Supabase. En production, échoue explicitement si elle est incomplète.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const config = readSupabasePublicConfigRaw();

  if (config) {
    return config;
  }

  if (isProductionEnvironment()) {
    throw new Error(
      "[MineAlert] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in production."
    );
  }

  return null;
}

/**
 * Indique si Supabase est réellement branché. En production, échoue explicitement si la config publique est absente.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

/**
 * Retourne l'URL publique canonique de l'application. En production, elle est obligatoire.
 */
export function getSiteUrl(): string {
  const configuredSiteUrl = readSiteUrlRaw();

  if (configuredSiteUrl) {
    return validateAbsoluteUrl(configuredSiteUrl, "NEXT_PUBLIC_SITE_URL");
  }

  if (isProductionEnvironment()) {
    throw new Error(
      "[MineAlert] Missing NEXT_PUBLIC_SITE_URL in production."
    );
  }

  return "http://localhost:3000/";
}

/**
 * Construit une URL absolue de l'application, utile pour les redirects d'auth.
 */
export function getAppUrl(pathname = "/"): string {
  return new URL(pathname, getSiteUrl()).toString();
}
