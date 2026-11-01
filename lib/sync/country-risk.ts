import "server-only";

import { MINING_COUNTRIES } from "@/lib/data/countries";
import { createAdminClient } from "@/lib/supabase/admin";

type WorldBankRecord = {
  countryiso3code: string;
  country: { value: string };
  date: string;
  value: number | null;
};

const INDICATORS = {
  political_stability: "GOV_WGI_PV.EST",
  rule_of_law: "GOV_WGI_RL.EST",
  gov_effectiveness: "GOV_WGI_GE.EST",
} as const;

async function fetchIndicator(code: string): Promise<WorldBankRecord[]> {
  const countries = MINING_COUNTRIES.map((country) => country.iso3).join(";");
  const response = await fetch(
    `https://api.worldbank.org/v2/country/${countries}/indicator/${code}?format=json&mrnev=1&per_page=200`,
    { signal: AbortSignal.timeout(15000), cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`World Bank ${code}: ${response.status}`);
  }

  const payload = (await response.json()) as [unknown, WorldBankRecord[] | null];
  return payload[1] ?? [];
}

/**
 * Met à jour les indicateurs de gouvernance (World Bank WGI, licence CC BY 4.0) des pays miniers.
 */
export async function syncCountryRisk(): Promise<{ countries: number }> {
  const [stability, law, effectiveness] = await Promise.all([
    fetchIndicator(INDICATORS.political_stability),
    fetchIndicator(INDICATORS.rule_of_law),
    fetchIndicator(INDICATORS.gov_effectiveness),
  ]);

  const rows = MINING_COUNTRIES.map((country) => {
    const pick = (records: WorldBankRecord[]) =>
      records.find((record) => record.countryiso3code === country.iso3);
    const pv = pick(stability);
    const rl = pick(law);
    const ge = pick(effectiveness);
    const year = Number(pv?.date ?? rl?.date ?? ge?.date ?? 0);

    return {
      iso3: country.iso3,
      country: country.fr,
      political_stability: pv?.value ?? null,
      rule_of_law: rl?.value ?? null,
      gov_effectiveness: ge?.value ?? null,
      data_year: year || null,
      updated_at: new Date().toISOString(),
    };
  }).filter((row) => row.political_stability !== null || row.rule_of_law !== null);

  if (rows.length === 0) {
    throw new Error("Aucune donnée de gouvernance reçue.");
  }

  const { error } = await createAdminClient().from("country_risk").upsert(rows, { onConflict: "iso3" });

  if (error) {
    throw new Error(`Écriture country_risk: ${error.message}`);
  }

  return { countries: rows.length };
}
