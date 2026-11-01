import { normalizeLabel } from "@/lib/data/countries";
import type { Locale } from "@/lib/i18n/locale";

/** Noms anglais par symbole (la base garde les noms français). */
const NAMES_EN: Record<string, string> = {
  XAU: "Gold",
  XAG: "Silver",
  XPT: "Platinum",
  CU: "Copper",
  U: "Uranium",
  LI: "Lithium",
  NI: "Nickel",
  CO: "Cobalt",
  ZN: "Zinc",
  AL: "Aluminium",
  XPD: "Palladium",
};

const DESCRIPTIONS_EN: Record<string, string> = {
  XAU: "Precious metal and global safe-haven asset.",
  XAG: "Precious and industrial metal, used in electronics and solar panels.",
  XPT: "Precious metal used mainly in catalytic converters and industry.",
  CU: "Base metal essential to electrification and construction.",
  U: "Nuclear fuel, priced mainly through long-term contracts.",
  LI: "Key metal for batteries and the energy transition.",
  NI: "Base metal used in stainless steel and batteries.",
};

/** Nom d'un minerai dans la locale : anglais par symbole, sinon le nom stocké. */
export function mineralName(locale: Locale, symbol: string, storedName: string): string {
  if (locale === "fr") {
    return storedName;
  }

  return NAMES_EN[symbol.toUpperCase()] ?? storedName;
}

/** Description d'un minerai : traduite pour les symboles connus, sinon le texte stocké. */
export function mineralDescription(locale: Locale, symbol: string, storedText: string): string {
  if (locale === "fr") {
    return storedText;
  }

  return DESCRIPTIONS_EN[symbol.toUpperCase()] ?? storedText;
}

/** Clés françaises des minerais d'actualités, avec libellé anglais et alias de saisie. */
const NEWS_MINERALS: ReadonlyArray<{ fr: string; en: string; aliases?: string[] }> = [
  { fr: "or", en: "Gold" },
  { fr: "argent", en: "Silver" },
  { fr: "cuivre", en: "Copper" },
  { fr: "lithium", en: "Lithium" },
  { fr: "cobalt", en: "Cobalt" },
  { fr: "nickel", en: "Nickel" },
  { fr: "uranium", en: "Uranium" },
  { fr: "fer", en: "Iron", aliases: ["iron ore"] },
  { fr: "zinc", en: "Zinc" },
  { fr: "aluminium", en: "Aluminium", aliases: ["aluminum"] },
  { fr: "graphite", en: "Graphite" },
  { fr: "platine", en: "Platinum" },
  { fr: "palladium", en: "Palladium" },
];

const MINERAL_FR_TO_EN = new Map(NEWS_MINERALS.map((item) => [normalizeLabel(item.fr), item.en]));
const MINERAL_LOOKUP = new Map<string, string>();

for (const item of NEWS_MINERALS) {
  MINERAL_LOOKUP.set(normalizeLabel(item.fr), item.fr);
  MINERAL_LOOKUP.set(normalizeLabel(item.en), item.fr);
  for (const alias of item.aliases ?? []) {
    MINERAL_LOOKUP.set(normalizeLabel(alias), item.fr);
  }
}

/** Libellé d'un minerai d'actualité (clé française stockée) dans la locale demandée. */
export function newsMineralLabel(locale: Locale, frenchKey: string): string {
  if (locale === "fr") {
    return frenchKey;
  }

  return MINERAL_FR_TO_EN.get(normalizeLabel(frenchKey)) ?? frenchKey;
}

/** Saisie d'un minerai (français ou anglais) vers la clé française stockée. Inconnu : saisie conservée. */
export function resolveMineralKey(input: string): string {
  const trimmed = input.trim();
  return MINERAL_LOOKUP.get(normalizeLabel(trimmed)) ?? trimmed;
}

/** Clés françaises proposées pour le filtre minerai. */
export const NEWS_MINERAL_KEYS: readonly string[] = NEWS_MINERALS.map((item) => item.fr);
