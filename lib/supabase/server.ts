import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

let hasWarnedMissingServerConfig = false;

/**
 * Lit la configuration Supabase côté serveur et retourne null si elle est incomplète.
 */
function getSupabaseServerConfig() {
  const config = getSupabasePublicConfig();

  if (config) {
    return config;
  }

  if (
    process.env.NODE_ENV === "development" &&
    !hasWarnedMissingServerConfig
  ) {
      hasWarnedMissingServerConfig = true;
      console.warn(
        "[MineAlert] Supabase serveur non configuré. " +
        "Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY pour activer Supabase."
      );
    }

  return null;
}

/**
 * Crée un client factice côté serveur qui échoue seulement lorsqu'il est réellement utilisé.
 */
function createDisabledServerClient(): SupabaseClient {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Supabase n'est pas configuré côté serveur. " +
            "Renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
        );
      },
    }
  ) as unknown as SupabaseClient;
}

/**
 * Crée un client Supabase côté serveur compatible App Router et tolérant aux contextes sans écriture cookie.
 */
export function createClient(): SupabaseClient {
  const config = getSupabaseServerConfig();

  if (!config) {
    return createDisabledServerClient();
  }

  const cookieStore = cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `[MineAlert] Impossible d'écrire le cookie Supabase "${name}" dans ce contexte serveur.`
            );
          }
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `[MineAlert] Impossible de supprimer le cookie Supabase "${name}" dans ce contexte serveur.`
            );
          }
        }
      },
    },
  });
}
