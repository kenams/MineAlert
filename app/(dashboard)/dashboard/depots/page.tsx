import Link from "next/link";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const CATEGORIES: Record<string, { label: string; variant: "positive" | "negative" | "neutral" | "gold" | "category" }> = {
  alerte: { label: "Alerte", variant: "negative" },
  financement: { label: "Financement", variant: "gold" },
  resultats: { label: "Résultats", variant: "category" },
  accord: { label: "Accord", variant: "category" },
  operation: { label: "Opération", variant: "category" },
  gouvernance: { label: "Gouvernance", variant: "neutral" },
  communication: { label: "Communication", variant: "neutral" },
  autre: { label: "Autre", variant: "neutral" },
};

type FilingView = {
  accession: string;
  form: string;
  category: string;
  title_fr: string;
  filed_at: string;
  url: string;
  mining_companies: { name: string; ticker: string | null; country: string | null } | null;
};

type PageProps = { searchParams?: { categorie?: string; q?: string } };

/**
 * Fil des dépôts réglementaires (SEC EDGAR) des sociétés minières suivies, en français.
 */
export default async function FilingsPage({ searchParams }: PageProps): Promise<JSX.Element> {
  const category = searchParams?.categorie && CATEGORIES[searchParams.categorie] ? searchParams.categorie : "";
  const search = (searchParams?.q ?? "").trim().slice(0, 60);
  let filings: FilingView[] = [];

  if (isSupabaseConfigured()) {
    let query = createAdminClient()
      .from("regulatory_filings")
      .select("accession,form,category,title_fr,filed_at,url,mining_companies(name,ticker,country)")
      .order("filed_at", { ascending: false })
      .limit(80);

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.ilike("title_fr", `%${search.replace(/[%_]/g, " ")}%`);
    }

    const { data } = await query;
    filings = (data ?? []) as unknown as FilingView[];
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold text-[#0A0A0A]">Dépôts réglementaires</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ce que les sociétés minières cotées aux États-Unis déposent auprès de la SEC (formulaires 8-K et 6-K), classé et
          résumé en français. Mise à jour toutes les 30 minutes, 41 sociétés suivies.
        </p>

        <form className="mt-5 flex flex-col gap-3 sm:flex-row" action="/dashboard/depots">
          <input
            name="q"
            defaultValue={search}
            placeholder="Société, mot-clé (ex. Newmont, résultats)"
            className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm"
          />
          <select
            name="categorie"
            defaultValue={category}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          >
            <option value="">Toutes les catégories</option>
            {Object.entries(CATEGORIES).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-11 rounded-xl bg-[#1B4332] px-5 text-sm font-medium text-white hover:bg-[#143528]"
          >
            Filtrer
          </button>
        </form>
      </div>

      {filings.length === 0 ? (
        <Alert variant="info" title="Aucun dépôt à afficher.">
          La collecte des dépôts SEC démarre automatiquement. Revenez dans quelques minutes ou élargissez le filtre.
        </Alert>
      ) : (
        <div className="grid gap-3">
          {filings.map((filing) => {
            const meta = CATEGORIES[filing.category] ?? CATEGORIES.autre;

            return (
              <Card key={filing.accession} variant="elevated">
                <Card.Body>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <span>{new Date(filing.filed_at).toLocaleDateString("fr-FR")}</span>
                    <span>·</span>
                    <span>{filing.mining_companies?.ticker ?? ""}</span>
                    <span>·</span>
                    <span>Formulaire {filing.form}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#0A0A0A]">{filing.title_fr}</p>
                  <Link
                    href={filing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-[#1B4332] underline"
                  >
                    Lire le dépôt officiel (SEC)
                  </Link>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400">
        Information factuelle issue de dépôts publics (SEC EDGAR). Les titres sont générés à partir des rubriques officielles du
        formulaire et ne remplacent pas la lecture du document. Ce n&apos;est pas un conseil en investissement.
      </p>
    </div>
  );
}
