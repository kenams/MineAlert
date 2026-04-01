import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LIVE_PORTFOLIO_REFRESH_MS } from "@/lib/utils/constants";
import type { ApiResponse, Mineral, PriceHistory } from "@/types";

type MineralDetail = {
  mineral: Mineral | null;
  history: PriceHistory[];
};

type MineralDetailPayload =
  | MineralDetail
  | ApiResponse<MineralDetail>;

type WatchlistPayload =
  | Mineral[]
  | { watchlist: Mineral[] }
  | ApiResponse<Mineral[]>
  | ApiResponse<{ watchlist: Mineral[] }>;

type WatchlistMutationInput = {
  mineralId: string;
};

const MOCK_WATCHLIST: Mineral[] = [
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
    currency: "USD",
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
    currency: "USD",
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
    currency: "USD",
    lastUpdated: new Date().toISOString(),
    description: "Métal phare de la transition énergétique.",
    mainProducers: ["Australie", "Chili", "Argentine"],
    useCases: ["Batteries", "Céramique", "Lubrifiants"],
  },
];

const MOCK_HISTORY: PriceHistory[] = Array.from({ length: 8 }).map((_, index) => ({
  mineralId: "mineral-xau",
  price: Number((1935 + index * 4.5).toFixed(2)),
  currency: "USD",
  timestamp: new Date(
    Date.now() - (8 - index) * 24 * 60 * 60 * 1000
  ).toISOString(),
  source: "mock-feed",
}));

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    "data" in payload
  );
}

function extractMineralDetail(payload: MineralDetailPayload): MineralDetail {
  if (isApiResponse<MineralDetail>(payload)) {
    return payload.data ?? { mineral: null, history: [] };
  }

  return payload;
}

function extractWatchlist(payload: WatchlistPayload): Mineral[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "watchlist" in payload &&
    Array.isArray(payload.watchlist)
  ) {
    return payload.watchlist;
  }

  if (isApiResponse<Mineral[]>(payload)) {
    return payload.data ?? [];
  }

  if (
    isApiResponse<{ watchlist: Mineral[] }>(payload) &&
    payload.data &&
    Array.isArray(payload.data.watchlist)
  ) {
    return payload.data.watchlist;
  }

  return [];
}

function buildMockMineralDetail(id: string): MineralDetail {
  const mineral = MOCK_WATCHLIST.find((entry) => entry.id === id) ?? MOCK_WATCHLIST[0];

  return {
    mineral,
    history: MOCK_HISTORY.map((entry) => ({
      ...entry,
      mineralId: mineral.id,
      price: Number((mineral.currentPrice * 0.96 + Math.random() * mineral.currentPrice * 0.03).toFixed(2)),
    })),
  };
}

async function fetchMineralDetail(id: string): Promise<MineralDetail> {
  try {
    const response = await fetch(`/api/minerais/${encodeURIComponent(id)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Impossible de charger le détail du minerai.");
    }

    const payload = (await response.json()) as MineralDetailPayload;
    return extractMineralDetail(payload);
  } catch {
    return buildMockMineralDetail(id);
  }
}

async function fetchWatchlist(): Promise<Mineral[]> {
  try {
    const response = await fetch("/api/watchlist", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Impossible de charger la watchlist.");
    }

    const payload = (await response.json()) as WatchlistPayload;
    return extractWatchlist(payload);
  } catch {
    if (isSupabaseConfigured()) {
      return [];
    }

    return MOCK_WATCHLIST;
  }
}

async function addToWatchlist(input: WatchlistMutationInput): Promise<void> {
  const response = await fetch("/api/watchlist", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      "Impossible d'ajouter ce minerai à la watchlist. Vérifiez que l'API /api/watchlist est disponible."
    );
  }
}

async function removeFromWatchlist(input: WatchlistMutationInput): Promise<void> {
  const response = await fetch("/api/watchlist", {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      "Impossible de retirer ce minerai de la watchlist. Vérifiez que l'API /api/watchlist est disponible."
    );
  }
}

/**
 * Récupère le détail d'un minerai et son historique de prix, avec fallback mock.
 */
export function useMineral(id: string) {
  const query = useQuery({
    queryKey: ["mineral", id],
    queryFn: () => fetchMineralDetail(id),
    enabled: Boolean(id),
    staleTime: LIVE_PORTFOLIO_REFRESH_MS,
    refetchInterval: LIVE_PORTFOLIO_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  return {
    mineral: query.data?.mineral ?? null,
    history: query.data?.history ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Récupère la watchlist utilisateur et expose les mutations d'ajout et de suppression.
 */
export function useWatchlist() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["watchlist"],
    queryFn: fetchWatchlist,
    staleTime: LIVE_PORTFOLIO_REFRESH_MS,
    refetchInterval: LIVE_PORTFOLIO_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  const addMutation = useMutation({
    mutationFn: addToWatchlist,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  return {
    watchlist: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    add: addMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
