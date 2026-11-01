import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { isLocale } from "@/lib/i18n";
import { publicMetadata } from "@/lib/i18n/seo";

type LoginPageProps = {
  params: { locale: string };
  searchParams?: {
    error?: string;
    redirectTo?: string;
    registered?: string;
  };
};

export function generateMetadata({ params }: Pick<LoginPageProps, "params">): Metadata {
  return isLocale(params.locale) ? publicMetadata(params.locale, "/login", "meta.loginTitle") : {};
}

/**
 * Page serveur de connexion, qui transmet les query params au formulaire client.
 */
export default function LoginPage({
  params,
  searchParams,
}: LoginPageProps): JSX.Element {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return (
    <LoginForm
      callbackError={searchParams?.error}
      redirectTo={searchParams?.redirectTo}
      registered={searchParams?.registered}
    />
  );
}
