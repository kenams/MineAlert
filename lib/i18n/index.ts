import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { DEFAULT_LOCALE, type Locale } from "./locale";

export { DEFAULT_LOCALE, LOCALES, isLocale, type Locale } from "./locale";
export { localePath, safeInternalPath, stripLocale } from "./paths";

export type DictKey = keyof typeof fr;
export type Dictionary = Record<DictKey, string>;
export type TranslateFn = (key: DictKey, vars?: Record<string, string | number>) => string;

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Retourne une fonction de traduction avec interpolation {variable}.
 */
export function createT(locale: Locale): TranslateFn {
  const dictionary = getDictionary(locale);

  return (key, vars) => {
    const template = dictionary[key] ?? fr[key] ?? key;

    if (!vars) {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match
    );
  };
}
