"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type LoginFormProps = {
  callbackError?: string;
  redirectTo?: string;
  registered?: string;
};

/**
 * Formulaire de connexion client, alimenté par les query params de la page serveur.
 */
export function LoginForm({
  callbackError,
  redirectTo,
  registered,
}: LoginFormProps): JSX.Element {
  const router = useRouter();
  const supabaseEnabled = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    supabaseEnabled
      ? null
      : "Mode demo disponible si Supabase n'est pas configure."
  );
  const [loading, setLoading] = useState(false);

  const safeRedirectTo = useMemo(
    () => (redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard"),
    [redirectTo]
  );

  const calloutMessage = useMemo(() => {
    if (callbackError === "auth_callback_failed") {
      return "Le lien de confirmation est invalide ou expire. Reconnectez-vous pour continuer.";
    }

    if (registered === "1") {
      return "Compte cree. Verifiez votre email puis revenez vous connecter.";
    }

    return info;
  }, [callbackError, info, registered]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!supabaseEnabled) {
        if (email.trim() && password.trim().length >= 4) {
          localStorage.setItem(
            "minealert-demo-user",
            JSON.stringify({ email, fullName: "Investisseur Demo" })
          );
          setInfo("Connexion effectuee en mode demo.");
          router.push("/dashboard");
          return;
        }

        throw new Error("Impossible de se connecter. Verifiez vos identifiants.");
      }

      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      router.push(safeRedirectTo);
      router.refresh();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Impossible de se connecter. Verifiez vos identifiants."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="container-shell grid min-h-screen items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm text-[#D4AF37]">
            Connexion MineAlert
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight">
              Reprenez la main sur votre veille miniere.
            </h1>
            <p className="max-w-xl text-base leading-8 text-white/72">
              Connectez-vous pour retrouver votre watchlist, vos alertes et votre lecture mondiale des metaux.
            </p>
          </div>
        </div>

        <Card variant="gold" className="border-none bg-white text-[#0A0A0A]">
          <Card.Header className="mb-5 flex-col items-start gap-2">
            <h2 className="text-2xl font-semibold">Connexion</h2>
            <p className="text-sm text-slate-500">
              Utilisez votre compte MineAlert pour retrouver vos alertes et votre watchlist.
            </p>
          </Card.Header>

          <Card.Body>
            {supabaseEnabled ? (
              <div className="mb-4 space-y-4">
                <GoogleAuthButton redirectTo={safeRedirectTo} />
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>ou</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {calloutMessage ? <Alert variant="info">{calloutMessage}</Alert> : null}
              {error ? <Alert variant="error">{error}</Alert> : null}

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
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                required
              />

              <Button type="submit" loading={loading} fullWidth>
                Se connecter
              </Button>
            </form>
          </Card.Body>

          <Card.Footer className="justify-start">
            <p className="text-sm text-slate-600">
              Pas encore de compte ?{" "}
              <Link href="/register" className="font-medium text-[#1B4332]">
                Creer un compte
              </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </main>
  );
}
