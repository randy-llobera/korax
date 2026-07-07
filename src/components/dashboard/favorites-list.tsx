"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Folder, Star } from "lucide-react";

import type { DashboardCollection } from "@/lib/db/collections";
import type { DashboardItem } from "@/lib/db/items";
import type {
  FavoriteCollectionSortKey,
  FavoriteItemSortKey,
} from "@/lib/items/favorites-sort";

import { formatDate } from "@/components/utils/date";
import { ItemTypeIconBadge } from "@/components/dashboard/item-identity";
import { useItemDrawer } from "@/components/dashboard/item-drawer-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  sortFavoriteCollections,
  sortFavoriteItems,
} from "@/lib/items/favorites-sort";

interface FavoritesListProps {
  items: DashboardItem[];
  collections: DashboardCollection[];
}

interface SortOption<TValue extends string> {
  label: string;
  value: TValue;
}

interface FavoritesSectionHeaderProps {
  title: string;
  count: number;
  sortLabel: string;
  options: SortOption<string>[];
  selectedValue: string;
  selectedLabel: string;
  onChange: (value: string) => void;
}

const FavoritesSectionHeader = ({
  title,
  count,
  sortLabel,
  options,
  selectedValue,
  selectedLabel,
  onChange,
}: FavoritesSectionHeaderProps) => (
  <div className="flex flex-col gap-3 border-b border-border/70 pb-2 md:flex-row md:items-center md:justify-between">
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
        {title}
      </h2>
      <span className="font-mono text-xs text-muted-foreground">
        {count}
      </span>
    </div>

    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {sortLabel}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-28 justify-between font-mono uppercase tracking-[0.12em]"
          >
            {selectedLabel}
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuRadioGroup value={selectedValue} onValueChange={onChange}>
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="font-mono uppercase tracking-[0.12em]"
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

const ITEM_SORT_OPTIONS: SortOption<FavoriteItemSortKey>[] = [
  { label: "Date", value: "date" },
  { label: "Name", value: "name" },
  { label: "Type", value: "itemType" },
];

const COLLECTION_SORT_OPTIONS: SortOption<FavoriteCollectionSortKey>[] = [
  { label: "Date", value: "date" },
  { label: "Name", value: "name" },
];

export const FavoritesList = ({ items, collections }: FavoritesListProps) => {
  const { openItem } = useItemDrawer();
  const [itemSort, setItemSort] = useState<FavoriteItemSortKey>("date");
  const [collectionSort, setCollectionSort] = useState<FavoriteCollectionSortKey>("date");
  const hasFavorites = items.length > 0 || collections.length > 0;
  const sortedItems = sortFavoriteItems(items, itemSort);
  const sortedCollections = sortFavoriteCollections(collections, collectionSort);
  const selectedItemSortLabel = ITEM_SORT_OPTIONS.find((option) => option.value === itemSort)?.label ?? "Date";
  const selectedCollectionSortLabel =
    COLLECTION_SORT_OPTIONS.find((option) => option.value === collectionSort)?.label ?? "Date";

  if (!hasFavorites) {
    return (
      <div className="border border-dashed border-border/70 px-6 py-14 text-center">
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em]">
          No favorites yet
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Favorite items or collections to keep them close.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <FavoritesSectionHeader
          count={items.length}
          onChange={(value) => setItemSort(value as FavoriteItemSortKey)}
          options={ITEM_SORT_OPTIONS}
          selectedLabel={selectedItemSortLabel}
          selectedValue={itemSort}
          sortLabel="Sort by"
          title="Items"
        />
        {sortedItems.length > 0 ? (
          <div className="divide-y divide-border/60 border-y border-border/60">
            {sortedItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="grid w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 md:grid-cols-[minmax(0,1.7fr)_auto_auto] md:items-center"
                  onClick={() => openItem(item)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ItemTypeIconBadge
                      icon={item.itemType.icon}
                      color={item.itemType.color}
                      className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted/35 p-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        {item.isFavorite ? (
                          <Star className="size-3.5 shrink-0 fill-current text-yellow-400" />
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.collection?.name ?? item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-2.5 py-1 font-mono text-[11px]">
                      {item.itemType.name}
                    </Badge>
                  </div>

                  <div className="font-mono text-xs text-muted-foreground md:text-right">
                    {formatDate(item.updatedAt)}
                  </div>
                </button>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No favorited items.</p>
        )}
      </section>

      <section className="space-y-3">
        <FavoritesSectionHeader
          count={collections.length}
          onChange={(value) => setCollectionSort(value as FavoriteCollectionSortKey)}
          options={COLLECTION_SORT_OPTIONS}
          selectedLabel={selectedCollectionSortLabel}
          selectedValue={collectionSort}
          sortLabel="Sort by"
          title="Collections"
        />
        {sortedCollections.length > 0 ? (
          <div className="divide-y divide-border/60 border-y border-border/60">
            {sortedCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="grid gap-3 px-3 py-3 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 md:grid-cols-[minmax(0,1.7fr)_auto_auto] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/35">
                    <Folder className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-sm font-medium text-foreground">
                        {collection.name}
                      </span>
                      <Star className="size-3.5 shrink-0 fill-current text-yellow-400" />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2.5 py-1 font-mono text-[11px]">
                    collection
                  </Badge>
                </div>

                <div className="font-mono text-xs text-muted-foreground md:text-right">
                  {formatDate(collection.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No favorited collections.</p>
        )}
      </section>
    </div>
  );
};
