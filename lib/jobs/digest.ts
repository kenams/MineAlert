import "server-only";

import { computeChangePercent } from "@/lib/alerts/sweep";
import { sendMail } from "@/lib/email/sender";
import { createAdminClient } from "@/lib/supabase/admin";
import { esc, safeHref } from "@/lib/utils/safe-html";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://mine-alert-kenams.vercel.app").replace(/\/$/, "");
const WINDOW_MS = 26 * 60 * 60 * 1000;
const IMPORTANT = ["alerte", "financement", "resultats", "accord", "operation"];

function fmt(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
}

/**
 * Envoie le résumé quotidien en français aux abonnés Pro : variations 24 h, dépôts SEC marquants, actualités principales.
 */
export async function runDailyDigest(): Promise<{ recipients: number; sent: number }> {
  const client = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { data: users } = await client.from("users").select("id,email").eq("plan", "pro");
  const recipients = (users ?? []) as Array<{ id: string; email: string }>;

  if (recipients.length === 0) {
    return { recipients: 0, sent: 0 };
  }

  const [{ data: minerals }, { data: filings }, { data: news }] = await Promise.all([
    client.from("minerals").select("id,name,current_price,unit,last_updated").eq("is_active", true).order("name"),
    client
      .from("regulatory_filings")
      .select("title_fr,url,category")
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
  ]);

  const priceLines: string[] = [];

  for (const mineral of (minerals ?? []) as Array<{ id: string; name: string; current_price: number | null; unit: string; last_updated: string | null }>) {
    if (typeof mineral.current_price !== "number" || mineral.current_price <= 0) continue;
    if (!mineral.last_updated || Date.now() - Date.parse(mineral.last_updated) > 48 * 60 * 60 * 1000) continue;
    const change = await computeChangePercent(client, mineral.id, mineral.current_price);
    const suffix = change === null ? "" : ` (${change > 0 ? "+" : ""}${change.toFixed(1).replace(".", ",")} % en 24 h)`;
    priceLines.push(`${mineral.name} : ${fmt(mineral.current_price)} USD/${mineral.unit}${suffix}`);
  }

  const filingLines = (filings ?? []) as Array<{ title_fr: string; url: string }>;
  const newsLines = (news ?? []) as Array<{ title: string; url: string; source: string }>;

  const text = [
    "MineAlert — votre résumé du jour",
    "",
    "Cours",
    ...priceLines.map((line) => `• ${line}`),
    "",
    "Dépôts SEC marquants (24 h)",
    ...(filingLines.length ? filingLines.map((f) => `• ${f.title_fr}\n  ${f.url}`) : ["• Aucun dépôt marquant."]),
    "",
    "À la une",
    ...(newsLines.length ? newsLines.map((n) => `• ${n.title} (${n.source})\n  ${n.url}`) : ["• Aucune actualité."]),
    "",
    "Information factuelle, pas un conseil en investissement.",
    `${SITE_URL}/dashboard`,
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:560px">
<h2 style="color:#1B4332">MineAlert — votre résumé du jour</h2>
<h3>Cours</h3><ul>${priceLines.map((line) => `<li>${esc(line)}</li>`).join("")}</ul>
<h3>Dépôts SEC marquants (24 h)</h3>${
    filingLines.length
      ? `<ul>${filingLines.map((f) => `<li>${esc(f.title_fr)} — <a href="${esc(safeHref(f.url) ?? SITE_URL)}">dépôt officiel</a></li>`).join("")}</ul>`
      : "<p>Aucun dépôt marquant.</p>"
  }
<h3>À la une</h3>${
    newsLines.length
      ? `<ul>${newsLines.map((n) => `<li><a href="${esc(safeHref(n.url) ?? SITE_URL)}">${esc(n.title)}</a> (${esc(n.source)})</li>`).join("")}</ul>`
      : "<p>Aucune actualité.</p>"
  }
<p style="font-size:12px;color:#64748b">Information factuelle, pas un conseil en investissement. <a href="${SITE_URL}/dashboard">Ouvrir MineAlert</a></p></div>`;

  let sent = 0;

  for (const user of recipients) {
    try {
      const result = await sendMail({ to: user.email, subject: "MineAlert — votre résumé du jour", html, text });
      if (result.sent) sent += 1;
    } catch {
      continue;
    }
  }

  return { recipients: recipients.length, sent };
}
