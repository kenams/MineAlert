"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "@/components/ui/Card";
import { formatDate, formatPrice } from "@/lib/utils/formatters";
import type { PriceHistory } from "@/types";

type PriceChartProps = {
  data: PriceHistory[];
  period: string;
  mineral: string;
};

/**
 * Affiche l'évolution des prix d'un minerai avec Recharts.
 */
export function PriceChart({
  data,
  period,
  mineral,
}: PriceChartProps): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const currency = data[0]?.currency === "EUR" ? "EUR" : "USD";

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card variant="elevated" className="h-full">
      <Card.Header>
        <div>
          <p className="text-sm font-medium text-slate-500">Évolution des prix</p>
          <h3 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
            {mineral} · {period}
          </h3>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="h-[280px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    })
                  }
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => formatPrice(Number(value ?? 0), currency)}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    borderColor: "#e2e8f0",
                    boxShadow: "0 18px 48px -24px rgba(15, 23, 42, 0.35)",
                  }}
                  labelFormatter={(value) => formatDate(String(value))}
                  formatter={(value) => formatPrice(Number(value ?? 0), currency)}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#1B4332"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, fill: "#D4AF37", stroke: "#1B4332" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full animate-pulse rounded-2xl bg-slate-100" />
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
