import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { isLocale } from "@/lib/i18n";
import { publicMetadata } from "@/lib/i18n/seo";

type RegisterPageProps = { params: { locale: string } };

export function generateMetadata({ params }: RegisterPageProps): Metadata {
  return isLocale(params.locale) ? publicMetadata(params.locale, "/register", "meta.registerTitle") : {};
}

/**
 * Page d'inscription.
 */
export default function RegisterPage({ params }: RegisterPageProps): JSX.Element {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <RegisterForm />;
}
