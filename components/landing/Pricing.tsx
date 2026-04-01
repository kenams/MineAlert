import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const PLANS = [
  {
    name: "Gratuit",
    price: "0€",
    description: "Découvrir MineAlert sans friction.",
    features: ["5 alertes", "10 minerais suivis", "Veille mondiale"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "9,99€/mois",
    description: "Pour les investisseurs qui veulent aller plus vite.",
    features: ["50 alertes", "100 minerais", "Exports et historique enrichi"],
    highlight: true,
  },
  {
    name: "Business",
    price: "49€/mois",
    description: "Pour les équipes, desks matières premières et analystes.",
    features: ["500 alertes", "API access", "Multi-utilisateurs et rapport PDF"],
    highlight: false,
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

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
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
