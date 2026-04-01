import { NextRequest, NextResponse } from "next/server";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/supabase/config";

/**
 * Termine le flux OAuth / email confirmation Supabase puis renvoie vers l'app.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next");
  const safeNextPath =
    nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard";

  if (code) {
    const client = createSupabaseServerClient();
    const { error } = await client.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNextPath, getAppUrl("/")));
    }
  }

  const loginUrl = new URL("/login", getAppUrl("/"));
  loginUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(loginUrl);
}
