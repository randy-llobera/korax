import {
  getAvailableCollections,
  getRecentDashboardCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import {
  getDashboardStats,
  getPinnedDashboardItems,
  getRecentDashboardItems,
  getSidebarItemTypes,
} from "@/lib/db/items";

import { DashboardCollections } from "@/components/dashboard/dashboard-collections";
import { DashboardPinnedItems } from "@/components/dashboard/dashboard-pinned-items";
import { DashboardRecentItems } from "@/components/dashboard/dashboard-recent-items";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { AppPageShell } from "@/components/layout/app-page-shell";

const DashboardPage = async () => {
  const [
    user,
    stats,
    itemTypes,
    sidebarCollections,
    collections,
    recentCollections,
    pinnedItems,
    recentItems,
  ] = await Promise.all([
    getDashboardUser(),
    getDashboardStats(),
    getSidebarItemTypes(),
    getSidebarCollectionsData(),
    getAvailableCollections(),
    getRecentDashboardCollections(),
    getPinnedDashboardItems(),
    getRecentDashboardItems(),
  ]);

  return (
    <DashboardShell
      user={user}
      collections={collections}
      itemTypes={itemTypes}
      favoriteCollections={sidebarCollections.favoriteCollections}
      recentCollections={sidebarCollections.recentCollections}
    >
      <AppPageShell className="gap-8">
        <AppPageHeader
          title="Dashboard"
          description="Your developer knowledge hub"
        />
        <DashboardStats data={stats} />
        <DashboardCollections collections={recentCollections} />
        <div className="space-y-10">
          <DashboardPinnedItems items={pinnedItems} />
          <DashboardRecentItems items={recentItems} />
        </div>
      </AppPageShell>
    </DashboardShell>
  );
};

export default DashboardPage;
