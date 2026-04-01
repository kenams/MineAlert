import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleKey } from "@/lib/config/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Cree un client Supabase serveur privilegie pour les taches backend non liees a une session utilisateur.
 */
export function createAdminClient(): SupabaseClient {
  const publicConfig = getSupabasePublicConfig();

  if (!publicConfig?.url) {
    throw new Error(
      "[MineAlert] Missing NEXT_PUBLIC_SUPABASE_URL on the server."
    );
  }

  return createSupabaseClient(publicConfig.url, getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
