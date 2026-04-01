import type { User } from "@supabase/supabase-js";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Erreur standardisée quand une ressource protégée est appelée sans session valide.
 */
export class UnauthorizedError extends Error {
  constructor(message = "Authentification requise.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Retourne l'utilisateur Supabase authentifié s'il existe.
 */
export async function getAuthenticatedUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    return null;
  }

  return user ?? null;
}

/**
 * Exige un utilisateur authentifié et lève une erreur sinon.
 */
export async function requireAuthenticatedUser(): Promise<User> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}
