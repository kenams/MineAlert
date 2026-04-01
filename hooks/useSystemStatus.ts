import { useQuery } from "@tanstack/react-query";

import { SYSTEM_STATUS_REFRESH_MS } from "@/lib/utils/constants";
import type { ApiResponse, DataFreshnessStatus } from "@/types";

type SystemStatusApiPayload =
  | DataFreshnessStatus
  | ApiResponse<DataFreshnessStatus>;

function isApiResponse<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    "data" in payload
  );
}

function extractSystemStatus(payload: SystemStatusApiPayload): DataFreshnessStatus {
  if (isApiResponse<DataFreshnessStatus>(payload)) {
    return (
      payload.data ?? {
        mode: "live",
        latestPriceUpdateAt: null,
        latestNewsUpdateAt: null,
        latestDataAt: null,
        latestDataAgeMs: null,
        freshnessStatus: "unavailable",
      }
    );
  }

  return payload;
}

async function fetchSystemStatus(): Promise<DataFreshnessStatus> {
  const response = await fetch("/api/system/status", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Impossible de charger le statut systeme.");
  }

  const payload = (await response.json()) as SystemStatusApiPayload;
  return extractSystemStatus(payload);
}

/**
 * Récupère le statut global de fraîcheur des données affichées dans le dashboard.
 */
export function useSystemStatus() {
  const query = useQuery({
    queryKey: ["system-status"],
    queryFn: fetchSystemStatus,
    staleTime: SYSTEM_STATUS_REFRESH_MS,
    refetchInterval: SYSTEM_STATUS_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  return {
    status: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
