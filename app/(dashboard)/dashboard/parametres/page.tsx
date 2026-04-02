import {
  getConfiguredScraperBaseUrl,
  getConfiguredSiteUrl,
  getScraperCronExpression,
  isCronSecretConfigured,
  isResendConfigured,
  isScraperAutoSyncEnabled,
  isScraperBootSyncEnabled,
} from "@/lib/config/server";
import { getDataFreshnessStatus } from "@/lib/server/data";
import { formatDataFreshnessLabel, formatDate } from "@/lib/utils/formatters";
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

export default async function SettingsPage(): Promise<JSX.Element> {
  const freshness = await getDataFreshnessStatus();
  const freshnessLabel = formatDataFreshnessLabel(
    freshness.latestDataAgeMs,
    freshness.freshnessStatus
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
            <p className="text-sm font-medium text-slate-500">Parametres</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">
              Sante de l'application
            </h1>
          </div>
          <Badge variant={freshnessVariant}>
            {freshness.freshnessStatus === "fresh"
              ? "Donnees a jour"
              : freshness.freshnessStatus === "stale"
                ? "Rafraichissement en retard"
                : "Donnees indisponibles"}
          </Badge>
        </Card.Header>

        <Card.Body className="space-y-4">
          <p className="text-sm leading-7 text-slate-600">
            Ce panneau resume l'etat du pipeline live, des services critiques et
            de la configuration runtime, sans exposer de secret.
          </p>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pipeline live</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    Scraper et fraicheur
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                <MonitoringRow label="Statut global" value={freshnessLabel} />
                <MonitoringRow
                  label="Cadence attendue"
                  value={freshness.expectedRefreshLabel}
                />
                <MonitoringRow
                  label="Derniere donnee recue"
                  value={
                    freshness.latestDataAt
                      ? formatDate(freshness.latestDataAt)
                      : "Aucune donnee"
                  }
                />
                <MonitoringRow
                  label="Dernier prix"
                  value={
                    freshness.latestPriceUpdateAt
                      ? formatDate(freshness.latestPriceUpdateAt)
                      : "Aucun prix"
                  }
                />
                <MonitoringRow
                  label="Derniere actualite"
                  value={
                    freshness.latestNewsUpdateAt
                      ? formatDate(freshness.latestNewsUpdateAt)
                      : "Aucune actualite"
                  }
                />
                <MonitoringRow
                  label="Mode de donnees"
                  value={freshness.mode === "live" ? "Supabase live" : "Mode demo"}
                />
              </Card.Body>
            </Card>

            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Runtime</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    Configuration active
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                <MonitoringRow
                  label="Environnement"
                  value={process.env.NODE_ENV ?? "development"}
                />
                <MonitoringRow
                  label="Deploiement"
                  value={process.env.VERCEL === "1" ? "Vercel" : "Node local"}
                />
                <MonitoringRow
                  label="Site URL"
                  value={getConfiguredSiteUrl() ?? "Non configure"}
                />
                <MonitoringRow
                  label="Scraper base URL"
                  value={getConfiguredScraperBaseUrl() ?? "Non configure"}
                />
                <MonitoringRow
                  label="Expression cron"
                  value={getScraperCronExpression()}
                />
              </Card.Body>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Secrets</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    Services
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                <MonitoringRow
                  label="CRON_SECRET"
                  value={isCronSecretConfigured() ? "Configure" : "Absent"}
                />
                <MonitoringRow
                  label="Resend"
                  value={isResendConfigured() ? "Configure" : "Desactive"}
                />
              </Card.Body>
            </Card>

            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Worker</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    Auto-sync
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                <MonitoringRow
                  label="Auto-sync"
                  value={isScraperAutoSyncEnabled() ? "Active" : "Desactive"}
                />
                <MonitoringRow
                  label="Boot sync"
                  value={isScraperBootSyncEnabled() ? "Active" : "Desactive"}
                />
              </Card.Body>
            </Card>

            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Operations</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    Lecture du statut
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  En mode gratuit heberge, un decalage de plusieurs heures peut
                  rester normal si la synchronisation est quotidienne.
                </p>
                <p>
                  Si les donnees depassent nettement la cadence attendue,
                  verifiez les logs Vercel ou relancez un sync manuel via
                  l'endpoint protege.
                </p>
              </Card.Body>
            </Card>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
