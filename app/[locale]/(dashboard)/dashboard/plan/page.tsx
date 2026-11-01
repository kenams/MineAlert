import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { createT, isLocale } from "@/lib/i18n";
import { getCurrentUserProfile } from "@/lib/server/data";
import { formatPlanName } from "@/lib/utils/formatters";

const PRO_MONTHLY = "https://buy.stripe.com/4gMcN5fFr8oafI5e4W1oI03";
const PRO_ANNUAL = "https://buy.stripe.com/7sYfZh1OB1ZM8fD4um1oI04";
const PORTAL_URL = "https://billing.stripe.com/p/login/eVq00jfFr0VI8fD8KC1oI00";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function checkoutUrl(base: string, userId: string, email: string): string {
  const params = new URLSearchParams({ client_reference_id: userId, prefilled_email: email });
  return `${base}?${params.toString()}`;
}

type PageProps = {
  params: { locale: string };
  searchParams?: { paiement?: string };
};

/**
 * Page plan : plan courant, passage au plan Pro (paiement Stripe) et information de résiliation.
 */
export default async function PlanPage({ params, searchParams }: PageProps): Promise<JSX.Element> {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const { locale } = params;
  const t = createT(locale);
  const profile = await getCurrentUserProfile();
  const canCheckout = UUID_PATTERN.test(profile.id);
  const isPro = profile.plan === "pro";

  return (
    <div className="space-y-6">
      {searchParams?.paiement === "ok" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {t("plan.paid")}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="elevated">
          <Card.Header>
            <div>
              <p className="text-sm font-medium text-slate-500">{t("plan.label")}</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">{formatPlanName("free", locale)}</h2>
            </div>
          </Card.Header>
          <Card.Body className="space-y-4">
            <p className="text-3xl font-semibold text-[#0A0A0A]">{t("plan.freePrice")}</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>{t("plan.freeF1")}</li>
              <li>{t("plan.freeF2")}</li>
              <li>{t("plan.freeF3")}</li>
            </ul>
          </Card.Body>
          <Card.Footer>
            <p className="text-sm text-slate-500">
              {profile.plan === "free" ? t("plan.current") : t("plan.includedInPro")}
            </p>
          </Card.Footer>
        </Card>

        <Card variant="gold">
          <Card.Header>
            <div>
              <p className="text-sm font-medium text-slate-500">{t("plan.label")}</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">{formatPlanName("pro", locale)}</h2>
            </div>
          </Card.Header>
          <Card.Body className="space-y-4">
            <p className="text-3xl font-semibold text-[#0A0A0A]">
              {t("plan.proPrice")}
              <span className="text-base font-normal text-slate-500">{t("plan.perMonth")}</span>
            </p>
            <p className="text-sm text-slate-600">{t("plan.proNote")}</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>{t("plan.proF1")}</li>
              <li>{t("plan.proF2")}</li>
              <li>{t("plan.proF3")}</li>
            </ul>
          </Card.Body>
          <Card.Footer>
            {isPro ? (
              <div className="w-full space-y-2 text-sm text-slate-600">
                <p className="font-medium text-emerald-700">{t("plan.proActive")}</p>
                <a
                  href={`${PORTAL_URL}?${new URLSearchParams({ prefilled_email: profile.email }).toString()}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 px-5 font-medium text-[#0A0A0A] hover:bg-white"
                >
                  {t("plan.manage")}
                </a>
                <p className="text-xs text-slate-500">{t("plan.manageNote")}</p>
              </div>
            ) : canCheckout ? (
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <a
                  href={checkoutUrl(PRO_MONTHLY, profile.id, profile.email)}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#D4AF37] px-5 text-sm font-semibold text-[#0A0A0A] hover:brightness-95"
                >
                  {t("plan.upgrade")}
                </a>
                <a
                  href={checkoutUrl(PRO_ANNUAL, profile.id, profile.email)}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-medium text-[#0A0A0A] hover:bg-white"
                >
                  {t("plan.yearly")}
                </a>
              </div>
            ) : (
              <p className="text-sm text-slate-500">{t("plan.needAccount")}</p>
            )}
          </Card.Footer>
        </Card>
      </div>

      <p className="text-xs text-slate-400">{t("plan.footer")}</p>
    </div>
  );
}
