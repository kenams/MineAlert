import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { LOCALES, createT, isLocale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/provider";
import { publicAlternates, siteBaseUrl } from "@/lib/i18n/seo";
import { APP_NAME } from "@/lib/utils/constants";

import "../globals.css";

type LayoutProps = {
  children: ReactNode;
  params: { locale: string };
};

export const dynamicParams = false;

export function generateStaticParams(): Array<{ locale: string }> {
  return LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) {
    return {};
  }

  const t = createT(params.locale);

  return {
    metadataBase: new URL(siteBaseUrl()),
    title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
    description: t("meta.description"),
    // Canonical et hreflang de la page d'accueil ; les autres pages publiques les redéfinissent.
    alternates: publicAlternates(params.locale, "/"),
  };
}

export default function LocaleLayout({ children, params }: Readonly<LayoutProps>) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return (
    <html lang={params.locale} className="h-full antialiased">
      <body className="min-h-full bg-[#F8F9FA] text-[#0A0A0A]">
        <LocaleProvider locale={params.locale}>
          <QueryProvider>{children}</QueryProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
