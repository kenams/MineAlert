import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const PLANS = [
  {
    name: "Gratuit",
    price: "0€",
    description: "Pour suivre le marché et tester les alertes.",
    features: [
      "5 alertes (prix, variation 24 h, mot-clé)",
      "Dépôts SEC de 41 sociétés minières en français",
      "Fiche risque pays (40 pays)",
      "Cours en direct : or, argent, platine, cuivre",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "9,99€/mois",
    description: "Pour ne rien manquer sans surveiller l'écran.",
    features: [
      "Tout le plan Gratuit",
      "50 alertes",
      "Résumé quotidien par e-mail en français",
      "Cours, dépôts marquants et actualités à 7 h",
    ],
    highlight: true,
  },
];

/**
 * Affiche les trois plans commerciaux de MineAlert.
 */
export function Pricing(): JSX.Element {
  return (
    <section className="container-shell px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#1B4332]">
          Tarification
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[#0A0A0A] sm:text-4xl">
          Des plans lisibles, sans surprise.
        </h2>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-5 lg:grid-cols-2">
        {PLANS.map((plan) => (
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
              <Link href="/register" className="w-full">
                <Button variant={plan.highlight ? "secondary" : "primary"} fullWidth>
                  Choisir {plan.name}
                </Button>
              </Link>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </section>
  );
}
