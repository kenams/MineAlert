"use client";

import { useEffect, useMemo, useState } from "react";

import { AlertCard } from "@/components/dashboard/AlertCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAlerts } from "@/hooks/useAlerts";
import { useWatchlist } from "@/hooks/useMineral";
import { usePrices } from "@/hooks/usePrices";
import { ALERT_LIMITS } from "@/lib/utils/constants";

/**
 * Vue alertes avec liste, modal de création et jauge d'utilisation.
 */
export default function AlertsPage(): JSX.Element {
  const { alerts, create, remove, isCreating } = useAlerts();
  const { prices } = usePrices();
  const { watchlist } = useWatchlist();
  const [open, setOpen] = useState(false);
  const [selectedMineralId, setSelectedMineralId] = useState("");
  const [threshold, setThreshold] = useState("");
  const [type, setType] = useState<"price_above" | "price_below" | "change_percent">(
    "price_above"
  );
  const [error, setError] = useState<string | null>(null);

  const usage = Math.min(100, (alerts.length / ALERT_LIMITS.free) * 100);
  const availableMinerals = watchlist.length > 0 ? watchlist : prices;
  const selectedMineral = availableMinerals.find(
    (item) => item.id === selectedMineralId
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!selectedMineralId && availableMinerals[0]) {
      setSelectedMineralId(availableMinerals[0].id);
    }
  }, [availableMinerals, open, selectedMineralId]);

  useEffect(() => {
    if (!selectedMineral) {
      return;
    }

    if (type === "change_percent") {
      setThreshold("2");
      return;
    }

    const ratio = type === "price_above" ? 1.03 : 0.97;
    const nextThreshold = selectedMineral.currentPrice * ratio;
    setThreshold(nextThreshold.toFixed(selectedMineral.currentPrice >= 100 ? 0 : 2));
  }, [selectedMineral?.id, type]);

  const preview = useMemo(() => {
    if (!selectedMineral) {
      return "Sélectionnez un minerai pour prévisualiser l'alerte.";
    }

    if (type === "price_above") {
      return `Vous serez alerté quand ${selectedMineral.name} dépassera ${threshold}.`;
    }

    if (type === "price_below") {
      return `Vous serez alerté quand ${selectedMineral.name} passera sous ${threshold}.`;
    }

    return `Vous serez alerté quand ${selectedMineral.name} variera de plus de ${threshold}%.`;
  }, [selectedMineral, threshold, type]);

  async function handleCreateAlert() {
    setError(null);

    if (!selectedMineralId || !threshold) {
      setError("Sélectionnez un minerai et un seuil.");
      return;
    }

    try {
      await create({
        mineralId: selectedMineralId,
        threshold: Number(threshold),
        type,
        currency: "USD",
      });
      setOpen(false);
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "Création d'alerte impossible."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0A0A0A]">Mes alertes</h1>
            <p className="text-sm text-slate-500">
              Gérez vos seuils de prix et vos variations critiques.
            </p>
          </div>

          <Button onClick={() => setOpen(true)}>Nouvelle alerte</Button>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Utilisation du plan gratuit</span>
            <span>
              {alerts.length}/{ALERT_LIMITS.free}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#D4AF37]"
              style={{ width: `${usage}%` }}
            />
          </div>
        </div>

        {alerts.length >= ALERT_LIMITS.free ? (
          <Alert className="mt-5" variant="warning">
            Vous avez atteint la limite du plan gratuit. Passez au plan Pro pour aller plus loin.
          </Alert>
        ) : null}
      </div>

      {alerts.length === 0 ? (
        <Alert variant="info" title="Aucune alerte créée pour le moment.">
          Commencez par surveiller un seuil de prix sur un minerai de votre watchlist.
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDelete={(alertId) => void remove({ id: alertId })}
            />
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Créer une nouvelle alerte"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button loading={isCreating} onClick={() => void handleCreateAlert()}>
              Créer l'alerte
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}

          {watchlist.length > 0 ? (
            <Alert variant="info" title="Suggestion">
              La sélection propose d'abord les minerais de votre watchlist pour accélérer la création.
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0A0A0A]">Minerai</label>
              <select
                value={selectedMineralId}
                onChange={(event) => setSelectedMineralId(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
              >
                <option value="">Sélectionner</option>
                {availableMinerals.map((mineral) => (
                  <option key={mineral.id} value={mineral.id}>
                    {mineral.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0A0A0A]">Type</label>
              <select
                value={type}
                onChange={(event) =>
                  setType(
                    event.target.value as "price_above" | "price_below" | "change_percent"
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
              >
                <option value="price_above">Prix dépasse</option>
                <option value="price_below">Prix passe sous</option>
                <option value="change_percent">Variation %</option>
              </select>
            </div>
          </div>

          <Input
            label="Seuil"
            type="number"
            value={threshold}
            onChange={(event) => setThreshold(event.target.value)}
            hint={
              type === "change_percent"
                ? "Pourcentage de variation déclenchant l'alerte."
                : "Prix cible en USD pour ce minerai."
            }
          />

          <Alert variant="info">{preview}</Alert>
        </div>
      </Modal>
    </div>
  );
}
