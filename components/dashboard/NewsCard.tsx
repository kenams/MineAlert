import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { countryLabel } from "@/lib/data/countries";
import { newsMineralLabel } from "@/lib/data/minerals";
import { useLocale, useT } from "@/lib/i18n/provider";
import { formatSentiment, timeAgo } from "@/lib/utils/formatters";
import type { NewsArticle } from "@/types";

type NewsCardProps = {
  article: NewsArticle;
};

/**
 * Carte d'actualité minière enrichie avec source, tags et sentiment.
 */
export function NewsCard({ article }: NewsCardProps): JSX.Element {
  const locale = useLocale();
  const t = useT();

  return (
    <Card variant="bordered" className="h-full">
      <Card.Header className="mb-3 flex-col items-start gap-2">
        <div className="flex w-full items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {article.source}
            </p>
            <p className="mt-1 text-xs text-slate-500">{timeAgo(article.publishedAt, locale)}</p>
          </div>

          <div className="flex items-center gap-2">
            {article.isBreaking ? <Badge variant="negative">{t("news.breaking")}</Badge> : null}
            <Badge
              variant={
                article.sentiment === "positive"
                  ? "positive"
                  : article.sentiment === "negative"
                    ? "negative"
                    : "neutral"
              }
            >
              {formatSentiment(article.sentiment, locale)}
            </Badge>
          </div>
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold text-[#0A0A0A]">
          {article.title}
        </h3>
      </Card.Header>

      <Card.Body>
        <p className="line-clamp-3 text-sm leading-6 text-slate-600">
          {article.summary}
        </p>

        <div className="flex flex-wrap gap-2">
          {article.minerals.map((mineral) => (
            <Badge key={`${article.id}-${mineral}`} variant="category" compact>
              {newsMineralLabel(locale, mineral)}
            </Badge>
          ))}
          {article.countries.map((country) => (
            <Badge key={`${article.id}-${country}`} variant="neutral" compact>
              {countryLabel(locale, country)}
            </Badge>
          ))}
        </div>
      </Card.Body>

      <Card.Footer>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#1B4332] transition hover:text-[#163829]"
        >
          {t("news.read")}
          <ExternalLink className="h-4 w-4" />
        </a>
      </Card.Footer>
    </Card>
  );
}
