import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getCurrentUserProfile } from "@/lib/server/data";
import { formatPlanName } from "@/lib/utils/formatters";

type PlanCard = {
  name: "free" | "pro" | "business";
  price: string;
  features: string[];
};

const PLAN_CARDS: PlanCard[] = [
  { name: "free", price: "0EUR/mois", features: ["5 alertes", "10 minerais suivis"] },
  { name: "pro", price: "9,99EUR/mois", features: ["50 alertes", "100 minerais", "Exports"] },
  {
    name: "business",
    price: "49EUR/mois",
    features: ["500 alertes", "API", "Multi-utilisateurs"],
  },
];

/**
 * Page plan avec mise en avant du plan courant.
 */
export default async function PlanPage(): Promise<JSX.Element> {
  const profile = await getCurrentUserProfile();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLAN_CARDS.map((plan) => {
        const isCurrentPlan = plan.name === profile.plan;

        return (
          <Card
            key={plan.name}
            variant={plan.name === "pro" ? "gold" : "elevated"}
          >
            <Card.Header>
              <div>
                <p className="text-sm font-medium text-slate-500">Plan</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">
                  {formatPlanName(plan.name)}
                </h2>
              </div>
            </Card.Header>
            <Card.Body className="space-y-4">
              <p className="text-3xl font-semibold text-[#0A0A0A]">{plan.price}</p>
              <ul className="space-y-2 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
            </Card.Body>
            <Card.Footer>
              {isCurrentPlan ? (
                <Button fullWidth disabled>
                  Plan actuel
                </Button>
              ) : (
                <Link href="/dashboard/parametres" className="w-full">
                  <Button
                    fullWidth
                    variant={plan.name === "pro" ? "secondary" : "outline"}
                  >
                    Choisir ce plan
                  </Button>
                </Link>
              )}
            </Card.Footer>
          </Card>
        );
      })}
    </div>
  );
}
