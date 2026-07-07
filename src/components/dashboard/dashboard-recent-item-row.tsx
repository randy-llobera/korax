"use client";

import type { DashboardItem } from "@/lib/db/items";

import { ItemFavoriteButton } from "@/components/dashboard/item-favorite-button";
import { ItemTypeIconBadge } from "@/components/dashboard/item-identity";
import { useItemDrawer } from "@/components/dashboard/item-drawer-provider";
import { formatUpdatedAt } from "@/components/utils/date";
import { Badge } from "@/components/ui/badge";

interface DashboardRecentItemRowProps {
  item: DashboardItem;
}

export const DashboardRecentItemRow = ({ item }: DashboardRecentItemRowProps) => {
  const { openItem } = useItemDrawer();

  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/25 md:grid-cols-[minmax(0,1.35fr)_2.25rem_minmax(12rem,0.8fr)_6rem] md:items-center md:gap-4">
      <button
        type="button"
        className="flex min-w-0 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
        onClick={() => openItem(item)}
      >
        <ItemTypeIconBadge
          icon={item.itemType.icon}
          color={item.itemType.color}
          borderColor={item.itemType.color}
        />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>
        </div>
      </button>

      <ItemFavoriteButton
        itemId={item.id}
        itemTitle={item.title}
        isFavorite={item.isFavorite}
        className="mt-0.5 shrink-0 justify-self-end rounded-full text-muted-foreground md:mt-0 md:justify-self-start"
        iconClassName="size-3.5"
        stopPropagation={false}
      />

      <div className="col-span-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground md:col-span-1">
        {item.collection ? (
          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
            {item.collection.name}
          </Badge>
        ) : null}
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
          {item.itemType.name}
        </Badge>
      </div>

      <div className="col-span-2 text-sm text-muted-foreground md:col-span-1 md:text-right">
        {formatUpdatedAt(item.updatedAt)}
      </div>
    </div>
  );
};
