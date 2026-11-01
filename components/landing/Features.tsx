import { BellRing, Globe2, Layers3 } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { createT, type Locale } from "@/lib/i18n";

/**
 * Présente les capacités principales de MineAlert sur la landing.
 */
export function Features({ locale }: { locale: Locale }): JSX.Element {
  const t = createT(locale);
  const features = [
    { title: t("features.filings.title"), description: t("features.filings.text"), icon: Globe2 },
    { title: t("features.alerts.title"), description: t("features.alerts.text"), icon: BellRing },
    { title: t("features.risk.title"), description: t("features.risk.text"), icon: Layers3 },
  ];

  return (
    <section className="container-shell px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1B4332]">
          {t("features.eyebrow")}
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[#0A0A0A] sm:text-4xl">
          {t("features.title")}
        </h2>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} variant="elevated" className="h-full">
            <Card.Body>
              <div className="inline-flex rounded-2xl bg-[#1B4332]/8 p-3 text-[#1B4332]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#0A0A0A]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {feature.description}
              </p>
            </Card.Body>
          </Card>
        ))}
      </div>
    </section>
  );
}
