import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LIVE_PORTFOLIO_REFRESH_MS } from "@/lib/utils/constants";
import type { ApiResponse, CurrencyCode, UserAlert } from "@/types";

export type CreateAlertInput = {
  mineralId: string;
  type: UserAlert["type"];
  threshold: number;
  currency: CurrencyCode;
};

export type DeleteAlertInput = {
  id: string;
};

type AlertsApiPayload =
  | UserAlert[]
  | { alerts: UserAlert[] }
  | ApiResponse<UserAlert[]>
  | ApiResponse<{ alerts: UserAlert[] }>;

const MOCK_ALERTS: UserAlert[] = [
  {
    id: "alert-1",
    userId: "demo-user",
    mineralId: "mineral-xau",
    type: "price_above",
    condition: "greater_than",
    threshold: 2000,
    currency: "USD",
    isActive: true,
    createdAt: new Date().toISOString(),
    mineral: {
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
  },
  {
    id: "alert-2",
    userId: "demo-user",
    mineralId: "mineral-cu",
    type: "change_percent",
    condition: "greater_than",
    threshold: 2,
    currency: "USD",
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    triggeredAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    mineral: {
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

function extractAlerts(payload: AlertsApiPayload): UserAlert[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "alerts" in payload &&
    Array.isArray(payload.alerts)
  ) {
    return payload.alerts;
  }

  if (isApiResponse<UserAlert[]>(payload)) {
    return payload.data ?? [];
  }

  if (
    isApiResponse<{ alerts: UserAlert[] }>(payload) &&
    payload.data &&
    Array.isArray(payload.data.alerts)
  ) {
    return payload.data.alerts;
  }

  return [];
}

async function fetchAlerts(): Promise<UserAlert[]> {
  try {
    const response = await fetch("/api/alertes", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Impossible de charger les alertes.");
    }

    const payload = (await response.json()) as AlertsApiPayload;
    return extractAlerts(payload);
  } catch {
    if (isSupabaseConfigured()) {
      return [];
    }

    return MOCK_ALERTS;
  }
}

async function createAlert(input: CreateAlertInput): Promise<UserAlert> {
  const response = await fetch("/api/alertes", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      "Impossible de créer l'alerte pour le moment. Vérifiez que l'API /api/alertes est disponible."
    );
  }

  const payload = (await response.json()) as
    | ApiResponse<UserAlert>
    | UserAlert;

  if (isApiResponse<UserAlert>(payload)) {
    if (!payload.success || !payload.data) {
      throw new Error(payload.error ?? "Création d'alerte indisponible.");
    }

    return payload.data;
  }

  return payload;
}

async function deleteAlert(input: DeleteAlertInput): Promise<void> {
  const response = await fetch("/api/alertes", {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      "Impossible de supprimer l'alerte pour le moment. Vérifiez que l'API /api/alertes est disponible."
    );
  }
}

/**
 * Récupère les alertes de l'utilisateur et expose les mutations de création et suppression.
 */
export function useAlerts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    staleTime: LIVE_PORTFOLIO_REFRESH_MS,
    refetchInterval: LIVE_PORTFOLIO_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  const createMutation = useMutation({
    mutationFn: createAlert,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  return {
    alerts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
