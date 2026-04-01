"use client";

import { useMemo, useState } from "react";

import { NewsCard } from "@/components/dashboard/NewsCard";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { useNews } from "@/hooks/useNews";
import { SUPPORTED_SENTIMENTS } from "@/lib/utils/constants";

/**
 * Vue actualités avec filtres et colonne de statistiques.
 */
export default function NewsPage(): JSX.Element {
  const [mineral, setMineral] = useState("");
  const [country, setCountry] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);

  const { articles, totalPages, total, isLoading } = useNews({
    mineral: mineral || undefined,
    country: country || undefined,
    sentiment: sentiment ? (sentiment as "positive" | "negative" | "neutral") : undefined,
    source: source || undefined,
    page,
  });

  const stats = useMemo(() => {
    const mineralCounts = new Map<string, number>();
    const countryCounts = new Map<string, number>();
    const sentimentCounts = new Map<string, number>();

    for (const article of articles) {
      article.minerals.forEach((item) =>
        mineralCounts.set(item, (mineralCounts.get(item) ?? 0) + 1)
      );
      article.countries.forEach((item) =>
        countryCounts.set(item, (countryCounts.get(item) ?? 0) + 1)
      );
      sentimentCounts.set(
        article.sentiment,
        (sentimentCounts.get(article.sentiment) ?? 0) + 1
      );
    }

    return {
      topMinerals: [...mineralCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      topCountries: [...countryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      sentiments: [...sentimentCounts.entries()],
    };
  }, [articles]);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-5">
        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={mineral}
            onChange={(event) => setMineral(event.target.value)}
            placeholder="Minerai"
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          />
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            placeholder="Pays"
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          />
          <select
            value={sentiment}
            onChange={(event) => setSentiment(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          >
            <option value="">Tous les sentiments</option>
            {SUPPORTED_SENTIMENTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Source"
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <Alert variant="info">Aucune actualité ne correspond à ces filtres.</Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span>{total} article(s)</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-lg border border-slate-200 px-3 py-2"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card variant="elevated">
          <Card.Header>
            <h2 className="text-lg font-semibold text-[#0A0A0A]">Stats du jour</h2>
          </Card.Header>
          <Card.Body className="space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-500">Top minerais mentionnés</p>
              <div className="mt-3 space-y-2">
                {stats.topMinerals.map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-medium text-[#1B4332]">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Top pays</p>
              <div className="mt-3 space-y-2">
                {stats.topCountries.map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-medium text-[#1B4332]">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">Répartition sentiments</p>
              <div className="mt-3 space-y-2">
                {stats.sentiments.map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span>{label}</span>
                    <span className="font-medium text-[#1B4332]">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
