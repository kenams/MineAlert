"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAppUrl, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Page d'inscription avec vrai flux Supabase, et fallback demo uniquement sans config.
 */
export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const supabaseEnabled = isSupabaseConfigured();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    supabaseEnabled
      ? null
      : "Sans configuration Supabase, l'inscription bascule proprement en mode demo."
  );
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions d'utilisation.");
      setLoading(false);
      return;
    }

    try {
      if (!supabaseEnabled) {
        localStorage.setItem(
          "minealert-demo-user",
          JSON.stringify({ email, fullName })
        );
        setInfo("Compte demo cree avec succes.");
        router.push("/dashboard");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAppUrl("/auth/callback"),
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      router.push("/login?registered=1");
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Impossible de creer le compte pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <div className="container-shell grid min-h-screen items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-[#1B4332]/15 bg-[#1B4332]/6 px-4 py-1 text-sm text-[#1B4332]">
            Inscription MineAlert
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-[#0A0A0A]">
              Creez votre cockpit de veille matieres premieres.
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              Commencez en version gratuite, puis montez en puissance avec les alertes et exports avances.
            </p>
          </div>
        </div>

        <Card variant="elevated">
          <Card.Header className="mb-5 flex-col items-start gap-2">
            <h2 className="text-2xl font-semibold text-[#0A0A0A]">Creer un compte</h2>
            <p className="text-sm text-slate-500">
              Creez votre espace MineAlert pour synchroniser vos alertes et listes de suivi.
            </p>
          </Card.Header>

          <Card.Body>
            {supabaseEnabled ? (
              <div className="mb-4 space-y-4">
                <GoogleAuthButton
                  label="S'inscrire avec Google"
                  redirectTo="/dashboard"
                  disabled={!hydrated}
                />
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>ou</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {info ? <Alert variant="info">{info}</Alert> : null}
              {error ? <Alert variant="error">{error}</Alert> : null}

              <Input
                label="Nom complet"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Votre nom ou celui de votre societe"
                autoComplete="name"
                required
              />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@entreprise.com"
                autoComplete="email"
                required
              />
              <Input
                label="Mot de passe"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Au moins 6 caracteres"
                autoComplete="new-password"
                minLength={6}
                hint="Utilisez un mot de passe que vous pourrez retenir facilement."
                required
              />

              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1B4332]"
                />
                <span>J'accepte les conditions d'utilisation et la politique de confidentialite.</span>
              </label>

              <Button type="submit" loading={loading} disabled={!hydrated} fullWidth>
                Creer mon compte
              </Button>
            </form>
          </Card.Body>

          <Card.Footer className="justify-start">
            <p className="text-sm text-slate-600">
              Deja inscrit ?{" "}
              <Link href="/login" className="font-medium text-[#1B4332]">
                Se connecter
              </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </main>
  );
}
