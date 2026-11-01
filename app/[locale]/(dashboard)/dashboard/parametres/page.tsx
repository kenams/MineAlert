import { notFound } from "next/navigation";

import {
  getConfiguredScraperBaseUrl,
  getConfiguredSiteUrl,
  getScraperCronExpression,
  isCronSecretConfigured,
  isResendConfigured,
  isScraperAutoSyncEnabled,
  isScraperBootSyncEnabled,
} from "@/lib/config/server";
import { createT, isLocale } from "@/lib/i18n";
import { getDataFreshnessStatus } from "@/lib/server/data";
import {
  formatDataFreshnessLabel,
  formatDate,
  formatRefreshLabel,
} from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

function MonitoringRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="max-w-[60%] text-right text-sm font-medium text-[#0A0A0A]">
        {value}
      </p>
    </div>
  );
}

export default async function SettingsPage({
  params,
}: {
  params: { locale: string };
}): Promise<JSX.Element> {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const { locale } = params;
  const t = createT(locale);
  const freshness = await getDataFreshnessStatus();
  const freshnessLabel = formatDataFreshnessLabel(
    freshness.latestDataAgeMs,
    freshness.freshnessStatus,
    locale
  );
  const freshnessVariant =
    freshness.freshnessStatus === "fresh"
      ? "positive"
      : freshness.freshnessStatus === "stale"
        ? "negative"
        : "neutral";

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <Card.Header>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("settings.label")}</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">
              {t("settings.title")}
            </h1>
          </div>
          <Badge variant={freshnessVariant}>
            {freshness.freshnessStatus === "fresh"
              ? t("settings.fresh")
              : freshness.freshnessStatus === "stale"
                ? t("settings.stale")
                : t("settings.unavailable")}
          </Badge>
        </Card.Header>

        <Card.Body className="space-y-4">
          <p className="text-sm leading-7 text-slate-600">{t("settings.intro")}</p>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t("settings.pipeline")}</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    {t("settings.pipelineTitle")}
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                <MonitoringRow label={t("settings.globalStatus")} value={freshnessLabel} />
                <MonitoringRow
                  label={t("settings.expectedCadence")}
                  value={formatRefreshLabel(freshness.expectedRefreshLabel, locale)}
                />
                <MonitoringRow
                  label={t("settings.lastData")}
                  value={
                    freshness.latestDataAt
                      ? formatDate(freshness.latestDataAt, locale)
                      : t("settings.noData")
                  }
                />
                <MonitoringRow
                  label={t("settings.lastPrice")}
                  value={
                    freshness.latestPriceUpdateAt
                      ? formatDate(freshness.latestPriceUpdateAt, locale)
                      : t("settings.noPrice")
                  }
                />
                <MonitoringRow
                  label={t("settings.lastNews")}
                  value={
                    freshness.latestNewsUpdateAt
                      ? formatDate(freshness.latestNewsUpdateAt, locale)
                      : t("settings.noNews")
                  }
                />
                <MonitoringRow
                  label={t("settings.dataMode")}
                  value={freshness.mode === "live" ? t("dataMode.live") : t("dataMode.demo")}
                />
              </Card.Body>
            </Card>

            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t("settings.runtime")}</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    {t("settings.runtimeTitle")}
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                <MonitoringRow
                  label={t("settings.environment")}
                  value={process.env.NODE_ENV ?? "development"}
                />
                <MonitoringRow
                  label={t("settings.deployment")}
                  value={process.env.VERCEL === "1" ? "Vercel" : t("settings.nodeLocal")}
                />
                <MonitoringRow
                  label={t("settings.siteUrl")}
                  value={getConfiguredSiteUrl() ?? t("settings.notConfigured")}
                />
                <MonitoringRow
                  label={t("settings.scraperUrl")}
                  value={getConfiguredScraperBaseUrl() ?? t("settings.notConfigured")}
                />
                <MonitoringRow
                  label={t("settings.cron")}
                  value={getScraperCronExpression()}
                />
              </Card.Body>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t("settings.secrets")}</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    {t("settings.services")}
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                <MonitoringRow
                  label="CRON_SECRET"
                  value={isCronSecretConfigured() ? t("settings.configured") : t("settings.absent")}
                />
                <MonitoringRow
                  label="Resend"
                  value={isResendConfigured() ? t("settings.configured") : t("settings.disabled")}
                />
              </Card.Body>
            </Card>

            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t("settings.worker")}</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    {t("settings.autoSync")}
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                <MonitoringRow
                  label={t("settings.autoSync")}
                  value={isScraperAutoSyncEnabled() ? t("settings.enabled") : t("settings.disabled")}
                />
                <MonitoringRow
                  label={t("settings.bootSync")}
                  value={isScraperBootSyncEnabled() ? t("settings.enabled") : t("settings.disabled")}
                />
              </Card.Body>
            </Card>

            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{t("settings.operations")}</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    {t("settings.readStatus")}
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3 text-sm leading-7 text-slate-600">
                <p>{t("settings.note1")}</p>
                <p>{t("settings.note2")}</p>
              </Card.Body>
            </Card>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
