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

/**
 * Page paramètres transformée en panneau de contrôle léger pour la bêta privée.
 */
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
            <p className="text-sm font-medium text-slate-500">Paramètres</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">
              Santé de l'application
            </h1>
          </div>
          <Badge variant={freshnessVariant}>
            {freshness.freshnessStatus === "fresh"
              ? "Données fraîches"
              : freshness.freshnessStatus === "stale"
                ? "Scraper en retard"
                : "Données indisponibles"}
          </Badge>
        </Card.Header>
        <Card.Body className="space-y-4">
          <p className="text-sm leading-7 text-slate-600">
            Ce panneau résume l'état du pipeline live, des services critiques et de la configuration runtime sans exposer de secret.
          </p>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pipeline live</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    Scraper et fraîcheur
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3">
                <MonitoringRow label="Statut global" value={freshnessLabel} />
                <MonitoringRow
                  label="Dernière donnée reçue"
                  value={
                    freshness.latestDataAt
                      ? formatDate(freshness.latestDataAt)
                      : "Aucune donnée"
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
                  label="Dernière actualité"
                  value={
                    freshness.latestNewsUpdateAt
                      ? formatDate(freshness.latestNewsUpdateAt)
                      : "Aucune actualité"
                  }
                />
                <MonitoringRow
                  label="Mode de données"
                  value={freshness.mode === "live" ? "Supabase live" : "Mode démo"}
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
                  label="Déploiement"
                  value={process.env.VERCEL === "1" ? "Vercel" : "Node local"}
                />
                <MonitoringRow
                  label="Site URL"
                  value={getConfiguredSiteUrl() ?? "Non configuré"}
                />
                <MonitoringRow
                  label="Scraper base URL"
                  value={getConfiguredScraperBaseUrl() ?? "Non configuré"}
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
                  value={isCronSecretConfigured() ? "Configuré" : "Absent"}
                />
                <MonitoringRow
                  label="Resend"
                  value={isResendConfigured() ? "Configuré" : "Désactivé"}
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
                  value={isScraperAutoSyncEnabled() ? "Activé" : "Désactivé"}
                />
                <MonitoringRow
                  label="Boot sync"
                  value={isScraperBootSyncEnabled() ? "Activé" : "Désactivé"}
                />
              </Card.Body>
            </Card>

            <Card variant="bordered" className="p-4">
              <Card.Header className="mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Opérations</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#0A0A0A]">
                    Prochaine étape
                  </h2>
                </div>
              </Card.Header>
              <Card.Body className="space-y-3 text-sm leading-7 text-slate-600">
                <p>
                  Si le statut devient « scraper en retard », vérifiez les logs Vercel ou relancez un sync manuel via l'endpoint protégé.
                </p>
                <p>
                  Sur Vercel Hobby, le cron reste limité. Pour du vrai quasi temps réel, il faudra passer sur Pro ou déplacer l'orchestration.
                </p>
              </Card.Body>
            </Card>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
