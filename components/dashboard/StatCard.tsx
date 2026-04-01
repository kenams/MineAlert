"use client";

import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

type StatCardProps = {
  title: string;
  value: string;
  change?: string;
  changePercent?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
};

/**
 * Carte statistique premium pour les indicateurs clés du dashboard.
 */
export function StatCard({
  title,
  value,
  change,
  changePercent,
  icon,
  trend = "neutral",
}: StatCardProps): JSX.Element {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <Card variant="elevated" className="overflow-hidden">
      <Card.Header className="mb-3 items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-[#0A0A0A]">{value}</p>
        </div>

        <div className="rounded-2xl bg-[#1B4332]/8 p-3 text-[#1B4332]">{icon}</div>
      </Card.Header>

      <Card.Body className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
              trend === "up" && "bg-emerald-50 text-emerald-700",
              trend === "down" && "bg-rose-50 text-rose-700",
              trend === "neutral" && "bg-slate-100 text-slate-600"
            )}
          >
            <TrendIcon className="h-4 w-4" />
            {change ?? "Stable"}
          </span>
          {changePercent ? <span className="text-slate-500">{changePercent}</span> : null}
        </div>

        <div className="flex h-10 items-end gap-1">
          {[36, 44, 42, 54, 51, 66, 62].map((height, index) => (
            <span
              key={`${title}-${index}`}
              className={cn(
                "w-full rounded-full",
                trend === "up" && "bg-emerald-400/70",
                trend === "down" && "bg-rose-400/70",
                trend === "neutral" && "bg-[#D4AF37]/70"
              )}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}
