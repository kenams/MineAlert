type KeywordDictionary = Readonly<Record<string, readonly string[]>>;

/**
 * Dictionnaire des mots-clés servant à détecter les minerais dans les contenus.
 */
export const MINERAL_KEYWORDS: KeywordDictionary = {
  or: ["gold", "or", "aurifere", "aurifère", "bullion"],
  argent: ["silver", "argent"],
  cuivre: ["copper", "cuivre", "cuprifere", "cuprifère"],
  lithium: ["lithium", "li-ion", "lithium-ion"],
  cobalt: ["cobalt", "cobaltifere", "cobaltifère"],
  nickel: ["nickel"],
  uranium: ["uranium", "yellowcake"],
  fer: ["iron ore", "iron", "fer", "minerai de fer"],
  zinc: ["zinc"],
  aluminium: ["aluminium", "aluminum"],
  graphite: ["graphite", "anode graphite"],
  platine: ["platinum", "platine"],
  palladium: ["palladium", "palladium metal"],
} as const;

/**
 * Liste des pays stratégiques surveillés dans les actualités minières.
 */
export const COUNTRY_KEYWORDS: KeywordDictionary = {
  Congo: [
    "congo",
    "rdc",
    "republique democratique du congo",
    "république démocratique du congo",
  ],
  Chili: ["chile", "chili"],
  Australie: ["australia", "australie"],
  Chine: ["china", "chine"],
  Russie: ["russia", "russie"],
  Canada: ["canada"],
  Pérou: ["peru", "pérou", "perou"],
  Argentine: ["argentina", "argentine"],
  "Afrique du Sud": ["south africa", "afrique du sud"],
  Indonésie: ["indonesia", "indonesie", "indonésie"],
  Kazakhstan: ["kazakhstan"],
  Namibie: ["namibia", "namibie"],
  Brésil: ["brazil", "bresil", "brésil"],
  "États-Unis": ["united states", "usa", "u.s.", "us ", "etats-unis", "états-unis"],
  Mexique: ["mexico", "mexique"],
} as const;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordToRegex(keyword: string): RegExp {
  const normalizedKeyword = normalizeScraperText(keyword).trim();
  const needsWordBoundary =
    !normalizedKeyword.includes(" ") &&
    /^[a-z0-9.-]+$/i.test(normalizedKeyword);

  return new RegExp(
    needsWordBoundary
      ? `(^|[^a-z0-9])${escapeRegex(normalizedKeyword)}([^a-z0-9]|$)`
      : escapeRegex(normalizedKeyword),
    "i"
  );
}

/**
 * Normalise une chaîne pour simplifier les comparaisons de mots-clés.
 */
export function normalizeScraperText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

/**
 * Retourne une liste unique de libellés dont au moins un mot-clé est présent dans le texte.
 */
export function findKeywordMatches(
  text: string,
  dictionary: KeywordDictionary
): string[] {
  const normalizedText = normalizeScraperText(text);
  const matches = Object.entries(dictionary).flatMap(([label, keywords]) =>
    keywords.some((keyword) => keywordToRegex(keyword).test(normalizedText))
      ? [label]
      : []
  );

  return [...new Set(matches)];
}

/**
 * Retourne une liste unique de pays détectés dans le texte.
 */
export function findCountries(text: string): string[] {
  return findKeywordMatches(text, COUNTRY_KEYWORDS);
}

/**
 * Retourne une date ISO valide ou la date courante si la source est inexploitable.
 */
export function toSafeIsoDate(value?: string | null): string {
  if (!value) {
    return new Date().toISOString();
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString();
}

/**
 * Retourne une URL absolue valide ou une chaîne vide si la valeur n'est pas exploitable.
 */
export function toSafeUrl(value: string, baseUrl?: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

/**
 * Supprime les doublons et les valeurs vides dans une liste de chaînes.
 */
export function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
