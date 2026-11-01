import "server-only";

import { sendMail } from "@/lib/email/sender";
import { createAdminClient } from "@/lib/supabase/admin";
import { esc, safeHref } from "@/lib/utils/safe-html";

const PRICE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MAX_KEYWORD_HITS_PER_ALERT = 3;
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

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
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
 * Évalue toutes les alertes actives de tous les abonnés, crée les événements et envoie un e-mail récapitulatif par utilisateur.
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
  const drafts: EventDraft[] = [];
  const triggeredIds = new Set<string>();
  const now = Date.now();

  for (const alert of alerts) {
    const mineral = minerals.get(alert.mineral_id);
    const last = alert.triggered_at ? Date.parse(alert.triggered_at) : null;

    if (alert.type === "news_keyword") {
      const keyword = alert.keyword?.trim();

      if (!keyword) {
        continue;
      }

      const since = new Date(last ?? Date.parse(alert.created_at)).toISOString();
      const pattern = `%${keyword.replace(/[%_]/g, " ")}%`;
      const [filings, news] = await Promise.all([
        client
          .from("regulatory_filings")
          .select("title_fr,url,filed_at")
          .gt("created_at", since)
          .ilike("title_fr", pattern)
          .order("filed_at", { ascending: false })
          .limit(MAX_KEYWORD_HITS_PER_ALERT),
        client
          .from("news_articles")
          .select("title,url")
          .gt("scraped_at", since)
          .ilike("title", pattern)
          .order("scraped_at", { ascending: false })
          .limit(MAX_KEYWORD_HITS_PER_ALERT),
      ]);

      for (const filing of filings.data ?? []) {
        drafts.push({
          user_id: alert.user_id,
          alert_id: alert.id,
          title: `Dépôt réglementaire — « ${keyword} »`,
          body: filing.title_fr as string,
          url: filing.url as string,
        });
        triggeredIds.add(alert.id);
      }

      for (const article of news.data ?? []) {
        drafts.push({
          user_id: alert.user_id,
          alert_id: alert.id,
          title: `Actualité — « ${keyword} »`,
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

    if (alert.type === "price_above" && price > alert.threshold) {
      drafts.push({
        user_id: alert.user_id,
        alert_id: alert.id,
        title: `${mineral.name} au-dessus de ${formatNumber(alert.threshold)} USD`,
        body: `Cours observé : ${formatNumber(price)} USD.`,
        url: `${SITE_URL}/dashboard/minerais`,
      });
      triggeredIds.add(alert.id);
    } else if (alert.type === "price_below" && price < alert.threshold) {
      drafts.push({
        user_id: alert.user_id,
        alert_id: alert.id,
        title: `${mineral.name} sous ${formatNumber(alert.threshold)} USD`,
        body: `Cours observé : ${formatNumber(price)} USD.`,
        url: `${SITE_URL}/dashboard/minerais`,
      });
      triggeredIds.add(alert.id);
    } else if (alert.type === "change_percent") {
      const change = await computeChangePercent(client, mineral.id, price);

      if (change !== null && Math.abs(change) > alert.threshold) {
        drafts.push({
          user_id: alert.user_id,
          alert_id: alert.id,
          title: `${mineral.name} : ${change > 0 ? "+" : ""}${change.toFixed(1).replace(".", ",")} % en 24 h`,
          body: `Variation supérieure à ${formatNumber(alert.threshold)} % (cours : ${formatNumber(price)} USD).`,
          url: `${SITE_URL}/dashboard/minerais`,
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
    const lines = mine.map((draft) => `• ${draft.title}\n  ${draft.body}${draft.url ? `\n  ${draft.url}` : ""}`);
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:560px">
<h2 style="color:#1B4332">MineAlert : ${mine.length} alerte${mine.length > 1 ? "s" : ""} déclenchée${mine.length > 1 ? "s" : ""}</h2>
${mine
  .map(
    (draft) => {
      const href = safeHref(draft.url);
      return `<p><strong>${esc(draft.title)}</strong><br/>${esc(draft.body)}${href ? `<br/><a href="${esc(href)}">Voir la source</a>` : ""}</p>`;
    }
  )
  .join("")}
<p style="font-size:12px;color:#64748b">Information factuelle, pas un conseil en investissement. Gérez vos alertes dans <a href="${SITE_URL}/dashboard/alertes">votre tableau de bord</a>.</p></div>`;

    try {
      const result = await sendMail({
        to: user.email,
        subject: `MineAlert : ${mine.length} alerte${mine.length > 1 ? "s" : ""} déclenchée${mine.length > 1 ? "s" : ""}`,
        html,
        text: `${lines.join("\n")}\n\nInformation factuelle, pas un conseil en investissement.\n${SITE_URL}/dashboard/alertes`,
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
