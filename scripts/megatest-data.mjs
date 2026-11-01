// Contrôle d'exactitude des données de MineAlert en production : compare à des sources indépendantes.
// Usage : node scripts/megatest-data.mjs  (aucune clé secrète : API publique + clé publiable Supabase en lecture seule)
const SITE = process.env.SITE_URL ?? "https://mine-alert-kenams.vercel.app";
const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://ekgvudpqjvrqlnkphkoz.supabase.co";
const PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_0mi-hX3tiQkL_aT9nKQv2Q_BUeY7G9X";
const SEC_UA = "KAH Digital Studio (MineAlert tests) kahdigital42@gmail.com";

const YAHOO = { XAU: "GC=F", XAG: "SI=F", XPT: "PL=F", CU: "HG=F", U: "UX=F" };
const SPOT = { XAU: "XAU", XAG: "XAG", XPT: "XPT" };
const BANDS = { XAU: [500, 20000], XAG: [5, 500], XPT: [300, 10000], CU: [1, 30], U: [5, 500] };
const UNITS = { XAU: "oz", XAG: "oz", XPT: "oz", CU: "lb", U: "lb" };

const results = [];
const check = (id, points, ok, detail) => results.push({ id, points, ok: Boolean(ok), detail });

async function json(url, init) {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000), ...init });
  if (!response.ok) throw new Error(`${url} -> ${response.status}`);
  return response.json();
}

const prices = await json(`${SITE}/api/prix`);
const bySymbol = Object.fromEntries(prices.map((m) => [m.symbol, m]));

check("A0 minerais affichés = minerais avec source en direct", 2,
  Object.keys(YAHOO).every((s) => bySymbol[s]) && !bySymbol.LI && !bySymbol.NI,
  `affichés : ${prices.map((m) => m.symbol).join(", ")}`);

