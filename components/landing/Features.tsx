import { BellRing, Globe2, Layers3 } from "lucide-react";

import { Card } from "@/components/ui/Card";

const FEATURES = [
  {
    title: "Veille mondiale",
    description:
      "Agrégation de flux miniers, métaux et commodities pour détecter les signaux utiles plus vite.",
    icon: Globe2,
  },
  {
    title: "Alertes ciblées",
    description:
      "Seuils de prix, variations, événements et signaux clés pour ne suivre que ce qui compte.",
    icon: BellRing,
  },
  {
    title: "Vue de synthèse",
    description:
      "Dashboard clair avec watchlist, graphiques, carte mondiale des mines et actualités filtrées.",
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
