import { Card } from "@/components/ui/Card";

/**
 * Page paramètres placeholder propre, utile pour préserver la cohérence de navigation.
 */
export default function SettingsPage(): JSX.Element {
  return (
    <Card variant="elevated">
      <Card.Header>
        <div>
          <p className="text-sm font-medium text-slate-500">Paramètres</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#0A0A0A]">
            Préférences du compte
          </h1>
        </div>
      </Card.Header>
      <Card.Body className="space-y-4 text-sm text-slate-600">
        <p>Cette zone accueillera les préférences de notification, devise et personnalisation.</p>
        <p>En attendant, l'application reste pleinement utilisable en mode démo.</p>
      </Card.Body>
    </Card>
  );
}
