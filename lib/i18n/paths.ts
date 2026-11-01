import { PREFIXED_LOCALE, type Locale } from "./locale";

const EN_PREFIX = `/${PREFIXED_LOCALE}`;

/**
 * Retire le préfixe /en d'un chemin et indique la locale détectée.
 */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  if (pathname === EN_PREFIX) {
    return { locale: "en", path: "/" };
  }

  if (pathname.startsWith(`${EN_PREFIX}/`)) {
    return { locale: "en", path: pathname.slice(EN_PREFIX.length) };
  }

  // Rendu statique : la réécriture interne expose /fr/... au lieu de l'URL publique sans préfixe.
  if (pathname === "/fr") {
    return { locale: "fr", path: "/" };
  }

  if (pathname.startsWith("/fr/")) {
    return { locale: "fr", path: pathname.slice(3) };
  }

  return { locale: "fr", path: pathname };
}

/**
 * Construit un chemin interne dans la locale demandée : le français reste sans préfixe, l'anglais passe sous /en.
 * Un chemin déjà préfixé n'est jamais préfixé deux fois.
 */
export function localePath(locale: Locale, path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const pathOnly = normalized.split(/[?#]/, 1)[0];
  const suffix = normalized.slice(pathOnly.length);
  const { path: bare } = stripLocale(pathOnly);

  if (locale !== PREFIXED_LOCALE) {
    return `${bare}${suffix}`;
  }

  return `${bare === "/" ? EN_PREFIX : `${EN_PREFIX}${bare}`}${suffix}`;
}

/**
 * Chemin interne sûr : un seul "/" initial, ni "//", ni "/\", ni schéma, ni caractère de contrôle. Sinon le fallback.
 */
export function safeInternalPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  if (/[\u0000-\u001f\\]/.test(value)) {
    return fallback;
  }

  return value;
}
