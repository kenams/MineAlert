import "server-only";

import { computeChangePercent, isFreshPrice } from "@/lib/alerts/sweep";
import { filingTitle } from "@/lib/data/filing-labels";
import { mineralName } from "@/lib/data/minerals";
import { sendMail } from "@/lib/email/sender";
import { createT, localePath, type Locale } from "@/lib/i18n";
import { getUserLocales } from "@/lib/server/user-locale";
import { createAdminClient } from "@/lib/supabase/admin";
import { intlLocale } from "@/lib/utils/formatters";
import { esc, safeHref } from "@/lib/utils/safe-html";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mine-alert-kenams.vercel.app").replace(/\/$/, "");
const WINDOW_MS = 26 * 60 * 60 * 1000;
const IMPORTANT = ["alerte", "financement", "resultats", "accord", "operation"];

type MineralRow = { id: string; name: string; symbol: string; current_price: number | null; unit: string; last_updated: string | null };
type FilingRow = {
  form: string;
  items: string[] | null;
  url: string;
  mining_companies: { name: string } | Array<{ name: string }> | null;
};
type NewsRow = { title: string; url: string; source: string };

function fmt(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
}

function fmtChange(change: number, locale: Locale): string {
  const text = change.toFixed(1);
  return `${change > 0 ? "+" : ""}${locale === "fr" ? text.replace(".", ",") : text}`;
}

function buildDigest(
  locale: Locale,
  data: { minerals: Array<MineralRow & { change: number | null }>; filings: FilingRow[]; news: NewsRow[] }
): { subject: string; html: string; text: string } {
  const t = createT(locale);
  const dashboardUrl = `${SITE_URL}${localePath(locale, "/dashboard")}`;
  const priceLines = data.minerals.map((mineral) => {
    const suffix = mineral.change === null ? "" : t("email.digestChange", { change: fmtChange(mineral.change, locale) });
    const name = mineralName(locale, mineral.symbol, mineral.name);
    return `${name}${locale === "fr" ? " : " : ": "}${fmt(mineral.current_price ?? 0, locale)} USD/${mineral.unit}${suffix}`;
  });
  const filingLines = data.filings.map((filing) => {
    const company = Array.isArray(filing.mining_companies) ? filing.mining_companies[0] : filing.mining_companies;
    return { title: filingTitle(locale, company?.name ?? filing.form, filing.form, filing.items), url: filing.url };
  });
  const title = t("email.digestTitle");

  const text = [
    title,
    "",
    t("email.digestPrices"),
    ...priceLines.map((line) => `• ${line}`),
    "",
    t("email.digestFilings"),
    ...(filingLines.length ? filingLines.map((f) => `• ${f.title}\n  ${f.url}`) : [`• ${t("email.digestNoFilings")}`]),
    "",
    t("email.digestNews"),
    ...(data.news.length ? data.news.map((n) => `• ${n.title} (${n.source})\n  ${n.url}`) : [`• ${t("email.digestNoNews")}`]),
    "",
    t("common.disclaimer"),
    dashboardUrl,
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:560px">
<h2 style="color:#1B4332">${esc(title)}</h2>
<h3>${esc(t("email.digestPrices"))}</h3><ul>${priceLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
<h3>${esc(t("email.digestFilings"))}</h3>${
    filingLines.length
      ? `<ul>${filingLines.map((f) => `<li>${esc(f.title)} — <a href="${esc(safeHref(f.url) ?? SITE_URL)}">${esc(t("email.officialFiling"))}</a></li>`).join("")}</ul>`
      : `<p>${esc(t("email.digestNoFilings"))}</p>`
  }
<h3>${esc(t("email.digestNews"))}</h3>${
    data.news.length
      ? `<ul>${data.news.map((n) => `<li><a href="${esc(safeHref(n.url) ?? SITE_URL)}">${esc(n.title)}</a> (${esc(n.source)})</li>`).join("")}</ul>`
      : `<p>${esc(t("email.digestNoNews"))}</p>`
  }
<p style="font-size:12px;color:#64748b">${esc(t("common.disclaimer"))} <a href="${esc(dashboardUrl)}">${esc(t("email.openApp"))}</a></p></div>`;

  return { subject: title, html, text };
}

/**
 * Envoie le résumé quotidien aux abonnés Pro, dans leur langue (français par défaut) : variations 24 h, dépôts SEC marquants, actualités principales.
 */
export async function runDailyDigest(): Promise<{ recipients: number; sent: number }> {
  const client = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data: users } = await client.from("users").select("id,email").eq("plan", "pro");
  const recipients = (users ?? []) as Array<{ id: string; email: string }>;

  if (recipients.length === 0) {
    return { recipients: 0, sent: 0 };
  }

  const [{ data: minerals }, { data: filings }, { data: news }, userLocales] = await Promise.all([
    client.from("minerals").select("id,name,symbol,current_price,unit,last_updated").eq("is_active", true).order("name"),
    client
      .from("regulatory_filings")
      .select("form,items,url,category,mining_companies(name)")
      .in("category", IMPORTANT)
      .gte("created_at", since)
      .order("filed_at", { ascending: false })
      .limit(8),
    client
      .from("news_articles")
      .select("title,url,source")
      .gte("scraped_at", since)
      .order("relevance_score", { ascending: false })
      .limit(3),
    getUserLocales(client, recipients.map((user) => user.id)),
  ]);

  const priced: Array<MineralRow & { change: number | null }> = [];

  for (const mineral of (minerals ?? []) as MineralRow[]) {
    if (typeof mineral.current_price !== "number" || mineral.current_price <= 0) continue;
    if (!isFreshPrice(mineral.last_updated)) continue;
    priced.push({ ...mineral, change: await computeChangePercent(client, mineral.id, mineral.current_price) });
  }

  const content = {
    minerals: priced,
    filings: (filings ?? []) as unknown as FilingRow[],
    news: (news ?? []) as NewsRow[],
  };
  const digests = new Map<Locale, { subject: string; html: string; text: string }>();
  let sent = 0;

  for (const user of recipients) {
    const locale = userLocales.get(user.id) ?? "fr";
    let digest = digests.get(locale);

    if (!digest) {
      digest = buildDigest(locale, content);
      digests.set(locale, digest);
    }

    try {
      const result = await sendMail({ to: user.email, ...digest });
      if (result.sent) sent += 1;
    } catch {
      continue;
    }
  }

  return { recipients: recipients.length, sent };
}
