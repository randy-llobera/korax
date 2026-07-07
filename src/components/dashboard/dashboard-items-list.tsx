import type { DashboardItem, ItemTypeSummary } from "@/lib/db/items";

import { getItemTypeLabel } from "@/lib/db/items";

import { DashboardFileRow } from "@/components/dashboard/dashboard-file-row";
import { DashboardItemCard } from "@/components/dashboard/dashboard-item-card";
import { DashboardImageCard } from "@/components/dashboard/dashboard-image-card";

interface DashboardItemsListProps {
  itemType: ItemTypeSummary;
  items: DashboardItem[];
}

export const DashboardItemsList = ({
  itemType,
  items,
}: DashboardItemsListProps) => {
  const itemTypeLabel = getItemTypeLabel(itemType.name);
  const isImageGallery = itemType.slug === "images";
  const isFileList = itemType.slug === "files";

  return (
    <>
      {items.length > 0 ? (
        isFileList ? (
          <div className="space-y-3">
            {items.map((item) => (
              <DashboardFileRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {items.map((item) => (
              isImageGallery ? (
              <DashboardImageCard key={item.id} item={item} />
            ) : (
              <DashboardItemCard key={item.id} item={item} variant="items" />
              )
            ))}
          </div>
        )
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-card/35 px-6 py-14 text-center">
          <p className="text-base font-semibold">{itemTypeLabel}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            No saved {itemType.name.toLowerCase()}s yet. Create your first {itemType.name.toLowerCase()} to see it here.
          </p>
        </div>
      )}
    </>
  );
};
