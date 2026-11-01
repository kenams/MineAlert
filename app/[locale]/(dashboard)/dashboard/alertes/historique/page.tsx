import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { createT, isLocale, localePath } from "@/lib/i18n";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/formatters";
import { safeHref } from "@/lib/utils/safe-html";

export const dynamic = "force-dynamic";

type EventRow = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  emailed: boolean;
  created_at: string;
};

/**
 * Historique des alertes déclenchées pour l'utilisateur connecté.
 */
export default async function AlertHistoryPage({
  params,
}: {
  params: { locale: string };
}): Promise<JSX.Element> {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const { locale } = params;
  const t = createT(locale);
  let events: EventRow[] = [];

  if (isSupabaseConfigured()) {
    const user = await getAuthenticatedUser();

    if (user) {
      const { data } = await createClient()
        .from("alert_events")
        .select("id,title,body,url,emailed,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      events = (data ?? []) as EventRow[];
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-semibold text-[#0A0A0A]">{t("alertHistory.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("alertHistory.subtitle")}</p>
        <Link
          href={localePath(locale, "/dashboard/alertes")}
          className="mt-3 inline-block text-sm text-[#1B4332] underline"
        >
          {t("alertHistory.back")}
        </Link>
      </div>

      {events.length === 0 ? (
        <Alert variant="info" title={t("alertHistory.emptyTitle")}>
          {t("alertHistory.emptyText")}
        </Alert>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <Card key={event.id} variant="elevated">
              <Card.Body>
                <p className="text-xs text-slate-500">
                  {formatDateTime(event.created_at, locale)} ·{" "}
                  {event.emailed ? t("alertHistory.emailed") : t("alertHistory.notEmailed")}
                </p>
                <p className="mt-1 text-sm font-medium text-[#0A0A0A]">{event.title}</p>
                {event.body ? <p className="mt-1 text-sm text-slate-600">{event.body}</p> : null}
                {safeHref(event.url) ? (
                  <Link
                    href={safeHref(event.url) as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-[#1B4332] underline"
                  >
                    {t("alertHistory.source")}
                  </Link>
                ) : null}
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
