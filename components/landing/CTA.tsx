import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Bloc final d'appel à l'action pour pousser vers l'inscription.
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
              Passez de la veille artisanale à une lecture structurée du secteur minier.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/72">
              Testez MineAlert en mode démo ou branchez Supabase pour une version pleinement connectée.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg">Créer un compte</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                Accéder au dashboard
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </section>
  );
}
