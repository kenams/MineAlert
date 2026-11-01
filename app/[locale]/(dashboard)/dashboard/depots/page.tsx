import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { filingTitle } from "@/lib/data/filing-labels";
import { createT, isLocale, localePath, type DictKey } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatDay } from "@/lib/utils/formatters";
import { safeHref } from "@/lib/utils/safe-html";

export const dynamic = "force-dynamic";

const VISIBLE_FILINGS = 80;
const SEARCH_WINDOW = 400;

const CATEGORIES: Record<string, { labelKey: DictKey; variant: "positive" | "negative" | "neutral" | "gold" | "category" }> = {
  alerte: { labelKey: "filingCategory.alerte", variant: "negative" },
  financement: { labelKey: "filingCategory.financement", variant: "gold" },
  resultats: { labelKey: "filingCategory.resultats", variant: "category" },
  accord: { labelKey: "filingCategory.accord", variant: "category" },
  operation: { labelKey: "filingCategory.operation", variant: "category" },
  gouvernance: { labelKey: "filingCategory.gouvernance", variant: "neutral" },
  communication: { labelKey: "filingCategory.communication", variant: "neutral" },
  autre: { labelKey: "filingCategory.autre", variant: "neutral" },
};

type FilingView = {
  accession: string;
  form: string;
  items: string[] | null;
  category: string;
  filed_at: string;
  url: string;
  mining_companies: { name: string; ticker: string | null; country: string | null } | null;
};

type PageProps = {
  params: { locale: string };
  searchParams?: { categorie?: string; q?: string };
};

/**
 * Fil des dépôts réglementaires (SEC EDGAR) des sociétés minières suivies, titrés dans la langue de l'interface.
 */
export default async function FilingsPage({ params, searchParams }: PageProps): Promise<JSX.Element> {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const { locale } = params;
  const t = createT(locale);
  const category = searchParams?.categorie && CATEGORIES[searchParams.categorie] ? searchParams.categorie : "";
  const search = (searchParams?.q ?? "").trim().slice(0, 60);
  let filings: Array<FilingView & { title: string }> = [];

  if (isSupabaseConfigured()) {
    let query = createAdminClient()
      .from("regulatory_filings")
      .select("accession,form,items,category,filed_at,url,mining_companies(name,ticker,country)")
      .order("filed_at", { ascending: false })
      .limit(search ? SEARCH_WINDOW : VISIBLE_FILINGS);

    if (category) {
      query = query.eq("category", category);
    }

    const { data } = await query;
    const needle = search.toLowerCase();

    filings = ((data ?? []) as unknown as FilingView[])
      .map((filing) => ({
        ...filing,
        title: filingTitle(locale, filing.mining_companies?.name ?? filing.form, filing.form, filing.items),
      }))
      .filter((filing) => {
        if (!needle) {
          return true;
        }

        const haystack = [
          filing.title,
          filingTitle(locale === "fr" ? "en" : "fr", filing.mining_companies?.name ?? filing.form, filing.form, filing.items),
          filing.mining_companies?.name ?? "",
          filing.mining_companies?.ticker ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(needle);
      })
      .slice(0, VISIBLE_FILINGS);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold text-[#0A0A0A]">{t("filings.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("filings.subtitle")}</p>

        <form className="mt-5 flex flex-col gap-3 sm:flex-row" action={localePath(locale, "/dashboard/depots")}>
          <input
            name="q"
            defaultValue={search}
            placeholder={t("filings.searchPlaceholder")}
            aria-label={t("filings.searchPlaceholder")}
            className="h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm"
          />
          <select
            name="categorie"
            defaultValue={category}
            aria-label={t("filings.allCategories")}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          >
            <option value="">{t("filings.allCategories")}</option>
            {Object.entries(CATEGORIES).map(([key, value]) => (
              <option key={key} value={key}>
                {t(value.labelKey)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-11 rounded-xl bg-[#1B4332] px-5 text-sm font-medium text-white hover:bg-[#143528]"
          >
            {t("filings.filter")}
          </button>
        </form>
      </div>

      {filings.length === 0 ? (
        <Alert variant="info" title={t("filings.emptyTitle")}>
          {t("filings.emptyText")}
        </Alert>
      ) : (
        <div className="grid gap-3">
          {filings.map((filing) => {
            const meta = CATEGORIES[filing.category] ?? CATEGORIES.autre;

            return (
              <Card key={filing.accession} variant="elevated">
                <Card.Body>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge variant={meta.variant}>{t(meta.labelKey)}</Badge>
                    <span>{formatDay(filing.filed_at, locale)}</span>
                    <span>·</span>
                    <span>{filing.mining_companies?.ticker ?? ""}</span>
                    <span>·</span>
                    <span>{t("filings.form", { form: filing.form })}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#0A0A0A]">{filing.title}</p>
                  <Link
                    href={safeHref(filing.url) ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-[#1B4332] underline"
                  >
                    {t("filings.read")}
                  </Link>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400">{t("filings.disclaimer")}</p>
    </div>
  );
}
