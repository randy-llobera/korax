import { redirect } from "next/navigation";

import {
  getAvailableCollections,
  getFavoriteDashboardCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import {
  getFavoriteDashboardItems,
  getSidebarItemTypes,
} from "@/lib/db/items";

import { FavoritesList } from "@/components/dashboard/favorites-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { AppPageShell } from "@/components/layout/app-page-shell";

const FavoritesPage = async () => {
  const [user, itemTypes, sidebarCollections, collections, favoriteItems, favoriteCollections] =
    await Promise.all([
      getDashboardUser(),
      getSidebarItemTypes(),
      getSidebarCollectionsData(),
      getAvailableCollections(),
      getFavoriteDashboardItems(),
      getFavoriteDashboardCollections(),
    ]);

  if (!user) {
    redirect("/sign-in");
  }

  const totalFavorites = favoriteItems.length + favoriteCollections.length;

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
          title="Favorites"
          description={`${totalFavorites} ${totalFavorites === 1 ? "favorite" : "favorites"}`}
        />
        <FavoritesList items={favoriteItems} collections={favoriteCollections} />
      </AppPageShell>
    </DashboardShell>
  );
};

export default FavoritesPage;
