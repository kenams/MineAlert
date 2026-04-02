import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Bloc final d'appel a l'action pour pousser vers l'inscription.
 */
export function CTA(): JSX.Element {
  return (
    <section className="container-shell px-4 py-16 sm:px-6 lg:px-8">
      <Card variant="gold" className="overflow-hidden bg-[#0A0A0A] text-white">
        <Card.Body className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
              Commencer maintenant
            </p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Passez de la veille artisanale a une lecture structuree du secteur minier.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Centralisez vos prix, actualites et alertes dans une interface unique, lisible et exploitable.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg">Creer un compte</Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Acceder au dashboard
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </section>
  );
}
