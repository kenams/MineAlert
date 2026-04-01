import Link from "next/link";
import { ArrowRight, BellRing, LineChart, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Hero principal de la landing MineAlert.
 */
export function Hero(): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(212,175,55,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(27,67,50,0.38),_transparent_42%)]" />
      <div className="container-shell relative grid gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
        <div className="space-y-7">
          <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm text-[#D4AF37]">
            Veille minière mondiale pour investisseurs
          </span>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Surveillez les marchés miniers mondiaux sans bruit inutile.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-white/72">
              Prix des métaux, actualités stratégiques, alertes intelligentes et vision mondiale des mines dans une seule interface.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register">
              <Button size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Commencer gratuitement
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                Voir le dashboard
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-white/65">
            <span>20+ minerais</span>
            <span>5 flux mondiaux</span>
            <span>Alertes temps réel</span>
          </div>
        </div>

        <Card variant="gold" className="border-none bg-white/95 text-[#0A0A0A] shadow-[0_24px_72px_-24px_rgba(0,0,0,0.55)]">
          <Card.Header className="mb-5 flex-col items-start gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Aperçu du cockpit
            </p>
            <h2 className="text-2xl font-semibold">Signal clair, lecture rapide.</h2>
          </Card.Header>
          <Card.Body className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[BellRing, LineChart, ShieldCheck].map((Icon, index) => (
                <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Icon className="h-5 w-5 text-[#1B4332]" />
                  <p className="mt-3 text-sm font-medium text-[#0A0A0A]">
                    {index === 0 ? "Alertes" : index === 1 ? "Tendances" : "Risque"}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-[#F8F9FA] p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Or</p>
                  <p className="mt-2 text-2xl font-semibold">$1,954.30</p>
                  <p className="mt-2 text-sm text-emerald-700">+0.64% sur 24h</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-500">Cuivre</p>
                  <p className="mt-2 text-2xl font-semibold">$3.91</p>
                  <p className="mt-2 text-sm text-emerald-700">+2.09% sur 24h</p>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </section>
  );
}
