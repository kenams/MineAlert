"use client";

import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import type { Mine } from "@/types";

type WorldMapProps = {
  mines: Mine[];
  mineralFilter?: string;
  statusFilter?: Mine["status"] | "all";
  onMineSelect?: (mine: Mine) => void;
};

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function getMarkerColor(status: Mine["status"]): string {
  switch (status) {
    case "active":
      return "#1B4332";
    case "exploration":
      return "#D4AF37";
    case "suspended":
      return "#DC3545";
    case "closed":
      return "#64748b";
    default:
      return "#1B4332";
  }
}

/**
 * Carte mondiale simplifiée des mines avec marqueurs et info au survol.
 */
export function WorldMap({
  mines,
  mineralFilter,
  statusFilter = "all",
  onMineSelect,
}: WorldMapProps): JSX.Element {
  const [hoveredMineId, setHoveredMineId] = useState<string | null>(null);

  const filteredMines = useMemo(
    () =>
      mines.filter((mine) => {
        if (mineralFilter && !mine.minerals.includes(mineralFilter)) {
          return false;
        }

        if (statusFilter !== "all" && mine.status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [mines, mineralFilter, statusFilter]
  );

  const hoveredMine =
    filteredMines.find((mine) => mine.id === hoveredMineId) ?? null;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <Card.Header>
        <div>
          <p className="text-sm font-medium text-slate-500">Carte mondiale des mines</p>
          <h3 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
            {filteredMines.length} sites suivis
          </h3>
        </div>
      </Card.Header>

      <Card.Body className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#eef4f2]">
          <ComposableMap projectionConfig={{ scale: 145 }}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#dbe5e2"
                    stroke="#ffffff"
                    strokeWidth={0.5}
                  />
                ))
              }
            </Geographies>

            {filteredMines.map((mine) => (
              <Marker
                key={mine.id}
                coordinates={[mine.longitude, mine.latitude]}
                onMouseEnter={() => setHoveredMineId(mine.id)}
                onMouseLeave={() => setHoveredMineId(null)}
                onClick={() => onMineSelect?.(mine)}
              >
                <circle
                  r={5}
                  fill={getMarkerColor(mine.status)}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                />
              </Marker>
            ))}
          </ComposableMap>

          {hoveredMine ? (
            <div className="absolute left-4 top-4 max-w-xs rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              <p className="text-sm font-semibold text-[#0A0A0A]">{hoveredMine.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                {hoveredMine.country} · {hoveredMine.company}
              </p>
              <p className="mt-2 text-xs text-slate-600">
                {hoveredMine.minerals.join(", ")}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          {[
            ["active", "Actives"],
            ["exploration", "Exploration"],
            ["suspended", "Suspendues"],
            ["closed", "Fermées"],
          ].map(([status, label]) => (
            <div key={status} className="inline-flex items-center gap-2">
              <span
                className={cn("h-3 w-3 rounded-full")}
                style={{ backgroundColor: getMarkerColor(status as Mine["status"]) }}
              />
              <span className="text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}
