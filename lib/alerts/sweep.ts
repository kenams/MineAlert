import "server-only";

import { filingTitle } from "@/lib/data/filing-labels";
import { mineralName } from "@/lib/data/minerals";
import { sendMail } from "@/lib/email/sender";
import { createT, localePath, type Locale } from "@/lib/i18n";
import { getUserLocales } from "@/lib/server/user-locale";
import { createAdminClient } from "@/lib/supabase/admin";
import { intlLocale } from "@/lib/utils/formatters";
import { esc, safeHref } from "@/lib/utils/safe-html";

const PRICE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_KEYWORD_HITS_PER_ALERT = 3;
const MAX_FILINGS_SCANNED = 300;
const HISTORY_MIN_AGE_MS = 20 * 60 * 60 * 1000;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mine-alert-kenams.vercel.app").replace(/\/$/, "");

type AlertRow = {
  id: string;
  user_id: string;
  mineral_id: string;
  type: "price_above" | "price_below" | "change_percent" | "news_keyword";
  threshold: number;
  keyword: string | null;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
};

export const MAX_PRICE_AGE_MS = 48 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Vrai seulement si la date est valide, pas dans le futur et pas plus vieille que MAX_PRICE_AGE_MS. Refus par défaut.
 */
export function isFreshPrice(lastUpdated: string | null | undefined, now = Date.now()): boolean {
  const updatedAt = lastUpdated ? Date.parse(lastUpdated) : Number.NaN;
  return Number.isFinite(updatedAt) && now - updatedAt <= MAX_PRICE_AGE_MS && updatedAt <= now + CLOCK_SKEW_MS;
}

type MineralRow = { id: string; name: string; symbol: string; current_price: number | null; last_updated: string | null };

type EventDraft = { user_id: string; alert_id: string; title: string; body: string; url: string | null };

type FilingScanRow = {
  form: string;
  items: string[] | null;
  url: string;
  mining_companies: { name: string; ticker: string | null } | Array<{ name: string; ticker: string | null }> | null;
};

function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
}

function formatSigned(change: number, locale: Locale): string {
  const text = change.toFixed(1);
  return `${change > 0 ? "+" : ""}${locale === "fr" ? text.replace(".", ",") : text}`;
}

function otherLocale(locale: Locale): Locale {
  return locale === "fr" ? "en" : "fr";
}

/**
 * Dépôts SEC dont le titre (français ou anglais), la société ou le ticker contient le mot-clé, insensible à la casse.
 */
function matchFilings(
  rows: FilingScanRow[],
  keyword: string,
  locale: Locale
): Array<{ title: string; url: string }> {
  const needle = keyword.toLowerCase();
  const matches: Array<{ title: string; url: string }> = [];

  for (const row of rows) {
    const company = Array.isArray(row.mining_companies) ? row.mining_companies[0] : row.mining_companies;
    const name = company?.name ?? row.form;
    const title = filingTitle(locale, name, row.form, row.items);
    const haystack = [title, filingTitle(otherLocale(locale), name, row.form, row.items), name, company?.ticker ?? ""]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(needle)) {
      matches.push({ title, url: row.url });

      if (matches.length >= MAX_KEYWORD_HITS_PER_ALERT) {
        break;
      }
    }
  }

  return matches;
}

/**
 * Calcule la variation sur environ 24 h à partir de l'historique de prix enregistré, ou null si l'historique est trop court.
 */
export async function computeChangePercent(
  client: ReturnType<typeof createAdminClient>,
  mineralId: string,
  currentPrice: number
): Promise<number | null> {
  const { data } = await client
    .from("price_history")
    .select("price,recorded_at")
    .eq("mineral_id", mineralId)
    .lte("recorded_at", new Date(Date.now() - HISTORY_MIN_AGE_MS).toISOString())
    .gte("recorded_at", new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString())
    .order("recorded_at", { ascending: false })
    .limit(1);

  const reference = data?.[0]?.price;

  if (typeof reference !== "number" || reference <= 0) {
    return null;
  }

  return ((currentPrice - reference) / reference) * 100;
}

