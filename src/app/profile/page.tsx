import { redirect } from "next/navigation";

import {
  getAvailableCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import { getDashboardStats, getSidebarItemTypes } from "@/lib/db/items";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { ProfileInfo } from "@/components/profile/profile-info";
import { ProfileStats } from "@/components/profile/profile-stats";

const ProfilePage = async () => {
  const [user, stats, itemTypes, sidebarCollections, collections] =
    await Promise.all([
      getDashboardUser(),
      getDashboardStats(),
      getSidebarItemTypes(),
      getSidebarCollectionsData(),
      getAvailableCollections(),
    ]);

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <DashboardShell
      user={user}
      collections={collections}
      itemTypes={itemTypes}
      favoriteCollections={sidebarCollections.favoriteCollections}
      recentCollections={sidebarCollections.recentCollections}
    >
      <AppPageShell>
        <AppPageHeader
          title="Profile"
          description="View your account details and usage."
        />
        <ProfileInfo user={user} />
        <ProfileStats itemTypes={itemTypes} stats={stats} />
      </AppPageShell>
    </DashboardShell>
  );
};

export default ProfilePage;
