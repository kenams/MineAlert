import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createT, localePath, type Locale } from "@/lib/i18n";

/**
 * Affiche les plans commerciaux de MineAlert.
 */
export function Pricing({ locale }: { locale: Locale }): JSX.Element {
  const t = createT(locale);
  const plans = [
    {
      name: t("plan.free"),
      price: t("pricing.free.price"),
      description: t("pricing.free.text"),
      features: [
        t("pricing.free.f1"),
        t("pricing.free.f2"),
        t("pricing.free.f3"),
        t("pricing.free.f4"),
      ],
      highlight: false,
    },
    {
      name: t("plan.pro"),
      price: t("pricing.pro.price"),
      description: t("pricing.pro.text"),
      features: [
        t("pricing.pro.f1"),
        t("pricing.pro.f2"),
        t("pricing.pro.f3"),
        t("pricing.pro.f4"),
      ],
      highlight: true,
    },
  ];

  return (
    <section className="container-shell px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1B4332]">
          {t("pricing.eyebrow")}
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[#0A0A0A] sm:text-4xl">
          {t("pricing.title")}
        </h2>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-5 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            variant={plan.highlight ? "gold" : "elevated"}
            className="h-full"
          >
            <Card.Body>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {plan.name}
              </p>
              <p className="mt-5 text-3xl font-semibold text-[#0A0A0A]">{plan.price}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </Card.Body>
            <Card.Footer>
              <Link href={localePath(locale, "/register")} className="w-full">
                <Button variant={plan.highlight ? "secondary" : "primary"} fullWidth>
                  {t("pricing.choose", { plan: plan.name })}
                </Button>
              </Link>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </section>
  );
}
