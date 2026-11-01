import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/layout/Footer";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { isLocale, localePath, type Locale } from "@/lib/i18n";
import { publicAlternates } from "@/lib/i18n/seo";
import { LEGAL_CONTENT, type LegalKey } from "@/lib/legal/content";

const PATHS: Record<LegalKey, string> = {
  legal: "/legal",
  privacy: "/privacy",
  terms: "/terms",
  contact: "/contact",
};

export type LegalPageProps = { params: { locale: string } };

/**
 * Métadonnées d'une page juridique : titre localisé, canonical et hreflang.
 */
export function legalMetadata(key: LegalKey, locale: string): Metadata {
  if (!isLocale(locale)) {
    return {};
  }

  const page = LEGAL_CONTENT[key][locale];

  return {
    title: `${page.title} · MineAlert`,
    alternates: publicAlternates(locale, PATHS[key]),
    robots: { index: true, follow: true },
  };
}

/**
 * Page juridique ou de contact, rendue depuis lib/legal/content.ts dans la langue demandée.
 */
export function LegalPageView({ pageKey, locale }: { pageKey: LegalKey; locale: string }): JSX.Element {
  if (!isLocale(locale)) {
    notFound();
  }

  const lang: Locale = locale;
  const page = LEGAL_CONTENT[pageKey][lang];
  const updatedLabel = lang === "en" ? "Last updated" : "Dernière mise à jour";
  const updated = new Date(`${page.updated}T00:00:00Z`).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="border-b border-[#1B4332]/10 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={localePath(lang, "/")} className="text-lg font-semibold tracking-wide text-[#1B4332]">
            <span className="text-[#D4AF37]">Mine</span>Alert
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold text-[#0A0A0A]">{page.title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {updatedLabel} : {updated}
        </p>

        <div className="mt-8 space-y-8">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-[#1B4332]">{section.heading}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer locale={lang} />
    </div>
  );
}
