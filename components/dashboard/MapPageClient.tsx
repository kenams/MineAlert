"use client";

import { useMemo, useState } from "react";

import { WorldMap } from "@/components/dashboard/WorldMap";
import { Card } from "@/components/ui/Card";
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
            <option value="">Tous les minerais</option>
            {availableMinerals.map((mineral) => (
              <option key={mineral} value={mineral}>
                {mineral}
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
            <option value="all">Tous les statuts</option>
            <option value="active">Active</option>
            <option value="exploration">Exploration</option>
            <option value="suspended">Suspendue</option>
            <option value="closed">Fermee</option>
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
            <p className="text-sm font-medium text-slate-500">Fiche mine</p>
            <h2 className="mt-1 text-xl font-semibold text-[#0A0A0A]">
              {selectedMine?.name ?? "Selectionnez un point"}
            </h2>
          </div>
        </Card.Header>
        <Card.Body>
          {selectedMine ? (
            <div className="space-y-4 text-sm text-slate-600">
              <p>{selectedMine.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">Societe</p>
                  <p className="mt-2 font-medium text-[#0A0A0A]">{selectedMine.company}</p>
                </div>
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">Pays</p>
                  <p className="mt-2 font-medium text-[#0A0A0A]">{selectedMine.country}</p>
                </div>
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">Statut</p>
                  <p className="mt-2 font-medium text-[#0A0A0A]">{selectedMine.status}</p>
                </div>
                <div className="rounded-2xl bg-[#F8F9FA] p-4">
                  <p className="text-slate-500">Minerais</p>
                  <p className="mt-2 font-medium text-[#0A0A0A]">
                    {selectedMine.minerals.join(", ")}
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
