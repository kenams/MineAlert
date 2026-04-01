"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAlerts } from "@/hooks/useAlerts";
import { usePrices } from "@/hooks/usePrices";
import { useSystemStatus } from "@/hooks/useSystemStatus";
import { formatDataFreshnessLabel, timeAgo } from "@/lib/utils/formatters";
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
  const { alerts } = useAlerts();
  const { status } = useSystemStatus();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const fallbackLastUpdated = useMemo(() => {
    const latestTimestamp = prices.reduce<number>((latest, mineral) => {
      const timestamp = Date.parse(mineral.lastUpdated);
      return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
    }, 0);

    if (!latestTimestamp) {
      return undefined;
    }

    return timeAgo(new Date(latestTimestamp).toISOString());
  }, [prices]);

  const lastUpdated = useMemo(() => {
    if (status) {
      return formatDataFreshnessLabel(
        status.latestDataAgeMs,
        status.freshnessStatus
      );
    }

    return fallbackLastUpdated;
  }, [fallbackLastUpdated, status]);

  const lastUpdatedState = status?.freshnessStatus ?? "fresh";
  const notificationCount = useMemo(
    () => alerts.filter((alert) => Boolean(alert.triggeredAt)).length,
    [alerts]
  );

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
            lastUpdatedState={lastUpdatedState}
            notificationCount={notificationCount}
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
