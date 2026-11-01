import Link from "next/link";

import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

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
export default async function AlertHistoryPage(): Promise<JSX.Element> {
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
        <h1 className="text-2xl font-semibold text-[#0A0A0A]">Historique des alertes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Les alertes sont vérifiées toutes les 10 minutes. L&apos;envoi par e-mail s&apos;affiche ci-dessous.
        </p>
        <Link href="/dashboard/alertes" className="mt-3 inline-block text-sm text-[#1B4332] underline">
          Retour à mes alertes
        </Link>
      </div>

      {events.length === 0 ? (
        <Alert variant="info" title="Aucune alerte déclenchée pour le moment.">
          Dès qu&apos;un seuil est franchi ou qu&apos;un mot-clé apparaît dans une actualité ou un dépôt SEC, il s&apos;affiche ici.
        </Alert>
      ) : (
        <div className="grid gap-3">
          {events.map((event) => (
            <Card key={event.id} variant="elevated">
              <Card.Body>
                <p className="text-xs text-slate-500">
                  {new Date(event.created_at).toLocaleString("fr-FR")} · {event.emailed ? "e-mail envoyé" : "non envoyé par e-mail"}
                </p>
                <p className="mt-1 text-sm font-medium text-[#0A0A0A]">{event.title}</p>
                {event.body ? <p className="mt-1 text-sm text-slate-600">{event.body}</p> : null}
                {event.url ? (
                  <Link
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-[#1B4332] underline"
                  >
                    Voir la source
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