// A1 : Yahoo (source brute) vs valeur affichée, et A4 : variation = clôture précédente de la source
let a1 = true, a4 = true, a1d = [], a4d = [];
for (const [symbol, ticker] of Object.entries(YAHOO)) {
  const m = bySymbol[symbol];
  if (!m) { a1 = a4 = false; a1d.push(`${symbol} absent`); continue; }
  const meta = (await json(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`, { headers: { "User-Agent": "MineAlertTests/1.0" } })).chart.result[0].meta;
  const drift = Math.abs(m.currentPrice - meta.regularMarketPrice) / meta.regularMarketPrice * 100;
  a1d.push(`${symbol} ${m.currentPrice} vs ${meta.regularMarketPrice} (${drift.toFixed(2)} %)`);
  if (drift > 0.5) a1 = false;
  const prev = meta.chartPreviousClose ?? meta.previousClose;
  const expected = prev ? ((meta.regularMarketPrice - prev) / prev) * 100 : null;
  const gap = expected === null ? 0 : Math.abs(m.priceChangePercent24h - expected);
  a4d.push(`${symbol} ${m.priceChangePercent24h} vs ${expected === null ? "n.d." : expected.toFixed(2)}`);
  if (gap > 0.6) a4 = false;
}
check("A1 cours = source Yahoo (écart ≤ 0,5 %)", 5, a1, a1d.join(" | "));
check("A4 variation 24 h = clôture précédente de la source (écart ≤ 0,6 pt)", 5, a4, a4d.join(" | "));

// A1b : contrôle croisé indépendant (spot gold-api.com) : écart futures/spot ≤ 1,5 %
let a1b = true, a1bd = [];
for (const [symbol, code] of Object.entries(SPOT)) {
  const spot = (await json(`https://api.gold-api.com/price/${code}`)).price;
  const gap = Math.abs(bySymbol[symbol].currentPrice - spot) / spot * 100;
  a1bd.push(`${symbol} ${bySymbol[symbol].currentPrice} vs spot ${spot} (${gap.toFixed(2)} %)`);
  if (gap > 1.5) a1b = false;
}
check("A1b contrôle croisé indépendant (spot, écart ≤ 1,5 %)", 3, a1b, a1bd.join(" | "));

// A2 : plages plausibles et unités
check("A2 valeurs dans les plages plausibles et bonnes unités", 3,
  Object.keys(YAHOO).every((s) => bySymbol[s] && bySymbol[s].currentPrice >= BANDS[s][0] && bySymbol[s].currentPrice <= BANDS[s][1] && bySymbol[s].unit === UNITS[s]),
  Object.keys(YAHOO).map((s) => `${s} ${bySymbol[s]?.currentPrice} ${bySymbol[s]?.unit}`).join(" | "));

// A3 : fraîcheur et heure de cotation
const now = Date.now();
const fresh = Object.keys(YAHOO).every((s) => {
  const m = bySymbol[s];
  const sync = Date.parse(m?.lastUpdated);
  const quote = Date.parse(m?.quoteTime);
  return Number.isFinite(sync) && now - sync < 60 * 60 * 1000 && Number.isFinite(quote) && quote <= now + 5 * 60 * 1000 && now - quote < 14 * 24 * 60 * 60 * 1000;
});
check("A3 synchronisation < 1 h et heure de cotation présente et plausible", 4, fresh,
  Object.keys(YAHOO).map((s) => `${s} sync ${bySymbol[s]?.lastUpdated?.slice(11, 16)} cote ${bySymbol[s]?.quoteTime?.slice(0, 16)}`).join(" | "));

// A5 : dépôts SEC échantillonnés vs EDGAR
const filings = await json(
  `${SUPABASE_URL}/rest/v1/regulatory_filings?select=cik,accession,form,items,filed_at,url,mining_companies(name)&order=filed_at.desc&limit=12`,
  { headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${PUBLISHABLE_KEY}` } }
);
let a5ok = 0, a5d = [];
const secCache = new Map();
for (const filing of filings) {
  try {
    if (!secCache.has(filing.cik)) {
      secCache.set(filing.cik, await json(`https://data.sec.gov/submissions/CIK${filing.cik}.json`, { headers: { "User-Agent": SEC_UA } }));
      await new Promise((r) => setTimeout(r, 150));
    }
    const recent = secCache.get(filing.cik).filings.recent;
    const index = recent.accessionNumber.indexOf(filing.accession);
    const sameForm = index >= 0 && recent.form[index] === filing.form;
    const sameDate = index >= 0 && recent.filingDate[index] === filing.filed_at.slice(0, 10);
    const sameItems = index >= 0 && (filing.form !== "8-K" || (recent.items[index] ?? "").split(",").filter(Boolean).join() === filing.items.join());
    const doc = await fetch(filing.url, { headers: { "User-Agent": SEC_UA }, signal: AbortSignal.timeout(25000) });
    const good = sameForm && sameDate && sameItems && doc.ok;
    if (good) a5ok += 1; else a5d.push(`${filing.mining_companies?.name} ${filing.accession} form:${sameForm} date:${sameDate} items:${sameItems} url:${doc.status}`);
    await new Promise((r) => setTimeout(r, 150));
  } catch (error) {
    a5d.push(`${filing.accession} erreur ${String(error.message).slice(0, 60)}`);
  }
}
check("A5 dépôts SEC : formulaire, date, rubriques et lien conformes à EDGAR (12 échantillons)", 6, filings.length > 0 && a5ok === filings.length, `${a5ok}/${filings.length} conformes ${a5d.join(" ; ")}`);

// Risque pays : valeurs dans l'échelle WGI et cohérence avec l'API Banque mondiale (3 pays)
const risk = await json(`${SUPABASE_URL}/rest/v1/country_risk?select=iso3,country,political_stability,data_year&limit=100`, { headers: { apikey: PUBLISHABLE_KEY, Authorization: `Bearer ${PUBLISHABLE_KEY}` } });
const inRange = risk.length >= 30 && risk.every((r) => r.political_stability >= -2.6 && r.political_stability <= 2.6);
const wb = await json("https://api.worldbank.org/v2/country/AUS;COD;CAN/indicator/GOV_WGI_PV.EST?format=json&mrnev=1&per_page=10");
const wbMap = Object.fromEntries(wb[1].map((r) => [r.countryiso3code, r.value]));
const wbOk = Object.entries(wbMap).every(([iso, value]) => Math.abs((risk.find((r) => r.iso3 === iso)?.political_stability ?? 99) - value) < 0.02);
check("A6 risque pays : 30+ pays, échelle WGI, conforme à la Banque mondiale", 2, inRange && wbOk, `${risk.length} pays ; vérifiés ${Object.keys(wbMap).join(",")}`);

const total = results.reduce((sum, r) => sum + r.points, 0);
const earned = results.filter((r) => r.ok).reduce((sum, r) => sum + r.points, 0);
for (const r of results) console.log(`${r.ok ? "OK " : "KO "} [${r.points}] ${r.id}\n     ${r.detail}`);
console.log(`\nSCORE DONNÉES : ${earned}/${total}`);
process.exit(earned === total ? 0 : 1);
