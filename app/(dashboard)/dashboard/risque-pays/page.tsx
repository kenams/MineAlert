import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
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

function band(value: number | null): { label: string; variant: "positive" | "negative" | "neutral" | "gold" } {
  if (value === null) return { label: "n.d.", variant: "neutral" };
  if (value >= 0.5) return { label: "Risque faible", variant: "positive" };
  if (value >= -0.5) return { label: "Risque moyen", variant: "gold" };
  return { label: "Risque élevé", variant: "negative" };
}

function score(value: number | null): string {
  return value === null ? "—" : value.toFixed(2).replace(".", ",");
}

/**
 * Fiche risque pays pour les principaux pays miniers (World Bank, Worldwide Governance Indicators).
 */
export default async function CountryRiskPage(): Promise<JSX.Element> {
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
        <h1 className="text-2xl font-semibold text-[#0A0A0A]">Risque pays minier</h1>
        <p className="mt-1 text-sm text-slate-500">
          Stabilité politique, État de droit et efficacité de l&apos;État dans les pays où sont exploitées les mines. Échelle de
          -2,5 (très faible) à +2,5 (très forte). Classement du plus risqué au moins risqué.
        </p>
      </div>

      {rows.length === 0 ? (
        <Alert variant="info" title="Données en cours de collecte.">
          Les indicateurs se chargent automatiquement. Revenez dans quelques minutes.
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Pays</th>
                <th className="px-4 py-3">Stabilité politique</th>
                <th className="px-4 py-3">État de droit</th>
                <th className="px-4 py-3">Efficacité de l&apos;État</th>
                <th className="px-4 py-3">Lecture</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const reading = band(row.political_stability);
                return (
                  <tr key={row.iso3} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-[#0A0A0A]">{row.country}</td>
                    <td className="px-4 py-3">{score(row.political_stability)}</td>
                    <td className="px-4 py-3">{score(row.rule_of_law)}</td>
                    <td className="px-4 py-3">{score(row.gov_effectiveness)}</td>
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
        Source : Banque mondiale, Worldwide Governance Indicators (licence CC BY 4.0)
        {rows[0]?.data_year ? `, données ${rows[0].data_year}` : ""}. Indicateurs nationaux, pas spécifiques à un projet. La
        colonne « Lecture » est un simple repère sur la stabilité politique (seuils ±0,5), pas une recommandation
        d&apos;investissement.
      </p>
    </div>
  );
}
