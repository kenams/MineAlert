import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { localePath, stripLocale } from "@/lib/i18n/paths";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

const SKIPPED_PREFIXES = ["/api", "/auth", "/_next"];

function shouldSkip(pathname: string): boolean {
  if (SKIPPED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  // Fichiers statiques (favicon.ico, sitemap.xml, robots.txt, images...).
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
}

/**
 * Routage des langues (français sans préfixe, anglais sous /en), session Supabase et protection du dashboard.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  if (shouldSkip(pathname)) {
    return NextResponse.next();
  }

  // /fr/... explicite : le français n'a pas de préfixe.
  if (pathname === "/fr" || pathname.startsWith("/fr/")) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  const { locale, path } = stripLocale(pathname);
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/fr${path === "/" ? "" : path}`;

  const createResponse = () =>
    locale === "fr"
      ? NextResponse.rewrite(rewriteUrl, { request: { headers: request.headers } })
      : NextResponse.next({ request: { headers: request.headers } });

  const isDashboardRoute = path === "/dashboard" || path.startsWith("/dashboard/");
  const isAuthRoute = path === "/login" || path === "/register";

  if (!isDashboardRoute && !isAuthRoute) {
    return createResponse();
  }

  const redirectToLogin = () => {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = localePath(locale, "/login");
    loginUrl.search = "";
    loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  };

  const config = getSupabasePublicConfig();

  if (!config) {
    return createResponse();
  }

  // Sans cookie de session Supabase, inutile d'appeler l'API d'authentification.
  if (!hasSupabaseSessionCookie(request)) {
    return isDashboardRoute ? redirectToLogin() : createResponse();
  }

  let response = createResponse();
  let user: unknown = null;

  try {
    const supabase = createServerClient(config.url, config.publishableKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = createResponse();
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = createResponse();
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    });

    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    // Supabase injoignable : une page publique reste servie, le dashboard exige une session vérifiable.
    return isDashboardRoute ? redirectToLogin() : createResponse();
  }

  if (isDashboardRoute && !user) {
    return redirectToLogin();
  }

  if (isAuthRoute && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = localePath(locale, "/dashboard");
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
