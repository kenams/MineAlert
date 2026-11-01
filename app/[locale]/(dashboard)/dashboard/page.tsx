"use client";

import Link from "next/link";
import { BellRing, Gem, Globe2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { AlertCard } from "@/components/dashboard/AlertCard";
import { MineralCard } from "@/components/dashboard/MineralCard";
import { NewsCard } from "@/components/dashboard/NewsCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAlerts } from "@/hooks/useAlerts";
import { useWatchlist } from "@/hooks/useMineral";
import { useNews } from "@/hooks/useNews";
import { usePriceHistory, usePrices } from "@/hooks/usePrices";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { mineralName } from "@/lib/data/minerals";
import { localePath } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import { DASHBOARD_FEATURED_SYMBOLS } from "@/lib/utils/constants";
import {
  formatChange,
  formatDataFreshnessLabel,
  formatPrice,
  formatRefreshLabel,
} from "@/lib/utils/formatters";

/**
 * Dashboard principal MineAlert avec synthese, watchlist, actualites et alertes.
 */
export default function DashboardPage(): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    DASHBOARD_FEATURED_SYMBOLS[0]
  );
  const { prices, isLoading: pricesLoading } = usePrices();
  const { history } = usePriceHistory(selectedSymbol, "30d");
  const { articles, isLoading: newsLoading } = useNews({ page: 1 });
  const { alerts, remove } = useAlerts();
  const { watchlist, remove: removeFromWatchlist } = useWatchlist();
  const { status: systemStatus } = useSystemStatus();

  const featuredPrices = useMemo(
    () =>
      DASHBOARD_FEATURED_SYMBOLS.map((symbol) =>
        prices.find((mineral) => mineral.symbol === symbol)
      ).filter(Boolean),
    [prices]
  );

  const gold = prices.find((mineral) => mineral.symbol === "XAU");
  const copper = prices.find((mineral) => mineral.symbol === "CU");

  return (
    <div className="space-y-8">
      {systemStatus?.freshnessStatus === "stale" ? (
        systemStatus.syncStrategy === "scheduled_daily" ? (
          <Alert variant="warning" title={t("dash.dailyUpdateTitle")}>
            {t("dash.dailyUpdateText", {
              age: formatDataFreshnessLabel(
                systemStatus.latestDataAgeMs,
                systemStatus.freshnessStatus,
                locale
              ),
              cadence: formatRefreshLabel(systemStatus.expectedRefreshLabel, locale),
            })}
          </Alert>
        ) : (
          <Alert variant="error" title={t("dash.staleTitle")}>
            {t("dash.staleText", {
              age: formatDataFreshnessLabel(
                systemStatus.latestDataAgeMs,
                systemStatus.freshnessStatus,
                locale
              ),
            })}
          </Alert>
        )
      ) : null}

      {systemStatus?.freshnessStatus === "unavailable" ? (
        <Alert variant="info" title={t("dash.unavailableTitle")}>
          {t("dash.unavailableText")}
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={t("dash.priceGold")}
          value={gold ? formatPrice(gold.currentPrice, gold.currency, locale) : "-"}
          change={gold ? formatPrice(gold.priceChange24h, gold.currency, locale) : undefined}
          changePercent={gold ? formatChange(gold.priceChangePercent24h) : undefined}
          trend={gold && gold.priceChangePercent24h >= 0 ? "up" : "down"}
          icon={<Gem className="h-5 w-5" />}
        />
        <StatCard
          title={t("dash.priceCopper")}
          value={copper ? formatPrice(copper.currentPrice, copper.currency, locale) : "-"}
          change={copper ? formatPrice(copper.priceChange24h, copper.currency, locale) : undefined}
          changePercent={
            copper ? formatChange(copper.priceChangePercent24h) : undefined
          }
          trend={copper && copper.priceChangePercent24h >= 0 ? "up" : "down"}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title={t("dash.articlesToday")}
          value={String(articles.length)}
          change={t("dash.followedFeed")}
          trend="neutral"
          icon={<Globe2 className="h-5 w-5" />}
        />
        <StatCard
          title={t("dash.activeAlerts")}
          value={String(alerts.filter((alert) => alert.isActive).length)}
          change={t("dash.monitoring")}
          trend="neutral"
          icon={<BellRing className="h-5 w-5" />}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#0A0A0A]">{t("dash.watchlistTitle")}</h2>
            <p className="text-sm text-slate-500">{t("dash.watchlistSubtitle")}</p>
          </div>
          <Link href={localePath(locale, "/dashboard/minerais")}>
            <Button variant="outline">{t("dash.manageWatchlist")}</Button>
          </Link>
        </div>

        {pricesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          <Alert
            variant="info"
            title={t("dash.watchlistEmptyTitle")}
            className="items-center justify-between gap-4"
          >
            <div className="flex-1">{t("dash.watchlistEmptyText")}</div>
            <Link href={localePath(locale, "/dashboard/minerais")} className="shrink-0">
              <Button variant="outline" size="sm">
                {t("dash.addMinerals")}
              </Button>
            </Link>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {watchlist.map((mineral) => (
              <MineralCard
                key={mineral.id}
                mineral={mineral}
                onRemoveWatchlist={(selected) =>
                  void removeFromWatchlist({ mineralId: selected.id })
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#0A0A0A]">
                {t("dash.recentNews")}
              </h2>
              <p className="text-sm text-slate-500">{t("dash.recentNewsSubtitle")}</p>
            </div>
            <Link href={localePath(locale, "/dashboard/actualites")}>
              <Button variant="ghost">{t("dash.seeAll")}</Button>
            </Link>
          </div>

          {newsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-56 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {articles.slice(0, 6).map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {featuredPrices.map((mineral) =>
              mineral ? (
                <Button
                  key={mineral.symbol}
                  variant={selectedSymbol === mineral.symbol ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSymbol(mineral.symbol)}
                >
                  {mineralName(locale, mineral.symbol, mineral.name)}
                </Button>
              ) : null
            )}
          </div>

          <PriceChart
            data={history}
            period="30d"
            mineral={mineralName(
              locale,
              selectedSymbol,
              prices.find((mineral) => mineral.symbol === selectedSymbol)?.name ?? selectedSymbol
            )}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#0A0A0A]">
            {t("dash.recentAlerts")}
          </h2>
          <p className="text-sm text-slate-500">{t("dash.recentAlertsSubtitle")}</p>
        </div>

        {alerts.length === 0 ? (
          <Alert variant="info" title={t("dash.noAlertsTitle")}>
            {t("dash.noAlertsText")}
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {alerts.slice(0, 5).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={(alertId) => void remove({ id: alertId })}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
