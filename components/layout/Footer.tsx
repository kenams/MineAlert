import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export type FooterProps = {
  className?: string;
};

/**
 * Footer sobre et réutilisable pour les pages publiques de MineAlert.
 */
export function Footer({ className }: FooterProps): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-[#1B4332]/10 bg-white",
        className
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-2">
          <Link href="/" className="text-lg font-semibold tracking-wide text-[#1B4332]">
            <span className="text-[#D4AF37]">Mine</span>Alert
          </Link>
          <p className="max-w-md text-sm text-slate-600">
            Veille minière mondiale, alertes sur les marchés des métaux et signaux utiles pour les investisseurs.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Link href="/mentions-legales" className="transition hover:text-[#1B4332]">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="transition hover:text-[#1B4332]">
            Confidentialité
          </Link>
          <Link href="/contact" className="transition hover:text-[#1B4332]">
            Contact
          </Link>
          <span className="text-slate-400">© {currentYear}</span>
        </div>
      </div>
    </footer>
  );
}

