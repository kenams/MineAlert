import "server-only";

import type { createAdminClient } from "@/lib/supabase/admin";
import { isLocale, type Locale } from "@/lib/i18n";

/**
 * Lit la langue des utilisateurs (colonne users.locale). Tant que la migration n'est pas appliquée, tout le monde reste en français.
 */
export async function getUserLocales(
  client: ReturnType<typeof createAdminClient>,
  userIds: string[]
): Promise<Map<string, Locale>> {
  const locales = new Map<string, Locale>();

  if (userIds.length === 0) {
    return locales;
  }

  const { data, error } = await client.from("users").select("id,locale").in("id", userIds);

  if (error || !data) {
    return locales;
  }

  for (const row of data as Array<{ id: string; locale?: string | null }>) {
    if (isLocale(row.locale)) {
      locales.set(row.id, row.locale);
    }
  }

  return locales;
}
