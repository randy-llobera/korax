import Link from "next/link";

import {
  getAllDashboardCollections,
  getAvailableCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import { getSidebarItemTypes } from "@/lib/db/items";

import { DashboardCollectionCard } from "@/components/dashboard/dashboard-collection-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { AppPageShell } from "@/components/layout/app-page-shell";
import { Button } from "@/components/ui/button";

const CollectionsPage = async () => {
  const [user, itemTypes, sidebarCollections, collections, allCollections] =
    await Promise.all([
      getDashboardUser(),
      getSidebarItemTypes(),
      getSidebarCollectionsData(),
      getAvailableCollections(),
      getAllDashboardCollections(),
    ]);

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
          title="Collections"
          description={`${allCollections.length} ${allCollections.length === 1 ? "collection" : "collections"}`}
        />
        {allCollections.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {allCollections.map((collection) => (
              <DashboardCollectionCard
                key={collection.id}
                collection={collection}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-card/35 px-6 py-14 text-center">
            <p className="text-base font-semibold">No collections yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first collection to start organizing items.
            </p>
            <Button asChild className="mt-5">
              <Link href="/collections?createCollection=1">Create collection</Link>
            </Button>
          </div>
        )}
      </AppPageShell>
    </DashboardShell>
  );
};

export default CollectionsPage;
