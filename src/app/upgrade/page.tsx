import { redirect } from "next/navigation";

import {
  getAvailableCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import { getSidebarItemTypes } from "@/lib/db/items";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { UpgradePage } from "@/components/settings/upgrade-page";

const UpgradeRoutePage = async () => {
  const [user, itemTypes, sidebarCollections, collections] = await Promise.all([
    getDashboardUser(),
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
          title="Upgrade"
          description="Compare Free and Pro, choose monthly or yearly billing, then continue to Stripe checkout."
        />
        <UpgradePage
          isPro={user.isPro}
          stripeCustomerId={user.stripeCustomerId}
          showHeader={false}
        />
      </AppPageShell>
    </DashboardShell>
  );
};

export default UpgradeRoutePage;
