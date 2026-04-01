"use client";

import { useEffect, useMemo, useState } from "react";

import { MineralCard } from "@/components/dashboard/MineralCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { Table, type TableColumn } from "@/components/ui/Table";
import { useMineral, useWatchlist } from "@/hooks/useMineral";
import { usePrices } from "@/hooks/usePrices";
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
          ![item.name, item.symbol, item.description]
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
          return first.name.localeCompare(second.name);
        }

        return second.priceChangePercent24h - first.priceChangePercent24h;
      });
  }, [prices, search, sortKey]);

  useEffect(() => {
    if (!selectedMineralId && filteredMinerals[0]) {
      setSelectedMineralId(filteredMinerals[0].id);
    }
  }, [filteredMinerals, selectedMineralId]);

  const columns: TableColumn<Mineral>[] = [
    {
      key: "name",
      header: "Minerai",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-[#0A0A0A]">{row.name}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {row.symbol}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Catégorie",
      render: (row) => formatMineralCategory(row.category),
    },
    {
      key: "currentPrice",
      header: "Prix",
      sortable: true,
      render: (row) => formatPrice(row.currentPrice, row.currency),
    },
    {
      key: "priceChangePercent24h",
      header: "Variation 24h",
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
              placeholder="Rechercher un minerai"
              wrapperClassName="flex-1"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#0A0A0A]"
            >
              <option value="">Toutes les catégories</option>
              {Object.entries(MINERAL_CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#0A0A0A]"
            >
              <option value="variation">Trier par variation</option>
              <option value="price">Trier par prix</option>
              <option value="name">Trier par nom</option>
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
              Vue cartes
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`rounded-xl px-4 py-2 text-sm ${
                view === "table" ? "bg-[#1B4332] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              Vue tableau
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
                Détail
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[#0A0A0A]">
                {mineral.name}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {mineral.description}
              </p>
              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">Prix actuel</p>
                  <p className="mt-2 font-semibold text-[#0A0A0A]">
                    {formatPrice(mineral.currentPrice, mineral.currency)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">Variation 24h</p>
                  <p className="mt-2 font-semibold text-[#0A0A0A]">
                    {formatChange(mineral.priceChangePercent24h)}
                  </p>
                </div>
              </div>
            </div>

            <PriceChart data={history} period="30d" mineral={mineral.name} />
          </>
        ) : (
          <Alert variant="info">Sélectionnez un minerai pour afficher son détail.</Alert>
        )}
      </div>
    </div>
  );
}
