import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createT, localePath, type Locale } from "@/lib/i18n";

/**
 * Bloc final d'appel a l'action pour pousser vers l'inscription.
 */
export function CTA({ locale }: { locale: Locale }): JSX.Element {
  const t = createT(locale);

  return (
    <section className="container-shell px-4 py-16 sm:px-6 lg:px-8">
      <Card variant="gold" className="overflow-hidden bg-[#0A0A0A] text-white">
        <Card.Body className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
              {t("cta.eyebrow")}
            </p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{t("cta.title")}</h2>
            <p className="mt-4 text-sm leading-7 text-white/72">{t("cta.text")}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={localePath(locale, "/register")}>
              <Button size="lg">{t("cta.register")}</Button>
            </Link>
            <Link href={localePath(locale, "/login")}>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {t("cta.dashboard")}
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </section>
  );
}
