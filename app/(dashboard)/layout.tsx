import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/DashboardShell";
import { UnauthorizedError } from "@/lib/server/auth";
import { getCurrentUserProfile } from "@/lib/server/data";

/**
 * Layout serveur du dashboard, branché sur le profil utilisateur courant.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  try {
    const userProfile = await getCurrentUserProfile();

    return <DashboardShell userProfile={userProfile}>{children}</DashboardShell>;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }

    throw error;
  }
}
