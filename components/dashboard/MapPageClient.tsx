"use client";

import { useMemo, useState } from "react";

import { WorldMap } from "@/components/dashboard/WorldMap";
import { Card } from "@/components/ui/Card";
import { countryLabel } from "@/lib/data/countries";
import { newsMineralLabel } from "@/lib/data/minerals";
import { useLocale, useT } from "@/lib/i18n/provider";
import { formatMineStatus } from "@/lib/utils/formatters";
import type { Mine } from "@/types";

type MapPageClientProps = {
  mines: Mine[];
};

/**
 * Vue cartographique client, alimentée par les mines issues de Supabase.
 */
export function MapPageClient({
  mines,
}: MapPageClientProps): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const [mineralFilter, setMineralFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<Mine["status"] | "all">("all");
  const [selectedMine, setSelectedMine] = useState<Mine | null>(mines[0] ?? null);

  const availableMinerals = useMemo(
    () => [...new Set(mines.flatMap((mine) => mine.minerals))],
    [mines]
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-4">
        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2">
          <select
            value={mineralFilter}
            onChange={(event) => setMineralFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          >
            <option value="">{t("map.allMinerals")}</option>
            {availableMinerals.map((mineral) => (
              <option key={mineral} value={mineral}>
                {newsMineralLabel(locale, mineral)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as Mine["status"] | "all")
            }
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
          >
            <option value="all">{t("map.allStatuses")}</option>
            <option value="active">{formatMineStatus("active", locale)}</option>
            <option value="exploration">{formatMineStatus("exploration", locale)}</option>
            <option value="suspended">{formatMineStatus("suspended", locale)}</option>
            <option value="closed">{formatMineStatus("closed", locale)}</option>
          </select>
        </div>

        <WorldMap
          mines={mines}
          mineralFilter={mineralFilter || undefined}
          statusFilter={statusFilter}
          onMineSelect={setSelectedMine}
        />
      </div>

      <Card variant="elevated">
        <Card.Header>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("map.sheet")}</p>
            <h2 className="mt-1 text-xl font-semibold text-[#0A0A0A]">
              {selectedMine?.name ?? t("map.selectPoint")}
            </h2>
          </div>
        </Card.Header>
        <Card.Body>
          {selectedMine ? (
            <div className="space-y-4 text-sm text-slate-600">
              <p>{selectedMine.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">{t("common.company")}</p>
                  <p className="mt-2 font-medium text-[#0A0A0A]">{selectedMine.company}</p>
                </div>
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">{t("common.country")}</p>
                  <p className="mt-2 font-medium text-[#0A0A0A]">
                    {countryLabel(locale, selectedMine.country)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">{t("map.status")}</p>
                  <p className="mt-2 font-medium text-[#0A0A0A]">
                    {formatMineStatus(selectedMine.status, locale)}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">{t("map.minerals")}</p>
                  <p className="mt-2 font-medium text-[#0A0A0A]">
                    {selectedMine.minerals.map((item) => newsMineralLabel(locale, item)).join(", ")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </Card.Body>
      </Card>
    </div>
  );
}
