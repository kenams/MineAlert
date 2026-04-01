"use client";

import { BellRing, Star, StarOff } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MINERAL_CATEGORIES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import {
  formatChange,
  formatMineralCategory,
  formatPrice,
} from "@/lib/utils/formatters";
import type { Mineral } from "@/types";

type MineralCardProps = {
  mineral: Mineral;
  isInWatchlist?: boolean;
  onCreateAlert?: (mineral: Mineral) => void;
  onAddWatchlist?: (mineral: Mineral) => void;
  onRemoveWatchlist?: (mineral: Mineral) => void;
};

/**
 * Carte watchlist d'un minerai avec variation, catégorie et actions rapides.
 */
export function MineralCard({
  mineral,
  isInWatchlist = true,
  onCreateAlert,
  onAddWatchlist,
  onRemoveWatchlist,
}: MineralCardProps): JSX.Element {
  const categoryColor = MINERAL_CATEGORIES[mineral.category].color;
  const positive = mineral.priceChangePercent24h >= 0;

  return (
    <Card variant="elevated" className="h-full">
      <Card.Header className="mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              {mineral.symbol}
            </span>
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
          </div>
          <h3 className="mt-2 text-xl font-semibold text-[#0A0A0A]">
            {mineral.name}
          </h3>
        </div>

        <Badge variant="category">{formatMineralCategory(mineral.category)}</Badge>
      </Card.Header>

      <Card.Body>
        <div className="space-y-2">
          <p className="text-3xl font-semibold text-[#0A0A0A]">
            {formatPrice(mineral.currentPrice, mineral.currency)}
          </p>
          <div className="flex items-center gap-2">
            <Badge variant={positive ? "positive" : "negative"}>
              {formatChange(mineral.priceChangePercent24h)}
            </Badge>
            <span className={cn("text-sm", positive ? "text-emerald-700" : "text-rose-700")}>
              {formatPrice(mineral.priceChange24h, mineral.currency)}
            </span>
          </div>
        </div>

        <div className="flex h-12 items-end gap-1 pt-2">
          {[36, 44, 51, 48, 60, 66, 62].map((height, index) => (
            <span
              key={`${mineral.id}-${index}`}
              className="w-full rounded-full bg-[#1B4332]/20"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </Card.Body>

      <Card.Footer className="flex-col items-stretch gap-2 sm:flex-row">
        <Button
          variant="outline"
          size="sm"
          icon={<BellRing className="h-4 w-4" />}
          onClick={() => onCreateAlert?.(mineral)}
          fullWidth
        >
          Créer alerte
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={
            isInWatchlist ? (
              <StarOff className="h-4 w-4" />
            ) : (
              <Star className="h-4 w-4" />
            )
          }
          onClick={() => {
            if (isInWatchlist) {
              onRemoveWatchlist?.(mineral);
              return;
            }

            onAddWatchlist?.(mineral);
          }}
          fullWidth
        >
          {isInWatchlist ? "Retirer" : "Ajouter"}
        </Button>
      </Card.Footer>
    </Card>
  );
}
