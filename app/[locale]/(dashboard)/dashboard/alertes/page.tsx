"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AlertCard } from "@/components/dashboard/AlertCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAlerts } from "@/hooks/useAlerts";
import { useWatchlist } from "@/hooks/useMineral";
import { usePrices } from "@/hooks/usePrices";
import { mineralName } from "@/lib/data/minerals";
import { localePath } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import { ALERT_LIMITS } from "@/lib/utils/constants";

/**
 * Vue alertes avec liste, modal de création et jauge d'utilisation.
 */
export default function AlertsPage(): JSX.Element {
  const locale = useLocale();
  const t = useT();
  const { alerts, create, remove, isCreating } = useAlerts();
  const { prices } = usePrices();
  const { watchlist } = useWatchlist();
  const [open, setOpen] = useState(false);
  const [selectedMineralId, setSelectedMineralId] = useState("");
  const [threshold, setThreshold] = useState("");
  const [type, setType] = useState<
    "price_above" | "price_below" | "change_percent" | "news_keyword"
  >("price_above");
  const [keyword, setKeyword] = useState("");
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

    if (type === "news_keyword") {
      setThreshold("0");
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
      return t("alerts.previewSelect");
    }

    if (type === "news_keyword") {
      return keyword.trim().length >= 3
        ? t("alerts.previewKeywordOk", { keyword: keyword.trim() })
        : t("alerts.previewKeywordHelp");
    }

    const name = mineralName(locale, selectedMineral.symbol, selectedMineral.name);

    if (type === "price_above") {
      return t("alerts.previewAbove", { mineral: name, threshold });
    }

    if (type === "price_below") {
      return t("alerts.previewBelow", { mineral: name, threshold });
    }

    return t("alerts.previewPercent", { mineral: name, threshold });
  }, [locale, selectedMineral, t, threshold, type, keyword]);

  async function handleCreateAlert() {
    setError(null);

    if (!selectedMineralId || !threshold) {
      setError(t("alerts.errNeedMineral"));
      return;
    }

    if (type === "news_keyword" && keyword.trim().length < 3) {
      setError(t("alerts.errKeywordLength"));
      return;
    }

    try {
      await create({
        mineralId: selectedMineralId,
        threshold: Number(threshold),
        type,
        currency: "USD",
        keyword: type === "news_keyword" ? keyword.trim() : undefined,
      });
      setOpen(false);
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : t("alerts.errCreate")
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#0A0A0A]">{t("alerts.title")}</h1>
            <p className="text-sm text-slate-500">{t("alerts.subtitle")}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={localePath(locale, "/dashboard/alertes/historique")}
              className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-medium text-[#0A0A0A] hover:bg-slate-50"
            >
              {t("alerts.history")}
            </Link>
            <Button onClick={() => setOpen(true)}>{t("alerts.new")}</Button>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{t("alerts.usage")}</span>
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
            {t("alerts.limitReached")}
          </Alert>
        ) : null}
      </div>

      {alerts.length === 0 ? (
        <Alert variant="info" title={t("alerts.emptyTitle")}>
          {t("alerts.emptyText")}
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
        title={t("alerts.modalTitle")}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("alerts.cancel")}
            </Button>
            <Button loading={isCreating} onClick={() => void handleCreateAlert()}>
              {t("alerts.create")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}

          {watchlist.length > 0 ? (
            <Alert variant="info" title={t("alerts.suggestion")}>
              {t("alerts.suggestionText")}
            </Alert>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0A0A0A]">{t("alerts.fieldMineral")}</label>
              <select
                value={selectedMineralId}
                onChange={(event) => setSelectedMineralId(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
              >
                <option value="">{t("alerts.select")}</option>
                {availableMinerals.map((mineral) => (
                  <option key={mineral.id} value={mineral.id}>
                    {mineralName(locale, mineral.symbol, mineral.name)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0A0A0A]">{t("alerts.fieldType")}</label>
              <select
                value={type}
                onChange={(event) =>
                  setType(
                    event.target.value as
                      | "price_above"
                      | "price_below"
                      | "change_percent"
                      | "news_keyword"
                  )
                }
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
              >
                <option value="price_above">{t("alerts.optAbove")}</option>
                <option value="price_below">{t("alerts.optBelow")}</option>
                <option value="change_percent">{t("alerts.optPercent")}</option>
                <option value="news_keyword">{t("alerts.optKeyword")}</option>
              </select>
            </div>
          </div>

          {type === "news_keyword" ? (
            <Input
              label={t("alerts.keyword")}
              value={keyword}
              maxLength={60}
              onChange={(event) => setKeyword(event.target.value)}
              hint={t("alerts.keywordHint")}
            />
          ) : (
            <Input
              label={t("alerts.threshold")}
              type="number"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
              hint={
                type === "change_percent"
                  ? t("alerts.thresholdPercentHint")
                  : t("alerts.thresholdPriceHint")
              }
            />
          )}

          <Alert variant="info">{preview}</Alert>
        </div>
      </Modal>
    </div>
  );
}
