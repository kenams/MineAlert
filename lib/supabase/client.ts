import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

let hasWarnedMissingBrowserConfig = false;
let browserClient: SupabaseClient | null = null;

/**
 * Lit la configuration Supabase côté navigateur et retourne null si elle est incomplète.
 */
function getSupabaseBrowserConfig() {
  const config = getSupabasePublicConfig();

  if (config) {
    return config;
  }

  if (
    process.env.NODE_ENV === "development" &&
    !hasWarnedMissingBrowserConfig
  ) {
      hasWarnedMissingBrowserConfig = true;
      console.warn(
        "[MineAlert] Supabase navigateur non configuré. " +
        "Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY pour activer Supabase."
      );
    }

  return null;
}

/**
 * Crée un client factice qui échoue explicitement uniquement au moment de l'utilisation.
 */
function createDisabledBrowserClient(): SupabaseClient {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Supabase n'est pas configuré côté navigateur. " +
            "Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
        );
      },
    }
  ) as unknown as SupabaseClient;
}

/**
 * Crée le client Supabase côté navigateur sans casser le build si la configuration est absente.
 */
export function createClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const config = getSupabaseBrowserConfig();

  browserClient = config
    ? createBrowserClient(config.url, config.publishableKey)
    : createDisabledBrowserClient();

  return browserClient;
}

/**
 * Instance réutilisable côté navigateur, sûre à importer même en mode démo.
 */
export const supabase = createClient();
