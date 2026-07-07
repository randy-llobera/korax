"use client";

import { ImageIcon } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";
import { isSvgFileName } from "@/lib/files/upload";

import { ItemFavoriteButton } from "@/components/dashboard/item-favorite-button";
import { useItemDrawer } from "@/components/dashboard/item-drawer-provider";
import { formatUpdatedAt } from "@/components/utils/date";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardImageCardProps {
  item: DashboardItem;
}

export const DashboardImageCard = ({ item }: DashboardImageCardProps) => {
  const { openItem } = useItemDrawer();
  const inlinePreviewHref = `/api/items/${item.id}/download?inline=1`;
  const supportsInlinePreview = !isSvgFileName(item.fileName);

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-card/55 shadow-sm shadow-black/10 transition-colors hover:border-foreground/15 hover:bg-card/75">
      <div className="relative">
        <ItemFavoriteButton
          itemId={item.id}
          itemTitle={item.title}
          isFavorite={item.isFavorite}
          className="absolute top-3 right-3 z-10 rounded-full border border-border/60 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-xs"
          stopPropagation={false}
        />
        <button
          type="button"
          className="block w-full rounded-[1.25rem] border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          onClick={() => openItem(item)}
        >
          <div className="group relative aspect-video overflow-hidden bg-muted/40">
            {supportsInlinePreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inlinePreviewHref}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />
              </>
            ) : (
              <div className="flex h-full items-center justify-center bg-muted/30 text-muted-foreground">
                <ImageIcon className="size-10" style={{ color: item.itemType.color }} />
              </div>
            )}
          </div>

          <CardContent className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-[-0.01em]">
                  {item.title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex min-w-0 items-center gap-2">
                <ImageIcon className="size-3.5 shrink-0" style={{ color: item.itemType.color }} />
                {item.collection ? (
                  <span className="truncate">{item.collection.name}</span>
                ) : (
                  <span>Unfiled</span>
                )}
              </div>
              <span className="shrink-0 font-medium">{formatUpdatedAt(item.updatedAt)}</span>
            </div>
          </CardContent>
        </button>
      </div>
    </Card>
  );
};
