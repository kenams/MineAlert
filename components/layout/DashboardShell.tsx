"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { usePrices } from "@/hooks/usePrices";
import type { UserProfile } from "@/types";

type DashboardShellProps = {
  children: ReactNode;
  userProfile: UserProfile;
};

/**
 * Coquille cliente du dashboard, alimentée par le profil serveur authentifié.
 */
export function DashboardShell({
  children,
  userProfile,
}: DashboardShellProps): JSX.Element {
  const pathname = usePathname();
  const { prices } = usePrices();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const lastUpdated = useMemo(() => {
    const latestTimestamp = prices.reduce<number>((latest, mineral) => {
      const timestamp = Date.parse(mineral.lastUpdated);
      return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
    }, 0);

    if (!latestTimestamp) {
      return undefined;
    }

    return new Date(latestTimestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [prices]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="flex min-h-screen">
        <Sidebar
          currentPath={pathname}
          userPlan={userProfile.plan}
          userName={userProfile.fullName}
          userEmail={userProfile.email}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((current) => !current)}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header
            currentPath={pathname}
            lastUpdated={lastUpdated}
            notificationCount={2}
            userName={userProfile.fullName}
            onMenuClick={() => setMobileNavOpen(true)}
          />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>

      <MobileNav
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        currentPath={pathname}
        userPlan={userProfile.plan}
        userName={userProfile.fullName}
      />
    </div>
  );
}
