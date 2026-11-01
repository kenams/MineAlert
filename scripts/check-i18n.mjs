// Vérifie la cohérence des dictionnaires fr/en. Exécuter avec : node --experimental-strip-types scripts/check-i18n.mjs
import { en } from "../lib/i18n/dictionaries/en.ts";
import { fr } from "../lib/i18n/dictionaries/fr.ts";

const frKeys = Object.keys(fr);
const enKeys = Object.keys(en);
const missingInEn = frKeys.filter((key) => !(key in en));
const missingInFr = enKeys.filter((key) => !(key in fr));
const emptyEn = enKeys.filter((key) => typeof en[key] !== "string" || en[key].trim() === "");
const placeholders = (value) => (value.match(/\{\w+\}/g) ?? []).sort().join(",");
const placeholderMismatch = frKeys.filter((key) => key in en && placeholders(fr[key]) !== placeholders(en[key]));
// Marques, noms propres et valeurs techniques identiques dans les deux langues.
const allowedIdentical = new Set([
  "plan.pro",
  "plan.business",
  "nav.dashboard",
  "mineStatus.active",
  "mineStatus.exploration",
  "alertCard.active",
  "map.legendExploration",
  "dataMode.live",
  "news.breaking",
  "common.stable",
  "settings.autoSync",
  "settings.bootSync",
]);
const identical = frKeys.filter((key) => key in en && fr[key] === en[key] && !allowedIdentical.has(key));

console.log(`fr: ${frKeys.length} clés, en: ${enKeys.length} clés`);
console.log(`Absentes en EN : ${missingInEn.length ? missingInEn.join(", ") : "aucune"}`);
console.log(`Absentes en FR : ${missingInFr.length ? missingInFr.join(", ") : "aucune"}`);
console.log(`Valeurs EN vides : ${emptyEn.length ? emptyEn.join(", ") : "aucune"}`);
console.log(`Variables {x} différentes : ${placeholderMismatch.length ? placeholderMismatch.join(", ") : "aucune"}`);
console.log(`Valeurs EN identiques au FR (hors marques autorisées) : ${identical.length ? identical.join(", ") : "aucune"}`);

if (missingInEn.length || missingInFr.length || emptyEn.length || placeholderMismatch.length) {
  process.exit(1);
}
