import { BellRing, Globe2, Layers3 } from "lucide-react";

import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    title: "Dépôts SEC en français",
    description:
      "Résultats, financements, accords, changements de dirigeants : les dépôts officiels de 41 sociétés minières, classés et résumés en français, avec le lien vers la source.",
    icon: Globe2,
  },
  {
    title: "Alertes qui arrivent vraiment",
    description:
      "Seuil de prix, variation sur 24 h ou mot-clé dans une actualité ou un dépôt SEC : vérifiées toutes les 10 minutes, envoyées par e-mail.",
    icon: BellRing,
  },
  {
    title: "Risque pays",
    description:
      "Stabilité politique, État de droit et efficacité de l'État dans 40 pays miniers (Banque mondiale), pour situer le risque derrière un projet.",
    icon: Layers3,
  },
];

/**
 * Présente les capacités principales de MineAlert sur la landing.
 */
export function Features(): JSX.Element {
  return (
    <section className="container-shell px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1B4332]">
          Fonctionnalités
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[#0A0A0A] sm:text-4xl">
          Une plateforme de veille pensée pour la vitesse d’analyse.
        </h2>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {FEATURES.map((feature) => (
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
