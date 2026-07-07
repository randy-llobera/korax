import { notFound, redirect } from "next/navigation";

import {
  getItemsByTypeSlug,
  getItemTypeLabel,
  getSidebarItemTypes,
} from "@/lib/db/items";
import {
  getAvailableCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import { ITEMS_PER_PAGE, parsePageParam } from "@/lib/pagination";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardItemsList } from "@/components/dashboard/dashboard-items-list";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { AppPageHeader } from "@/components/layout/app-page-header";
import { AppPageShell } from "@/components/layout/app-page-shell";

interface ItemsByTypePageProps {
  params: Promise<{
    type: string;
  }>;
  searchParams?: Promise<{
    page?: string | string[];
  }>;
}

const PRO_ONLY_ITEM_ROUTE_TYPES = new Set(["files", "images"]);

const ItemsByTypePage = async ({
  params,
  searchParams,
}: ItemsByTypePageProps) => {
  const { type } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parsePageParam(resolvedSearchParams?.page);
  const [user, itemTypes, sidebarCollections, collections] = await Promise.all([
    getDashboardUser(),
    getSidebarItemTypes(),
    getSidebarCollectionsData(),
    getAvailableCollections(),
  ]);

  if (PRO_ONLY_ITEM_ROUTE_TYPES.has(type) && !user?.isPro) {
    redirect("/upgrade");
  }

  const result = await getItemsByTypeSlug(type, page, ITEMS_PER_PAGE);

  if (!result) {
    notFound();
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
          title={getItemTypeLabel(result.itemType.name)}
          description={`${result.pagination.totalItems} ${result.pagination.totalItems === 1 ? "item" : "items"}`}
        />
        <div className="space-y-5">
          <DashboardItemsList itemType={result.itemType} items={result.items} />
          <PaginationControls
            basePath={`/items/${type}`}
            pagination={result.pagination}
          />
        </div>
      </AppPageShell>
    </DashboardShell>
  );
};

export default ItemsByTypePage;
