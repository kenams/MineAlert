"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { localePath, safeInternalPath } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type LoginFormProps = {
  callbackError?: string;
  redirectTo?: string;
  registered?: string;
};

/**
 * Formulaire de connexion client, alimente par les query params de la page serveur.
 */
export function LoginForm({
  callbackError,
  redirectTo,
  registered,
}: LoginFormProps): JSX.Element {
  const router = useRouter();
  const locale = useLocale();
  const t = useT();
  const supabaseEnabled = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    supabaseEnabled ? null : t("login.localMode")
  );
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const safeRedirectTo = useMemo(
    () => localePath(locale, safeInternalPath(redirectTo, "/dashboard")),
    [locale, redirectTo]
  );

  const calloutMessage = useMemo(() => {
    if (callbackError === "auth_callback_failed") {
      return t("login.callbackFailed");
    }

    if (registered === "1") {
      return t("login.registered");
    }

    return info;
  }, [callbackError, info, registered, t]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!supabaseEnabled) {
        if (email.trim() && password.trim().length >= 4) {
          localStorage.setItem(
            "minealert-demo-user",
            JSON.stringify({ email, fullName: t("login.localUser") })
          );
          setInfo(t("login.localSuccess"));
          router.push(localePath(locale, "/dashboard"));
          return;
        }

        throw new Error(t("login.invalid"));
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
          : t("login.invalid")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#0A0A0A] text-white">
      <div className="absolute right-4 top-4 z-10 sm:right-6 lg:right-8">
        <LanguageSwitcher tone="dark" />
      </div>
      <div className="container-shell grid min-h-screen items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-sm text-[#D4AF37]">
            {t("login.badge")}
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight">{t("login.title")}</h1>
            <p className="max-w-xl text-base leading-8 text-white/72">{t("login.subtitle")}</p>
          </div>
        </div>

        <Card variant="gold" className="border-none bg-white text-[#0A0A0A]">
          <Card.Header className="mb-5 flex-col items-start gap-2">
            <h2 className="text-2xl font-semibold">{t("login.cardTitle")}</h2>
            <p className="text-sm text-slate-500">{t("login.cardSubtitle")}</p>
          </Card.Header>

          <Card.Body>
            {supabaseEnabled ? (
              <div className="mb-4 space-y-4">
                <GoogleAuthButton redirectTo={safeRedirectTo} disabled={!hydrated} />
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>{t("auth.or")}</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {calloutMessage ? <Alert variant="info">{calloutMessage}</Alert> : null}
              {error ? <Alert variant="error">{error}</Alert> : null}

              <Input
                label={t("auth.email")}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                required
              />
              <Input
                label={t("auth.password")}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                autoComplete="current-password"
                required
              />

              <Button type="submit" loading={loading} disabled={!hydrated} fullWidth>
                {t("login.submit")}
              </Button>
            </form>
          </Card.Body>

          <Card.Footer className="justify-start">
            <p className="text-sm text-slate-600">
              {t("login.noAccount")}{" "}
              <Link href={localePath(locale, "/register")} className="font-medium text-[#1B4332]">
                {t("login.createAccount")}
              </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </main>
  );
}
