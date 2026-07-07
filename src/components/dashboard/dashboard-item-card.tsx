"use client";

import { Pin } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";

import { ItemFavoriteButton } from "@/components/dashboard/item-favorite-button";
import { ItemTypeIconBadge } from "@/components/dashboard/item-identity";
import { useItemDrawer } from "@/components/dashboard/item-drawer-provider";
import { formatUpdatedAt } from "@/components/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardItemCardProps {
  item: DashboardItem;
  showPinnedIndicator?: boolean;
  variant?: "default" | "items";
}

export const DashboardItemCard = ({
  item,
  showPinnedIndicator = false,
  variant = "default",
}: DashboardItemCardProps) => {
  const { openItem } = useItemDrawer();
  const isItemsVariant = variant === "items";

  return (
    <Card
      className={
        isItemsVariant
          ? "h-full overflow-hidden border-border/60 bg-card/55 shadow-sm shadow-black/10 transition-colors hover:border-foreground/15 hover:bg-card/75"
          : "h-full border-border/70 bg-background/35 transition-colors hover:border-primary/40 hover:bg-muted/30"
      }
      style={{ borderLeftColor: item.itemType.color, borderLeftWidth: "4px" }}
    >
      <CardContent
        className={
          isItemsVariant
            ? "flex h-full items-start gap-3 px-5 py-4"
            : "flex h-full items-start gap-3 px-4 py-4"
        }
      >
        {isItemsVariant ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            onClick={() => openItem(item)}
          >
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <ItemTypeIconBadge
                icon={item.itemType.icon}
                color={item.itemType.color}
                iconClassName="size-5"
                className="mt-0.5 rounded-2xl border-0 bg-muted/45 p-3 ring-1 ring-white/5"
              />

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="min-w-0 flex-1 line-clamp-2 text-[1.05rem] font-semibold">
                        {item.title}
                      </p>
                      {showPinnedIndicator && item.isPinned ? (
                        <Pin className="size-3.5 shrink-0 text-primary" />
                      ) : null}
                    </div>

                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {item.tags.length > 0 ? (
                  item.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      {item.itemType.name.toLowerCase()}
                    </Badge>
                    {item.collection ? (
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                      >
                        {item.collection.name}
                      </Badge>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </button>
        ) : (
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            onClick={() => openItem(item)}
          >
            <ItemTypeIconBadge
              icon={item.itemType.icon}
              color={item.itemType.color}
            />

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                      {item.title}
                    </p>
                    {showPinnedIndicator && item.isPinned ? (
                      <Pin className="size-3.5 shrink-0 text-primary" />
                    ) : null}
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {item.collection ? (
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                    {item.collection.name}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                  {item.itemType.name}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  Updated {formatUpdatedAt(item.updatedAt)}
                </Badge>
              </div>

              {item.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-full px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </button>
        )}

        {isItemsVariant ? null : (
          <ItemFavoriteButton
            itemId={item.id}
            itemTitle={item.title}
            isFavorite={item.isFavorite}
            className="mt-0.5 shrink-0 rounded-full text-muted-foreground"
            iconClassName="size-3.5"
            stopPropagation={false}
          />
        )}
      </CardContent>
    </Card>
  );
};
