import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { createT, isLocale } from "@/lib/i18n";
import {
  getCurrentUserProfile,
  getUserAlerts,
  getWatchlistMinerals,
} from "@/lib/server/data";
import { ALERT_LIMITS, WATCHLIST_LIMITS } from "@/lib/utils/constants";
import { formatDay, formatPlanName } from "@/lib/utils/formatters";

/**
 * Vue profil branchee sur le vrai compte utilisateur.
 */
export default async function ProfilePage({
  params,
}: {
  params: { locale: string };
}): Promise<JSX.Element> {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const { locale } = params;
  const t = createT(locale);
  const profile = await getCurrentUserProfile();
  const alerts = await getUserAlerts();
  const watchlist = await getWatchlistMinerals();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card variant="elevated">
        <Card.Header>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("profile.label")}</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">
              {profile.fullName}
            </h1>
          </div>
        </Card.Header>
        <Card.Body className="space-y-4 text-sm text-slate-600">
          <p>{t("profile.email", { value: profile.email })}</p>
          <p>{t("profile.plan", { value: formatPlanName(profile.plan, locale) })}</p>
          <p>{t("profile.id", { value: profile.id })}</p>
        </Card.Body>
      </Card>

      <Card variant="gold">
        <Card.Header>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("profile.capacity")}</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">
              {t("profile.limits")}
            </h2>
          </div>
        </Card.Header>
        <Card.Body className="space-y-4 text-sm text-slate-600">
          <p>{t("profile.alerts", { count: alerts.length, limit: ALERT_LIMITS[profile.plan] })}</p>
          <p>{t("profile.watchlist", { count: watchlist.length, limit: WATCHLIST_LIMITS[profile.plan] })}</p>
          <p>{t("profile.created", { date: formatDay(profile.createdAt, locale) })}</p>
        </Card.Body>
      </Card>
    </div>
  );
}
