import { NextRequest, NextResponse } from "next/server";

import { isLocale, localePath, safeInternalPath, stripLocale, type Locale } from "@/lib/i18n";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/supabase/config";

/**
 * Termine le flux OAuth / email confirmation Supabase puis renvoie vers l'app.
 * Seul un chemin interne (un seul "/" initial) est accepté pour "next" ; la langue suit le préfixe de ce chemin.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextParam = requestUrl.searchParams.get("next");
  const hasNext = safeInternalPath(nextParam, "") !== "";
  const nextPath = safeInternalPath(nextParam, "/dashboard");
  const requestedLocale = stripLocale(nextPath.split(/[?#]/, 1)[0]).locale;

  if (code) {
    const client = createSupabaseServerClient();
    const { data, error } = await client.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sans "next" explicite, la langue choisie à l'inscription (user_metadata) décide de la destination.
      const metadataLocale: unknown = data?.user?.user_metadata?.locale;
      const locale: Locale = hasNext
        ? requestedLocale
        : isLocale(metadataLocale)
          ? metadataLocale
          : "fr";
      const destination = hasNext ? nextPath : localePath(locale, "/dashboard");

      return NextResponse.redirect(new URL(destination, getAppUrl("/")));
    }
  }

  const loginUrl = new URL(localePath(requestedLocale, "/login"), getAppUrl("/"));
  loginUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(loginUrl);
}
