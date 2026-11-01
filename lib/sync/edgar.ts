import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const SEC_USER_AGENT = "KAH Digital Studio (MineAlert) kahdigital42@gmail.com";
const MAX_AGE_DAYS = 45;
const REQUEST_GAP_MS = 130;

type ItemInfo = { label: string; category: string; priority: number };

/**
 * Libellés français des rubriques du formulaire 8-K. 9.01 (pièces jointes) est ignorée.
 */
const ITEM_INFO: Record<string, ItemInfo> = {
  "1.01": { label: "accord important signé", category: "accord", priority: 4 },
  "1.02": { label: "résiliation d'un accord important", category: "accord", priority: 4 },
  "1.05": { label: "incident de cybersécurité", category: "alerte", priority: 8 },
  "2.01": { label: "acquisition ou cession d'actifs", category: "operation", priority: 5 },
  "2.02": { label: "résultats financiers", category: "resultats", priority: 6 },
  "2.03": { label: "nouvelle dette ou engagement financier", category: "financement", priority: 6 },
  "2.04": { label: "accélération d'une dette", category: "alerte", priority: 8 },
  "2.05": { label: "coûts de restructuration", category: "operation", priority: 5 },
  "2.06": { label: "dépréciation d'actifs", category: "resultats", priority: 7 },
  "3.01": { label: "avis de non-conformité à la cote", category: "alerte", priority: 8 },
  "3.02": { label: "émission d'actions non enregistrée (financement)", category: "financement", priority: 7 },
  "3.03": { label: "modification des droits des actionnaires", category: "gouvernance", priority: 3 },
  "4.01": { label: "changement de commissaire aux comptes", category: "gouvernance", priority: 4 },
  "4.02": { label: "comptes publiés jugés non fiables", category: "alerte", priority: 9 },
  "5.01": { label: "changement de contrôle", category: "operation", priority: 6 },
  "5.02": { label: "départ ou nomination de dirigeants", category: "gouvernance", priority: 4 },
  "5.03": { label: "modification des statuts", category: "gouvernance", priority: 2 },
  "5.07": { label: "résultats des votes des actionnaires", category: "gouvernance", priority: 2 },
  "7.01": { label: "communication d'information (Regulation FD)", category: "communication", priority: 3 },
  "8.01": { label: "autre événement jugé important", category: "communication", priority: 3 },
};

type SubmissionsResponse = {
  filings?: {
    recent?: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      items?: string[];
      primaryDocument: string[];
    };
  };
};

type FilingRow = {
  cik: string;
  accession: string;
  form: string;
  items: string[];
  category: string;
  title_fr: string;
  filed_at: string;
  url: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildTitle(name: string, form: string, items: string[]): { title: string; category: string } {
  if (form === "6-K") {
    return {
      title: `${name} : document déposé auprès de la SEC (formulaire 6-K)`,
      category: "communication",
    };
  }

  const known = items
    .map((code) => ({ code, info: ITEM_INFO[code] }))
    .filter((entry): entry is { code: string; info: ItemInfo } => Boolean(entry.info));

  if (known.length === 0) {
    return { title: `${name} : dépôt 8-K auprès de la SEC`, category: "autre" };
  }

  const main = known.reduce((best, entry) => (entry.info.priority > best.info.priority ? entry : best));

  return {
    title: `${name} : ${known.map((entry) => entry.info.label).join(" ; ")}`,
    category: main.info.category,
  };
}

/**
 * Récupère les derniers dépôts 8-K / 6-K des sociétés minières suivies (SEC EDGAR, données publiques).
 */
export async function syncEdgarFilings(): Promise<{ companies: number; filings: number; errors: number }> {
  const client = createAdminClient();
  const { data: companies, error } = await client.from("mining_companies").select("cik,name");

  if (error || !companies) {
    throw new Error("Lecture des sociétés minières impossible.");
  }

  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  let total = 0;
  let errors = 0;

  for (const company of companies as Array<{ cik: string; name: string }>) {
    try {
      const response = await fetch(`https://data.sec.gov/submissions/CIK${company.cik}.json`, {
        headers: { "User-Agent": SEC_USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });

      if (!response.ok) {
        errors += 1;
        continue;
      }

      const recent = ((await response.json()) as SubmissionsResponse).filings?.recent;

      if (!recent) {
        continue;
      }

      const rows: FilingRow[] = [];
      const cikNumber = String(Number(company.cik));

      for (let index = 0; index < recent.form.length; index += 1) {
        const form = recent.form[index];
        const filedAt = Date.parse(recent.filingDate[index]);

        if ((form !== "8-K" && form !== "6-K") || !Number.isFinite(filedAt) || filedAt < cutoff) {
          continue;
        }

        const items = (recent.items?.[index] ?? "").split(",").map((code) => code.trim()).filter(Boolean);
        const { title, category } = buildTitle(company.name, form, items);
        const accession = recent.accessionNumber[index];

        rows.push({
          cik: company.cik,
          accession,
          form,
          items,
          category,
          title_fr: title,
          filed_at: new Date(filedAt).toISOString(),
          url: `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accession.replace(/-/g, "")}/${recent.primaryDocument[index]}`,
        });
      }

      if (rows.length > 0) {
        const { error: upsertError } = await client
          .from("regulatory_filings")
          .upsert(rows, { onConflict: "accession", ignoreDuplicates: true });

        if (upsertError) {
          errors += 1;
        } else {
          total += rows.length;
        }
      }
    } catch {
      errors += 1;
    }

    await sleep(REQUEST_GAP_MS);
  }

  return { companies: companies.length, filings: total, errors };
}
