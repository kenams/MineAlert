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
import { DASHBOARD_FEATURED_SYMBOLS } from "@/lib/utils/constants";
import {
  formatChange,
  formatDataFreshnessLabel,
  formatPrice,
} from "@/lib/utils/formatters";

/**
 * Dashboard principal MineAlert avec synthese, watchlist, actualites et alertes.
 */
export default function DashboardPage(): JSX.Element {
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
          <Alert variant="warning" title="Mise a jour quotidienne">
            Dernier sync visible{" "}
            {formatDataFreshnessLabel(
              systemStatus.latestDataAgeMs,
              systemStatus.freshnessStatus
            )}
            . En mode gratuit heberge, la synchronisation passe par une cadence{" "}
            {systemStatus.expectedRefreshLabel}.
          </Alert>
        ) : (
          <Alert variant="error" title="Rafraichissement des donnees en retard">
            Dernier sync visible{" "}
            {formatDataFreshnessLabel(
              systemStatus.latestDataAgeMs,
              systemStatus.freshnessStatus
            )}
            . Verifiez le scraper ou relancez un sync manuel.
          </Alert>
        )
      ) : null}

      {systemStatus?.freshnessStatus === "unavailable" ? (
        <Alert variant="info" title="Statut de fraicheur indisponible">
          L'application ne peut pas encore verifier la date du dernier sync.
        </Alert>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Prix Or"
          value={gold ? formatPrice(gold.currentPrice, gold.currency) : "-"}
          change={gold ? formatPrice(gold.priceChange24h, gold.currency) : undefined}
          changePercent={gold ? formatChange(gold.priceChangePercent24h) : undefined}
          trend={gold && gold.priceChangePercent24h >= 0 ? "up" : "down"}
          icon={<Gem className="h-5 w-5" />}
        />
        <StatCard
          title="Prix Cuivre"
          value={copper ? formatPrice(copper.currentPrice, copper.currency) : "-"}
          change={copper ? formatPrice(copper.priceChange24h, copper.currency) : undefined}
          changePercent={
            copper ? formatChange(copper.priceChangePercent24h) : undefined
          }
          trend={copper && copper.priceChangePercent24h >= 0 ? "up" : "down"}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Articles aujourd'hui"
          value={String(articles.length)}
          change="Flux suivi"
          trend="neutral"
          icon={<Globe2 className="h-5 w-5" />}
        />
        <StatCard
          title="Alertes actives"
          value={String(alerts.filter((alert) => alert.isActive).length)}
          change="Surveillance"
          trend="neutral"
          icon={<BellRing className="h-5 w-5" />}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#0A0A0A]">Ma watchlist</h2>
            <p className="text-sm text-slate-500">Les minerais que vous suivez de pres.</p>
          </div>
          <Link href="/dashboard/minerais">
            <Button variant="outline">Gerer ma watchlist</Button>
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
            title="Votre watchlist est vide"
            className="items-center justify-between gap-4"
          >
            <div className="flex-1">
              Ajoutez quelques minerais pour suivre vos prix prioritaires directement depuis le dashboard.
            </div>
            <Link href="/dashboard/minerais" className="shrink-0">
              <Button variant="outline" size="sm">
                Ajouter des minerais
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
                Actualites recentes
              </h2>
              <p className="text-sm text-slate-500">
                Les derniers signaux marche et mines.
              </p>
            </div>
            <Link href="/dashboard/actualites">
              <Button variant="ghost">Voir tout</Button>
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
                  {mineral.name}
                </Button>
              ) : null
            )}
          </div>

          <PriceChart data={history} period="30d" mineral={selectedSymbol} />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#0A0A0A]">
            Alertes recentes
          </h2>
          <p className="text-sm text-slate-500">
            Vos dernieres alertes actives et declenchees.
          </p>
        </div>

        {alerts.length === 0 ? (
          <Alert variant="info" title="Aucune alerte active">
            Creez votre premiere alerte pour etre notifie d'un seuil de prix important.
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
