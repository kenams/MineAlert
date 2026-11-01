import Link from "next/link";

import { createT, localePath, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

export type FooterProps = {
  locale: Locale;
  className?: string;
};

/**
 * Footer sobre et réutilisable pour les pages publiques de MineAlert.
 */
export function Footer({ locale, className }: FooterProps): JSX.Element {
  const t = createT(locale);
  const currentYear = new Date().getFullYear();
  const links = [
    { href: "/legal", label: t("footer.legal") },
    { href: "/privacy", label: t("footer.privacy") },
    { href: "/terms", label: t("footer.terms") },
    { href: "/contact", label: t("footer.contact") },
  ];

  return (
    <footer
      className={cn(
        "border-t border-[#1B4332]/10 bg-white",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-2">
          <Link href={localePath(locale, "/")} className="text-lg font-semibold tracking-wide text-[#1B4332]">
            <span className="text-[#D4AF37]">Mine</span>Alert
          </Link>
          <p className="max-w-md text-sm text-slate-600">{t("footer.tagline")}</p>        </div>

        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {links.map((link) => (
            <Link
              key={link.href}
              href={localePath(locale, link.href)}
              className="transition hover:text-[#1B4332]"
            >
              {link.label}
            </Link>
          ))}
          <span className="text-slate-400">© {currentYear}</span>
        </div>
      </div>
    </footer>
  );
}
