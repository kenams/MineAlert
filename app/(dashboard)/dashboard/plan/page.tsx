import { Card } from "@/components/ui/Card";
import { getCurrentUserProfile } from "@/lib/server/data";
import { formatPlanName } from "@/lib/utils/formatters";

const PRO_MONTHLY = "https://buy.stripe.com/4gMcN5fFr8oafI5e4W1oI03";
const PRO_ANNUAL = "https://buy.stripe.com/7sYfZh1OB1ZM8fD4um1oI04";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function checkoutUrl(base: string, userId: string, email: string): string {
  const params = new URLSearchParams({ client_reference_id: userId, prefilled_email: email });
  return `${base}?${params.toString()}`;
}

type PageProps = { searchParams?: { paiement?: string } };

/**
 * Page plan : plan courant, passage au plan Pro (paiement Stripe) et information de résiliation.
 */
export default async function PlanPage({ searchParams }: PageProps): Promise<JSX.Element> {
  const profile = await getCurrentUserProfile();
  const canCheckout = UUID_PATTERN.test(profile.id);
  const isPro = profile.plan === "pro";

  return (
    <div className="space-y-6">
      {searchParams?.paiement === "ok" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Merci ! Votre paiement est enregistré. Le plan Pro s&apos;active en quelques secondes : actualisez la page si besoin.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="elevated">
          <Card.Header>
            <div>
              <p className="text-sm font-medium text-slate-500">Plan</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">{formatPlanName("free")}</h2>
            </div>
          </Card.Header>
          <Card.Body className="space-y-4">
            <p className="text-3xl font-semibold text-[#0A0A0A]">0 €</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>- 5 alertes (prix, variation 24 h, mot-clé)</li>
              <li>- Dépôts SEC de 41 sociétés minières en français</li>
              <li>- Fiche risque pays (40 pays)</li>
            </ul>
          </Card.Body>
          <Card.Footer>
            <p className="text-sm text-slate-500">{profile.plan === "free" ? "Votre plan actuel" : "Inclus dans Pro"}</p>
          </Card.Footer>
        </Card>

        <Card variant="gold">
          <Card.Header>
            <div>
              <p className="text-sm font-medium text-slate-500">Plan</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">{formatPlanName("pro")}</h2>
            </div>
          </Card.Header>
          <Card.Body className="space-y-4">
            <p className="text-3xl font-semibold text-[#0A0A0A]">
              9,99 €<span className="text-base font-normal text-slate-500"> / mois</span>
            </p>
            <p className="text-sm text-slate-600">ou 99 € par an (2 mois offerts). TVA non applicable, art. 293 B du CGI.</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>- Tout le plan Gratuit</li>
              <li>- 50 alertes</li>
              <li>- Résumé quotidien par e-mail en français</li>
            </ul>
          </Card.Body>
          <Card.Footer>
            {isPro ? (
              <div className="w-full space-y-2 text-sm text-slate-600">
                <p className="font-medium text-emerald-700">Plan Pro actif.</p>
                <p>
                  Pour résilier ou changer de carte, écrivez à{" "}
                  <a className="underline" href="mailto:kahdigital42@gmail.com?subject=MineAlert%20Pro">
                    kahdigital42@gmail.com
                  </a>
                  . La résiliation prend effet immédiatement.
                </p>
              </div>
            ) : canCheckout ? (
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <a
                  href={checkoutUrl(PRO_MONTHLY, profile.id, profile.email)}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#D4AF37] px-5 text-sm font-semibold text-[#0A0A0A] hover:brightness-95"
                >
                  Passer à Pro · 9,99 €/mois
                </a>
                <a
                  href={checkoutUrl(PRO_ANNUAL, profile.id, profile.email)}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-medium text-[#0A0A0A] hover:bg-white"
                >
                  99 €/an
                </a>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Connectez-vous avec un compte pour passer au plan Pro.</p>
            )}
          </Card.Footer>
        </Card>
      </div>

      <p className="text-xs text-slate-400">
        Paiement sécurisé par Stripe. Vous recevez un reçu par e-mail. Vous pouvez résilier à tout moment.
      </p>
    </div>
  );
}
