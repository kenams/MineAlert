import { Card } from "@/components/ui/Card";
import {
  getCurrentUserProfile,
  getUserAlerts,
  getWatchlistMinerals,
} from "@/lib/server/data";
import { ALERT_LIMITS, WATCHLIST_LIMITS } from "@/lib/utils/constants";
import { formatPlanName } from "@/lib/utils/formatters";

/**
 * Vue profil branchee sur le vrai compte utilisateur.
 */
export default async function ProfilePage(): Promise<JSX.Element> {
  const profile = await getCurrentUserProfile();
  const alerts = await getUserAlerts();
  const watchlist = await getWatchlistMinerals();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card variant="elevated">
        <Card.Header>
          <div>
            <p className="text-sm font-medium text-slate-500">Profil</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">
              {profile.fullName}
            </h1>
          </div>
        </Card.Header>
        <Card.Body className="space-y-4 text-sm text-slate-600">
          <p>Email : {profile.email}</p>
          <p>Plan : {formatPlanName(profile.plan)}</p>
          <p>ID compte : {profile.id}</p>
        </Card.Body>
      </Card>

      <Card variant="gold">
        <Card.Header>
          <div>
            <p className="text-sm font-medium text-slate-500">Capacite du compte</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">
              Limites actuelles
            </h2>
          </div>
        </Card.Header>
        <Card.Body className="space-y-4 text-sm text-slate-600">
          <p>Alertes : {alerts.length}/{ALERT_LIMITS[profile.plan]}</p>
          <p>Watchlist : {watchlist.length}/{WATCHLIST_LIMITS[profile.plan]}</p>
          <p>Cree le : {new Date(profile.createdAt).toLocaleDateString("fr-FR")}</p>
        </Card.Body>
      </Card>
    </div>
  );
}
