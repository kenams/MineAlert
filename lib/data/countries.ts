/**
 * Pays miniers suivis pour la fiche risque : code ISO3 (Banque mondiale) et nom français.
 */
export const MINING_COUNTRIES: ReadonlyArray<{ iso3: string; fr: string }> = [
  { iso3: "AUS", fr: "Australie" },
  { iso3: "CAN", fr: "Canada" },
  { iso3: "CHL", fr: "Chili" },
  { iso3: "PER", fr: "Pérou" },
  { iso3: "COD", fr: "RD Congo" },
  { iso3: "ZAF", fr: "Afrique du Sud" },
  { iso3: "BRA", fr: "Brésil" },
  { iso3: "MEX", fr: "Mexique" },
  { iso3: "ARG", fr: "Argentine" },
  { iso3: "USA", fr: "États-Unis" },
  { iso3: "CHN", fr: "Chine" },
  { iso3: "IDN", fr: "Indonésie" },
  { iso3: "RUS", fr: "Russie" },
  { iso3: "KAZ", fr: "Kazakhstan" },
  { iso3: "GHA", fr: "Ghana" },
  { iso3: "MLI", fr: "Mali" },
  { iso3: "BFA", fr: "Burkina Faso" },
  { iso3: "TZA", fr: "Tanzanie" },
  { iso3: "ZMB", fr: "Zambie" },
  { iso3: "GIN", fr: "Guinée" },
  { iso3: "PNG", fr: "Papouasie-Nouvelle-Guinée" },
  { iso3: "PHL", fr: "Philippines" },
  { iso3: "MNG", fr: "Mongolie" },
  { iso3: "UZB", fr: "Ouzbékistan" },
  { iso3: "POL", fr: "Pologne" },
  { iso3: "SWE", fr: "Suède" },
  { iso3: "FIN", fr: "Finlande" },
  { iso3: "ESP", fr: "Espagne" },
  { iso3: "MAR", fr: "Maroc" },
  { iso3: "NAM", fr: "Namibie" },
  { iso3: "BWA", fr: "Botswana" },
  { iso3: "ZWE", fr: "Zimbabwe" },
  { iso3: "IND", fr: "Inde" },
  { iso3: "TUR", fr: "Turquie" },
  { iso3: "CIV", fr: "Côte d'Ivoire" },
  { iso3: "NER", fr: "Niger" },
  { iso3: "BOL", fr: "Bolivie" },
  { iso3: "COL", fr: "Colombie" },
  { iso3: "ECU", fr: "Équateur" },
  { iso3: "GBR", fr: "Royaume-Uni" },
];

const BY_FR = new Map(MINING_COUNTRIES.map((country) => [country.fr.toLowerCase(), country.iso3]));

/** Retourne le code ISO3 d'un pays à partir de son nom français, ou null. */
export function iso3FromFrenchName(name: string): string | null {
  return BY_FR.get(name.trim().toLowerCase()) ?? null;
}
