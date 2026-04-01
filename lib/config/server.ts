import "server-only";

const serverDeprecationWarnings = new Set<string>();

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
