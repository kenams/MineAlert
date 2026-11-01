import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CTA } from "@/components/landing/CTA";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/layout/Footer";
import { isLocale } from "@/lib/i18n";
import { publicMetadata } from "@/lib/i18n/seo";

export const revalidate = 900;

type HomeProps = { params: { locale: string } };

export function generateMetadata({ params }: HomeProps): Metadata {
  return isLocale(params.locale) ? publicMetadata(params.locale, "/") : {};
}

/**
 * Landing publique MineAlert.
 */
export default function Home({ params }: HomeProps): JSX.Element {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const { locale } = params;

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      <Hero locale={locale} />
      <Features locale={locale} />
      <Pricing locale={locale} />
      <CTA locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}
