"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { localePath } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/provider";
import { createClient as createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAppUrl, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Formulaire d'inscription avec vrai flux Supabase, et fallback demo uniquement sans config.
 */
export function RegisterForm(): JSX.Element {
  const router = useRouter();
  const locale = useLocale();
  const t = useT();
  const supabaseEnabled = isSupabaseConfigured();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(
    supabaseEnabled ? null : t("register.demoNotice")
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
      setError(t("register.termsRequired"));
      setLoading(false);
      return;
    }

    try {
      if (!supabaseEnabled) {
        localStorage.setItem(
          "minealert-demo-user",
          JSON.stringify({ email, fullName })
        );
        setInfo(t("register.demoCreated"));
        router.push(localePath(locale, "/dashboard"));
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const callbackUrl = new URL(getAppUrl("/auth/callback"));

      if (locale !== "fr") {
        callbackUrl.searchParams.set("next", localePath(locale, "/dashboard"));
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          data: {
            full_name: fullName,
            locale,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        router.push(localePath(locale, "/dashboard"));
        router.refresh();
        return;
      }

      router.push(`${localePath(locale, "/login")}?registered=1`);
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : t("register.createFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#F8F9FA]">
      <div className="absolute right-4 top-4 z-10 sm:right-6 lg:right-8">
        <LanguageSwitcher />
      </div>
      <div className="container-shell grid min-h-screen items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-[#1B4332]/15 bg-[#1B4332]/6 px-4 py-1 text-sm text-[#1B4332]">
            {t("register.badge")}
          </span>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-[#0A0A0A]">
              {t("register.title")}
            </h1>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              {t("register.subtitle")}
            </p>
          </div>
        </div>

        <Card variant="elevated">
          <Card.Header className="mb-5 flex-col items-start gap-2">
            <h2 className="text-2xl font-semibold text-[#0A0A0A]">{t("register.cardTitle")}</h2>
            <p className="text-sm text-slate-500">{t("register.cardSubtitle")}</p>
          </Card.Header>

          <Card.Body>
            {supabaseEnabled ? (
              <div className="mb-4 space-y-4">
                <GoogleAuthButton
                  label={t("auth.googleSignup")}
                  redirectTo="/dashboard"
                  disabled={!hydrated}
                />
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span>{t("auth.or")}</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              {info ? <Alert variant="info">{info}</Alert> : null}
              {error ? <Alert variant="error">{error}</Alert> : null}

              <Input
                label={t("register.fullName")}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={t("register.fullNamePlaceholder")}
                autoComplete="name"
                required
              />
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
                placeholder={t("register.passwordPlaceholder")}
                autoComplete="new-password"
                minLength={6}
                hint={t("register.passwordHint")}
                required
              />

              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1B4332]"
                />
                <span>{t("register.terms")}</span>
              </label>

              <Button type="submit" loading={loading} disabled={!hydrated} fullWidth>
                {t("register.submit")}
              </Button>
            </form>
          </Card.Body>

          <Card.Footer className="justify-start">
            <p className="text-sm text-slate-600">
              {t("register.haveAccount")}{" "}
              <Link href={localePath(locale, "/login")} className="font-medium text-[#1B4332]">
                {t("register.signIn")}
              </Link>
            </p>
          </Card.Footer>
        </Card>
      </div>
    </main>
  );
}
