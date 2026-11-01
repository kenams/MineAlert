"use client";

import { BellRing, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { mineralName } from "@/lib/data/minerals";
import { useLocale, useT } from "@/lib/i18n/provider";
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
  const locale = useLocale();
  const t = useT();
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
              {alert.mineral
                ? mineralName(locale, alert.mineral.symbol, alert.mineral.name)
                : t("alertCard.fallbackMineral")}
            </p>
          </div>
          <p className="mt-1 text-sm text-slate-500">{formatAlertType(alert.type, locale)}</p>
        </div>

        <Badge variant={alert.isActive ? "positive" : "neutral"}>
          {alert.isActive ? t("alertCard.active") : t("alertCard.paused")}
        </Badge>
      </Card.Header>

      <Card.Body>
        <div className="space-y-2 text-sm text-slate-600">
          {alert.type === "news_keyword" ? (
            <p>
              {t("alertCard.keyword")}{" "}
              <strong className="text-[#0A0A0A]">
                {locale === "en" ? `"${alert.keyword ?? "—"}"` : `« ${alert.keyword ?? "—"} »`}
              </strong>
            </p>
          ) : (
            <p>
              {t("alertCard.threshold")}{" "}
              <strong className="text-[#0A0A0A]">
                {formatPrice(alert.threshold, alert.currency, locale)}
              </strong>
            </p>
          )}
          <p>
            {t("alertCard.currentPrice")}{" "}
            <strong className="text-[#0A0A0A]">
              {formatPrice(currentPrice, alert.currency, locale)}
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
          <p className="text-xs text-slate-500">{t("alertCard.progress", { pct: progress.toFixed(0) })}</p>
        </div>

        {alert.triggeredAt ? (
          <p className="text-xs text-slate-500">
            {t("alertCard.lastTriggered", { date: formatDate(alert.triggeredAt, locale) })}
          </p>
        ) : (
          <p className="text-xs text-slate-500">{t("alertCard.neverTriggered")}</p>
        )}
      </Card.Body>

      <Card.Footer>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => onDelete?.(alert.id)}
        >
          {t("alertCard.delete")}
        </Button>
      </Card.Footer>
    </Card>
  );
}
