import { useQuery } from "@tanstack/react-query";

import {
  DEFAULT_CURRENCY,
  DEFAULT_PRICE_HISTORY_PERIOD,
  LIVE_PRICE_HISTORY_REFRESH_MS,
  LIVE_PRICES_REFRESH_MS,
  PRICE_CACHE_MINUTES,
} from "@/lib/utils/constants";
import type { ApiResponse, Mineral, PriceHistory } from "@/types";

type PriceHistoryApiPayload =
  | PriceHistory[]
  | { history: PriceHistory[] }
  | ApiResponse<PriceHistory[]>
  | ApiResponse<{ history: PriceHistory[] }>;

type PricesApiPayload = Mineral[] | ApiResponse<Mineral[]>;

const MOCK_PRICES: Mineral[] = [
  {
    id: "mineral-xau",
    name: "Or",
    symbol: "XAU",
    category: "precious_metals",
    unit: "oz",
    currentPrice: 1950,
    priceChange24h: 18.45,
    priceChangePercent24h: 0.95,
    weekHigh: 1968,
    weekLow: 1918,
    monthHigh: 1988,
    monthLow: 1886,
    currency: DEFAULT_CURRENCY,
    lastUpdated: new Date().toISOString(),
    description: "Métal précieux refuge mondial.",
    mainProducers: ["Chine", "Australie", "Russie"],
    useCases: ["Investissement", "Bijoux", "Électronique"],
  },
  {
    id: "mineral-cu",
    name: "Cuivre",
    symbol: "CU",
    category: "base_metals",
    unit: "lb",
    currentPrice: 3.85,
    priceChange24h: -0.04,
    priceChangePercent24h: -1.03,
    weekHigh: 3.94,
    weekLow: 3.79,
    monthHigh: 4.02,
    monthLow: 3.68,
    currency: DEFAULT_CURRENCY,
    lastUpdated: new Date().toISOString(),
    description: "Métal de base essentiel à l'électrification.",
    mainProducers: ["Chili", "Pérou", "Congo"],
    useCases: ["Câbles", "Construction", "Véhicules électriques"],
  },
  {
    id: "mineral-li",
    name: "Lithium",
    symbol: "LI",
    category: "battery_metals",
    unit: "tonne",
    currentPrice: 22000,
    priceChange24h: 280,
    priceChangePercent24h: 1.29,
    weekHigh: 22400,
    weekLow: 21450,
    monthHigh: 23200,
    monthLow: 20800,
    currency: DEFAULT_CURRENCY,
    lastUpdated: new Date().toISOString(),
    description: "Métal phare de la transition énergétique.",
    mainProducers: ["Australie", "Chili", "Argentine"],
    useCases: ["Batteries", "Céramique", "Lubrifiants"],
  },
];

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    "data" in payload
  );
}

function createMockPriceHistory(symbol: string, period: string): PriceHistory[] {
  const mineral = MOCK_PRICES.find((entry) => entry.symbol === symbol) ?? MOCK_PRICES[0];
  const points =
    period === "7d" ? 7 : period === "90d" ? 12 : period === "1y" ? 12 : 10;

  return Array.from({ length: points }).map((_, index) => ({
    mineralId: mineral.id,
    price: Number((mineral.currentPrice * (0.96 + index * 0.008)).toFixed(2)),
    currency: mineral.currency,
    source: "mock-feed",
    timestamp: new Date(
      Date.now() - (points - index) * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));
}

function extractPrices(payload: PricesApiPayload): Mineral[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isApiResponse<Mineral[]>(payload)) {
    return payload.data ?? [];
  }

  return [];
}

function extractHistory(payload: PriceHistoryApiPayload): PriceHistory[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isApiResponse<PriceHistory[]>(payload)) {
    return payload.data ?? [];
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "history" in payload &&
    Array.isArray(payload.history)
  ) {
    return payload.history;
  }

  if (
    isApiResponse<{ history: PriceHistory[] }>(payload) &&
    payload.data &&
    Array.isArray(payload.data.history)
  ) {
    return payload.data.history;
  }

  return [];
}

async function fetchPrices(category?: string): Promise<Mineral[]> {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";

  try {
    const response = await fetch(`/api/prix${query}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les prix.");
    }

    const payload = (await response.json()) as PricesApiPayload;
    const prices = extractPrices(payload);

    return category
      ? prices.filter((item) => item.category === category)
      : prices;
  } catch {
    return category
      ? MOCK_PRICES.filter((item) => item.category === category)
      : MOCK_PRICES;
  }
}

async function fetchPriceHistory(
  symbol: string,
  period: string
): Promise<PriceHistory[]> {
  try {
    const response = await fetch(
      `/api/prix/${encodeURIComponent(symbol)}/history?period=${encodeURIComponent(period)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Impossible de charger l'historique des prix.");
    }

    const payload = (await response.json()) as PriceHistoryApiPayload;
    return extractHistory(payload);
  } catch {
    return createMockPriceHistory(symbol, period);
  }
}

/**
 * Récupère la liste des prix actuels des minerais, avec rafraîchissement périodique et fallback mock.
 */
export function usePrices(category?: string) {
  const query = useQuery({
    queryKey: ["prices", category],
    queryFn: () => fetchPrices(category),
    staleTime: Math.min(PRICE_CACHE_MINUTES * 60 * 1000, LIVE_PRICES_REFRESH_MS),
    refetchInterval: LIVE_PRICES_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  return {
    prices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Récupère l'historique de prix d'un symbole donné sur une période choisie.
 */
export function usePriceHistory(
  symbol: string,
  period: string = DEFAULT_PRICE_HISTORY_PERIOD
) {
  const query = useQuery({
    queryKey: ["price-history", symbol, period],
    queryFn: () => fetchPriceHistory(symbol, period),
    enabled: Boolean(symbol),
    staleTime: Math.min(
      PRICE_CACHE_MINUTES * 60 * 1000,
      LIVE_PRICE_HISTORY_REFRESH_MS
    ),
    refetchInterval: LIVE_PRICE_HISTORY_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  return {
    history: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
