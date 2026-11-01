import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { MINING_COUNTRIES, countryLabel } from "@/lib/data/countries";
import { createT, isLocale, type Locale, type TranslateFn } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

type CountryRow = {
  iso3: string;
  country: string;
  political_stability: number | null;
  rule_of_law: number | null;
  gov_effectiveness: number | null;
  data_year: number | null;
};

function band(
  value: number | null,
  t: TranslateFn
): { label: string; variant: "positive" | "negative" | "neutral" | "gold" } {
  if (value === null) return { label: t("risk.na"), variant: "neutral" };
  if (value >= 0.5) return { label: t("risk.low"), variant: "positive" };
  if (value >= -0.5) return { label: t("risk.medium"), variant: "gold" };
  return { label: t("risk.high"), variant: "negative" };
}

function score(value: number | null, locale: Locale): string {
  if (value === null) return "—";
  const text = value.toFixed(2);
  return locale === "fr" ? text.replace(".", ",") : text;
}

function displayCountry(row: CountryRow, locale: Locale): string {
  if (locale === "fr") {
    return row.country;
  }

  return MINING_COUNTRIES.find((country) => country.iso3 === row.iso3)?.en ?? countryLabel(locale, row.country);
}

/**
 * Fiche risque pays pour les principaux pays miniers (World Bank, Worldwide Governance Indicators).
 */
export default async function CountryRiskPage({
  params,
}: {
  params: { locale: string };
}): Promise<JSX.Element> {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const { locale } = params;
  const t = createT(locale);
  let rows: CountryRow[] = [];

  if (isSupabaseConfigured()) {
    const { data } = await createAdminClient()
      .from("country_risk")
      .select("iso3,country,political_stability,rule_of_law,gov_effectiveness,data_year")
      .order("political_stability", { ascending: true, nullsFirst: false });
    rows = (data ?? []) as CountryRow[];
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold text-[#0A0A0A]">{t("risk.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("risk.subtitle")}</p>
      </div>

      {rows.length === 0 ? (
        <Alert variant="info" title={t("risk.emptyTitle")}>
          {t("risk.emptyText")}
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("risk.colCountry")}</th>
                <th className="px-4 py-3">{t("risk.colStability")}</th>
                <th className="px-4 py-3">{t("risk.colLaw")}</th>
                <th className="px-4 py-3">{t("risk.colGov")}</th>
                <th className="px-4 py-3">{t("risk.colReading")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const reading = band(row.political_stability, t);
                return (
                  <tr key={row.iso3} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-[#0A0A0A]">{displayCountry(row, locale)}</td>
                    <td className="px-4 py-3">{score(row.political_stability, locale)}</td>
                    <td className="px-4 py-3">{score(row.rule_of_law, locale)}</td>
                    <td className="px-4 py-3">{score(row.gov_effectiveness, locale)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={reading.variant}>{reading.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        {t("risk.source", {
          year: rows[0]?.data_year ? t("risk.sourceYear", { year: rows[0].data_year }) : "",
        })}
      </p>
    </div>
  );
}
