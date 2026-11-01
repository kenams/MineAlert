/**
 * Pays miniers suivis pour la fiche risque : code ISO3 (Banque mondiale) et noms français et anglais.
 */
export const MINING_COUNTRIES: ReadonlyArray<{ iso3: string; fr: string; en: string }> = [
  { iso3: "AUS", fr: "Australie", en: "Australia" },
  { iso3: "CAN", fr: "Canada", en: "Canada" },
  { iso3: "CHL", fr: "Chili", en: "Chile" },
  { iso3: "PER", fr: "Pérou", en: "Peru" },
  { iso3: "COD", fr: "RD Congo", en: "DR Congo" },
  { iso3: "ZAF", fr: "Afrique du Sud", en: "South Africa" },
  { iso3: "BRA", fr: "Brésil", en: "Brazil" },
  { iso3: "MEX", fr: "Mexique", en: "Mexico" },
  { iso3: "ARG", fr: "Argentine", en: "Argentina" },
  { iso3: "USA", fr: "États-Unis", en: "United States" },
  { iso3: "CHN", fr: "Chine", en: "China" },
  { iso3: "IDN", fr: "Indonésie", en: "Indonesia" },
  { iso3: "RUS", fr: "Russie", en: "Russia" },
  { iso3: "KAZ", fr: "Kazakhstan", en: "Kazakhstan" },
  { iso3: "GHA", fr: "Ghana", en: "Ghana" },
  { iso3: "MLI", fr: "Mali", en: "Mali" },
  { iso3: "BFA", fr: "Burkina Faso", en: "Burkina Faso" },
  { iso3: "TZA", fr: "Tanzanie", en: "Tanzania" },
  { iso3: "ZMB", fr: "Zambie", en: "Zambia" },
  { iso3: "GIN", fr: "Guinée", en: "Guinea" },
  { iso3: "PNG", fr: "Papouasie-Nouvelle-Guinée", en: "Papua New Guinea" },
  { iso3: "PHL", fr: "Philippines", en: "Philippines" },
  { iso3: "MNG", fr: "Mongolie", en: "Mongolia" },
  { iso3: "UZB", fr: "Ouzbékistan", en: "Uzbekistan" },
  { iso3: "POL", fr: "Pologne", en: "Poland" },
  { iso3: "SWE", fr: "Suède", en: "Sweden" },
  { iso3: "FIN", fr: "Finlande", en: "Finland" },
  { iso3: "ESP", fr: "Espagne", en: "Spain" },
  { iso3: "MAR", fr: "Maroc", en: "Morocco" },
  { iso3: "NAM", fr: "Namibie", en: "Namibia" },
  { iso3: "BWA", fr: "Botswana", en: "Botswana" },
  { iso3: "ZWE", fr: "Zimbabwe", en: "Zimbabwe" },
  { iso3: "IND", fr: "Inde", en: "India" },
  { iso3: "TUR", fr: "Turquie", en: "Turkey" },
  { iso3: "CIV", fr: "Côte d'Ivoire", en: "Ivory Coast" },
  { iso3: "NER", fr: "Niger", en: "Niger" },
  { iso3: "BOL", fr: "Bolivie", en: "Bolivia" },
  { iso3: "COL", fr: "Colombie", en: "Colombia" },
  { iso3: "ECU", fr: "Équateur", en: "Ecuador" },
  { iso3: "GBR", fr: "Royaume-Uni", en: "United Kingdom" },
];

const BY_FR = new Map(MINING_COUNTRIES.map((country) => [country.fr.toLowerCase(), country.iso3]));

/** Retourne le code ISO3 d'un pays à partir de son nom français, ou null. */
export function iso3FromFrenchName(name: string): string | null {
  return BY_FR.get(name.trim().toLowerCase()) ?? null;
}

/**
 * Normalise un libellé pour comparaison : minuscules, sans accents ni ponctuation superflue.
 */
export function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Libellés français stockés par les scrapers d'actualités, avec équivalent anglais et alias de saisie. */
const NEWS_COUNTRIES: ReadonlyArray<{ fr: string; en: string; aliases?: string[] }> = [
  { fr: "Congo", en: "Congo", aliases: ["drc", "dr congo", "democratic republic of the congo", "rdc", "rd congo"] },
  { fr: "Chili", en: "Chile" },
  { fr: "Australie", en: "Australia" },
  { fr: "Chine", en: "China" },
  { fr: "Russie", en: "Russia" },
  { fr: "Canada", en: "Canada" },
  { fr: "Pérou", en: "Peru" },
  { fr: "Argentine", en: "Argentina" },
  { fr: "Afrique du Sud", en: "South Africa" },
  { fr: "Indonésie", en: "Indonesia" },
  { fr: "Kazakhstan", en: "Kazakhstan" },
  { fr: "Namibie", en: "Namibia" },
  { fr: "Brésil", en: "Brazil" },
  { fr: "États-Unis", en: "United States", aliases: ["usa", "us", "u s", "united states of america", "america"] },
  { fr: "Mexique", en: "Mexico" },
];

const COUNTRY_FR_TO_EN = new Map<string, string>();
const COUNTRY_LOOKUP = new Map<string, string>();

for (const country of MINING_COUNTRIES) {
  COUNTRY_FR_TO_EN.set(normalizeLabel(country.fr), country.en);
  COUNTRY_LOOKUP.set(normalizeLabel(country.fr), country.fr);
  COUNTRY_LOOKUP.set(normalizeLabel(country.en), country.fr);
}

for (const country of NEWS_COUNTRIES) {
  COUNTRY_FR_TO_EN.set(normalizeLabel(country.fr), country.en);
  COUNTRY_LOOKUP.set(normalizeLabel(country.fr), country.fr);
  COUNTRY_LOOKUP.set(normalizeLabel(country.en), country.fr);
  for (const alias of country.aliases ?? []) {
    COUNTRY_LOOKUP.set(normalizeLabel(alias), country.fr);
  }
}

/** Nom d'un pays dans la locale demandée à partir du nom français stocké. Inconnu : valeur d'origine. */
export function countryLabel(locale: "fr" | "en", frenchName: string): string {
  if (locale === "fr") {
    return frenchName;
  }

  return COUNTRY_FR_TO_EN.get(normalizeLabel(frenchName)) ?? frenchName;
}

/** Nom français ou anglais d'un pays saisi vers le libellé français stocké. Inconnu : saisie conservée. */
export function resolveCountryKey(input: string): string {
  const trimmed = input.trim();
  return COUNTRY_LOOKUP.get(normalizeLabel(trimmed)) ?? trimmed;
}

/** Libellés français des pays d'actualités (suggestions de filtre). */
export const NEWS_COUNTRY_KEYS: readonly string[] = NEWS_COUNTRIES.map((country) => country.fr);
