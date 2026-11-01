import type { Locale } from "@/lib/i18n/locale";

type ItemInfo = { fr: string; en: string };

/**
 * Rubriques du formulaire 8-K en français et en anglais (miroir de lib/sync/edgar.ts, qui garde la catégorie et la priorité).
 * 9.01 (pièces jointes) est ignorée.
 */
const ITEM_INFO: Record<string, ItemInfo> = {
  "1.01": { fr: "accord important signé", en: "material agreement signed" },
  "1.02": { fr: "résiliation d'un accord important", en: "termination of a material agreement" },
  "1.05": { fr: "incident de cybersécurité", en: "cybersecurity incident" },
  "2.01": { fr: "acquisition ou cession d'actifs", en: "acquisition or disposition of assets" },
  "2.02": { fr: "résultats financiers", en: "financial results" },
  "2.03": { fr: "nouvelle dette ou engagement financier", en: "new debt or financial obligation" },
  "2.04": { fr: "accélération d'une dette", en: "acceleration of a debt obligation" },
  "2.05": { fr: "coûts de restructuration", en: "restructuring costs" },
  "2.06": { fr: "dépréciation d'actifs", en: "asset impairment" },
  "3.01": { fr: "avis de non-conformité à la cote", en: "notice of listing non-compliance" },
  "3.02": { fr: "émission d'actions non enregistrée (financement)", en: "unregistered share issuance (financing)" },
  "3.03": { fr: "modification des droits des actionnaires", en: "change to shareholder rights" },
  "4.01": { fr: "changement de commissaire aux comptes", en: "change of auditor" },
  "4.02": { fr: "comptes publiés jugés non fiables", en: "previously issued financials no longer reliable" },
  "5.01": { fr: "changement de contrôle", en: "change in control" },
  "5.02": { fr: "départ ou nomination de dirigeants", en: "departure or appointment of officers" },
  "5.03": { fr: "modification des statuts", en: "amendment to articles or bylaws" },
  "5.07": { fr: "résultats des votes des actionnaires", en: "shareholder vote results" },
  "7.01": { fr: "communication d'information (Regulation FD)", en: "information disclosure (Regulation FD)" },
  "8.01": { fr: "autre événement jugé important", en: "other event deemed material" },
};

/**
 * Titre d'un dépôt SEC dans la locale, calculé à partir du formulaire, des rubriques et du nom de la société.
 */
export function filingTitle(
  locale: Locale,
  companyName: string,
  form: string,
  items: string[] | null | undefined
): string {
  if (form === "6-K") {
    return locale === "fr"
      ? `${companyName} : document déposé auprès de la SEC (formulaire 6-K)`
      : `${companyName}: document filed with the SEC (Form 6-K)`;
  }

  const labels = (items ?? [])
    .map((code) => ITEM_INFO[code])
    .filter((info): info is ItemInfo => Boolean(info))
    .map((info) => info[locale]);

  if (labels.length === 0) {
    return locale === "fr"
      ? `${companyName} : dépôt 8-K auprès de la SEC`
      : `${companyName}: 8-K filing with the SEC`;
  }

  return locale === "fr"
    ? `${companyName} : ${labels.join(" ; ")}`
    : `${companyName}: ${labels.join("; ")}`;
}
