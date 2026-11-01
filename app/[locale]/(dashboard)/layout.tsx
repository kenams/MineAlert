import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { isLocale, localePath } from "@/lib/i18n";
import { UnauthorizedError } from "@/lib/server/auth";
import { getCurrentUserProfile, syncUserLocale } from "@/lib/server/data";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {},
};

/**
 * Layout serveur du dashboard, branché sur le profil utilisateur courant.
 */
export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}): Promise<JSX.Element> {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const { locale } = params;

  try {
    const userProfile = await syncUserLocale(await getCurrentUserProfile(), locale);

    return <DashboardShell userProfile={userProfile}>{children}</DashboardShell>;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect(localePath(locale, "/login"));
    }

    throw error;
  }
}
