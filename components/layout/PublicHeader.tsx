import Link from "next/link";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { createT, localePath, type Locale } from "@/lib/i18n";

type PublicHeaderProps = {
  locale: Locale;
};

/**
 * Barre supérieure des pages publiques : logo, connexion et sélecteur de langue.
 */
export function PublicHeader({ locale }: PublicHeaderProps): JSX.Element {
  const t = createT(locale);

  return (
    <header className="container-shell relative flex items-center justify-between px-4 pt-6 sm:px-6 lg:px-8">
      <Link href={localePath(locale, "/")} className="text-lg font-semibold tracking-wide text-white">
        <span className="text-[#D4AF37]">Mine</span>Alert
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href={localePath(locale, "/login")}
          className="text-sm font-medium text-white/80 transition hover:text-white"
        >
          {t("landing.login")}
        </Link>
        <LanguageSwitcher tone="dark" />
      </div>
    </header>
  );
}
