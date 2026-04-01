import { sendAlertEmail } from "@/lib/email/sender";
import {
  getCurrentUserProfile,
  getMinerals,
  getUserAlerts,
} from "@/lib/server/data";
import { formatAlertType } from "@/lib/utils/formatters";
import type { Mineral, UserAlert } from "@/types";

/**
 * Évalue si une alerte doit être considérée comme déclenchée pour un minerai donné.
 */
export function evaluateCondition(alert: UserAlert, mineral: Mineral): boolean {
  if (!alert.isActive) {
    return false;
  }

  switch (alert.type) {
    case "price_above":
      return mineral.currentPrice > alert.threshold;
    case "price_below":
      return mineral.currentPrice < alert.threshold;
    case "change_percent":
      return Math.abs(mineral.priceChangePercent24h) > alert.threshold;
    case "news_keyword":
      return false;
    default:
      return false;
  }
}

/**
 * Déclenche une alerte de manière défensive et prépare l'envoi d'email si disponible.
 */
export async function triggerAlert(
  alert: UserAlert,
  mineral: Mineral
): Promise<void> {
  try {
    const profile = await getCurrentUserProfile();

    await sendAlertEmail({
      to: profile.email,
      mineralName: mineral.name,
      threshold: alert.threshold,
      currentPrice: mineral.currentPrice,
      alertLabel: formatAlertType(alert.type),
    });
  } catch {
    return;
  }
}

/**
 * Vérifie toutes les alertes actives sans faire tomber le processus sur une alerte en erreur.
 */
export async function checkAllAlerts(): Promise<{
  checked: number;
  triggered: number;
}> {
  const alerts = await getUserAlerts();
  const minerals = await getMinerals();

  let triggered = 0;

  for (const alert of alerts) {
    const mineral =
      alert.mineral ??
      minerals.find((candidate) => candidate.id === alert.mineralId);

    if (!mineral) {
      continue;
    }

    try {
      if (evaluateCondition(alert, mineral)) {
        triggered += 1;
        await triggerAlert(alert, mineral);
      }
    } catch {
      continue;
    }
  }

  return {
    checked: alerts.length,
    triggered,
  };
}