/**
 * Évalue toutes les alertes actives de tous les abonnés, crée les événements et envoie un e-mail récapitulatif par utilisateur,
 * dans la langue de l'utilisateur (français par défaut).
 */
export async function runAlertSweep(): Promise<{ checked: number; events: number; emailed: number }> {
  const client = createAdminClient();

  const { data: alertData, error } = await client
    .from("user_alerts")
    .select("id,user_id,mineral_id,type,threshold,keyword,is_active,triggered_at,created_at")
    .eq("is_active", true);

  if (error || !alertData || alertData.length === 0) {
    return { checked: 0, events: 0, emailed: 0 };
  }

  const alerts = alertData as AlertRow[];
  const { data: mineralData } = await client.from("minerals").select("id,name,symbol,current_price,last_updated");
  const minerals = new Map(((mineralData ?? []) as MineralRow[]).map((mineral) => [mineral.id, mineral]));
  const userLocales = await getUserLocales(client, [...new Set(alerts.map((alert) => alert.user_id))]);
  const localeOf = (userId: string): Locale => userLocales.get(userId) ?? "fr";
  const filingScans = new Map<string, Promise<FilingScanRow[]>>();
  const scanFilings = (since: string): Promise<FilingScanRow[]> => {
    let scan = filingScans.get(since);

    if (!scan) {
      scan = Promise.resolve(
        client
          .from("regulatory_filings")
          .select("form,items,url,filed_at,mining_companies(name,ticker)")
          .gt("created_at", since)
          .order("filed_at", { ascending: false })
          .limit(MAX_FILINGS_SCANNED)
      ).then(({ data }) => (data ?? []) as unknown as FilingScanRow[]);
      filingScans.set(since, scan);
    }

    return scan;
  };
  const drafts: EventDraft[] = [];
  const triggeredIds = new Set<string>();
  const now = Date.now();

  for (const alert of alerts) {
    const mineral = minerals.get(alert.mineral_id);
    const last = alert.triggered_at ? Date.parse(alert.triggered_at) : null;
    const locale = localeOf(alert.user_id);
    const t = createT(locale);
    const dashboardUrl = `${SITE_URL}${localePath(locale, "/dashboard/minerais")}`;

    if (alert.type === "news_keyword") {
      const keyword = alert.keyword?.trim();

      if (!keyword) {
        continue;
      }

      const since = new Date(last ?? Date.parse(alert.created_at)).toISOString();
      const pattern = `%${keyword.replace(/[%_]/g, " ")}%`;
      const [filingRows, news] = await Promise.all([
        scanFilings(since),
        client
          .from("news_articles")
          .select("title,url")
          .gt("scraped_at", since)
          .ilike("title", pattern)
          .order("scraped_at", { ascending: false })
          .limit(MAX_KEYWORD_HITS_PER_ALERT),
      ]);

      for (const filing of matchFilings(filingRows, keyword, locale)) {
        drafts.push({
          user_id: alert.user_id,
          alert_id: alert.id,
          title: t("email.filingKeywordTitle", { keyword }),
          body: filing.title,
          url: filing.url,
        });
        triggeredIds.add(alert.id);
      }

      for (const article of news.data ?? []) {
        drafts.push({
          user_id: alert.user_id,
          alert_id: alert.id,
          title: t("email.newsKeywordTitle", { keyword }),
          body: article.title as string,
          url: article.url as string,
        });
        triggeredIds.add(alert.id);
      }

      continue;
    }

    if (!mineral || typeof mineral.current_price !== "number" || mineral.current_price <= 0) {
      continue;
    }

    // Pas d'alerte sur un cours qui n'est plus mis à jour (minerais sans source en direct).
    if (!isFreshPrice(mineral.last_updated, now)) {
      continue;
    }

    if (last !== null && now - last < PRICE_COOLDOWN_MS) {
      continue;
    }

    const price = mineral.current_price;
    const name = mineralName(locale, mineral.symbol, mineral.name);

    if (alert.type === "price_above" && price > alert.threshold) {
      drafts.push({
        user_id: alert.user_id,
        alert_id: alert.id,
        title: t("email.priceAbove", { mineral: name, threshold: formatNumber(alert.threshold, locale) }),
        body: t("email.priceBody", { price: formatNumber(price, locale) }),
        url: dashboardUrl,
      });
      triggeredIds.add(alert.id);
    } else if (alert.type === "price_below" && price < alert.threshold) {
      drafts.push({
        user_id: alert.user_id,
        alert_id: alert.id,
        title: t("email.priceBelow", { mineral: name, threshold: formatNumber(alert.threshold, locale) }),
        body: t("email.priceBody", { price: formatNumber(price, locale) }),
        url: dashboardUrl,
      });
      triggeredIds.add(alert.id);
    } else if (alert.type === "change_percent") {
      const change = await computeChangePercent(client, mineral.id, price);

      if (change !== null && Math.abs(change) > alert.threshold) {
        drafts.push({
          user_id: alert.user_id,
          alert_id: alert.id,
          title: t("email.changeTitle", { mineral: name, change: formatSigned(change, locale) }),
          body: t("email.changeBody", {
            threshold: formatNumber(alert.threshold, locale),
            price: formatNumber(price, locale),
          }),
          url: dashboardUrl,
        });
        triggeredIds.add(alert.id);
      }
    }
  }

  if (drafts.length === 0) {
    return { checked: alerts.length, events: 0, emailed: 0 };
  }

  const { error: insertError } = await client.from("alert_events").insert(drafts);

  if (insertError) {
    throw new Error(`Écriture alert_events: ${insertError.message}`);
  }

  await client
    .from("user_alerts")
    .update({ triggered_at: new Date().toISOString() })
    .in("id", [...triggeredIds]);

  const userIds = [...new Set(drafts.map((draft) => draft.user_id))];
  const { data: users } = await client.from("users").select("id,email").in("id", userIds);
  let emailed = 0;

  for (const user of (users ?? []) as Array<{ id: string; email: string }>) {
    const mine = drafts.filter((draft) => draft.user_id === user.id);
    const locale = localeOf(user.id);
    const t = createT(locale);
    const countKey = mine.length > 1 ? "Plural" : "";
    const subject = t(`email.alertsSubject${countKey}` as "email.alertsSubject", { n: mine.length });
    const heading = t(`email.alertsHeading${countKey}` as "email.alertsHeading", { n: mine.length });
    const dashboardAlertsUrl = `${SITE_URL}${localePath(locale, "/dashboard/alertes")}`;
    const lines = mine.map((draft) => `• ${draft.title}\n  ${draft.body}${draft.url ? `\n  ${draft.url}` : ""}`);
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:560px">
<h2 style="color:#1B4332">${esc(heading)}</h2>
${mine
  .map(
    (draft) => {
      const href = safeHref(draft.url);
      return `<p><strong>${esc(draft.title)}</strong><br/>${esc(draft.body)}${href ? `<br/><a href="${esc(href)}">${esc(t("email.viewSource"))}</a>` : ""}</p>`;
    }
  )
  .join("")}
<p style="font-size:12px;color:#64748b">${esc(t("common.disclaimer"))} ${esc(t("email.manageAlerts"))} <a href="${esc(dashboardAlertsUrl)}">${esc(t("email.dashboardLink"))}</a>.</p></div>`;

    try {
      const result = await sendMail({
        to: user.email,
        subject,
        html,
        text: `${lines.join("\n")}\n\n${t("common.disclaimer")}\n${dashboardAlertsUrl}`,
      });

      if (result.sent) {
        emailed += 1;
        await client
          .from("alert_events")
          .update({ emailed: true })
          .eq("user_id", user.id)
          .in("alert_id", mine.map((draft) => draft.alert_id))
          .eq("emailed", false);
      }
    } catch {
      continue;
    }
  }

  return { checked: alerts.length, events: drafts.length, emailed };
}
