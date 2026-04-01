"use client";

import { BellRing, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import {
  formatAlertType,
  formatDate,
  formatPrice,
} from "@/lib/utils/formatters";
import type { UserAlert } from "@/types";

type AlertCardProps = {
  alert: UserAlert;
  onDelete?: (alertId: string) => void;
};

/**
 * Carte d'alerte utilisateur avec seuil, progression et action de suppression.
 */
export function AlertCard({
  alert,
  onDelete,
}: AlertCardProps): JSX.Element {
  const currentPrice = alert.mineral?.currentPrice ?? 0;
  const progress =
    alert.threshold > 0
      ? Math.min(100, Math.max(0, (currentPrice / alert.threshold) * 100))
      : 0;

  return (
    <Card variant="bordered" className="h-full">
      <Card.Header className="mb-3">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-[#1B4332]" />
            <p className="text-sm font-semibold text-[#0A0A0A]">
              {alert.mineral?.name ?? "Minerai"}
            </p>
          </div>
          <p className="mt-1 text-sm text-slate-500">{formatAlertType(alert.type)}</p>
        </div>

        <Badge variant={alert.isActive ? "positive" : "neutral"}>
          {alert.isActive ? "Active" : "Pause"}
        </Badge>
      </Card.Header>

      <Card.Body>
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            Seuil :{" "}
            <strong className="text-[#0A0A0A]">
              {formatPrice(alert.threshold, alert.currency)}
            </strong>
          </p>
          <p>
            Prix actuel :{" "}
            <strong className="text-[#0A0A0A]">
              {formatPrice(currentPrice, alert.currency)}
            </strong>
          </p>
        </div>

        <div className="space-y-2">
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full",
                progress >= 100 ? "bg-emerald-500" : "bg-[#D4AF37]"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">{progress.toFixed(0)}% vers le seuil</p>
        </div>

        {alert.triggeredAt ? (
          <p className="text-xs text-slate-500">
            Dernier déclenchement : {formatDate(alert.triggeredAt)}
          </p>
        ) : (
          <p className="text-xs text-slate-500">Aucun déclenchement récent.</p>
        )}
      </Card.Body>

      <Card.Footer>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => onDelete?.(alert.id)}
        >
          Supprimer
        </Button>
      </Card.Footer>
    </Card>
  );
}
