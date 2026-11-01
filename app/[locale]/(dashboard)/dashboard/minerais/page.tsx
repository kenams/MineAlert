"use client";

import { useEffect, useMemo, useState } from "react";

import { MineralCard } from "@/components/dashboard/MineralCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Table, type TableColumn } from "@/components/ui/Table";
import { useMineral, useWatchlist } from "@/hooks/useMineral";
import { usePrices } from "@/hooks/usePrices";
import { mineralDescription, mineralName } from "@/lib/data/minerals";
import { useLocale, useT } from "@/lib/i18n/provider";
import { MINERAL_CATEGORIES } from "@/lib/utils/constants";
import {
  formatChange,
  formatMineralCategory,
  formatPrice,
} from "@/lib/utils/formatters";
import type { Mineral } from "@/types";

type SortKey = "name" | "price" | "variation";

/**
 * Vue complète des minerais avec filtres, tableau et panneau de détail.
 */
export default function MineralsPage(): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [sortKey, setSortKey] = useState<SortKey>("variation");
  const { prices, isLoading } = usePrices(category || undefined);
  const [selectedMineralId, setSelectedMineralId] = useState<string>("");
  const { mineral, history } = useMineral(selectedMineralId);
  const { watchlist, add, remove } = useWatchlist();
  const watchlistIds = useMemo(
    () => new Set(watchlist.map((entry) => entry.id)),
    [watchlist]
  );

  const filteredMinerals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...prices]
      .filter((item) => {
        if (
          normalizedSearch &&
          ![
            item.name,
            mineralName(locale, item.symbol, item.name),
            item.symbol,
            mineralDescription(locale, item.symbol, item.description),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        ) {
          return false;
        }

        return true;
      })
      .sort((first, second) => {
        if (sortKey === "price") {
          return second.currentPrice - first.currentPrice;
        }

        if (sortKey === "name") {
          return mineralName(locale, first.symbol, first.name).localeCompare(
            mineralName(locale, second.symbol, second.name)
          );
        }

        return second.priceChangePercent24h - first.priceChangePercent24h;
      });
  }, [locale, prices, search, sortKey]);

  useEffect(() => {
    if (!selectedMineralId && filteredMinerals[0]) {
      setSelectedMineralId(filteredMinerals[0].id);
    }
  }, [filteredMinerals, selectedMineralId]);

  const columns: TableColumn<Mineral>[] = [
    {
      key: "name",
      header: t("minerals.colMineral"),
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-[#0A0A0A]">{mineralName(locale, row.symbol, row.name)}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {row.symbol}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: t("minerals.colCategory"),
      render: (row) => formatMineralCategory(row.category, locale),
    },
    {
      key: "currentPrice",
      header: t("minerals.colPrice"),
      sortable: true,
      render: (row) => formatPrice(row.currentPrice, row.currency, locale),
    },
    {
      key: "priceChangePercent24h",
      header: t("minerals.colChange"),
      sortable: true,
      render: (row) => formatChange(row.priceChangePercent24h),
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("minerals.search")}
              wrapperClassName="flex-1"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#0A0A0A]"
            >
              <option value="">{t("minerals.allCategories")}</option>
              {Object.keys(MINERAL_CATEGORIES).map((key) => (
                <option key={key} value={key}>
                  {formatMineralCategory(key as Mineral["category"], locale)}
                </option>
              ))}
            </select>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#0A0A0A]"
            >
              <option value="variation">{t("minerals.sortVariation")}</option>
              <option value="price">{t("minerals.sortPrice")}</option>
              <option value="name">{t("minerals.sortName")}</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("cards")}
              className={`rounded-xl px-4 py-2 text-sm ${
                view === "cards" ? "bg-[#1B4332] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {t("minerals.viewCards")}
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`rounded-xl px-4 py-2 text-sm ${
                view === "table" ? "bg-[#1B4332] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {t("minerals.viewTable")}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : view === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredMinerals.map((item) => (
              <div key={item.id} onClick={() => setSelectedMineralId(item.id)}>
                <MineralCard
                  mineral={item}
                  isInWatchlist={watchlistIds.has(item.id)}
                  onAddWatchlist={(selected) =>
                    void add({ mineralId: selected.id })
                  }
                  onRemoveWatchlist={(selected) =>
                    void remove({ mineralId: selected.id })
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <Table
            data={filteredMinerals}
            columns={columns}
            onRowClick={(row) => setSelectedMineralId(row.id)}
            rowKey={(row) => row.id}
          />
        )}
      </div>

      <div className="space-y-4">
        {mineral ? (
          <>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                {t("minerals.detail")}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#0A0A0A]">
                {mineralName(locale, mineral.symbol, mineral.name)}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {mineralDescription(locale, mineral.symbol, mineral.description)}
              </p>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">{t("minerals.currentPrice")}</p>
                  <p className="mt-2 font-semibold text-[#0A0A0A]">
                    {formatPrice(mineral.currentPrice, mineral.currency, locale)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">{t("minerals.change24h")}</p>
                  <p className="mt-2 font-semibold text-[#0A0A0A]">
                    {formatChange(mineral.priceChangePercent24h)}
                  </p>
                </div>
              </div>
            </div>

            <PriceChart data={history} period="30d" mineral={mineralName(locale, mineral.symbol, mineral.name)} />
          </>
        ) : (
          <Alert variant="info">{t("minerals.select")}</Alert>
        )}
      </div>
    </div>
  );
}
