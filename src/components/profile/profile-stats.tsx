"use client";

import type { DashboardStats, SidebarItemType } from "@/lib/db/items";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileStatsProps {
  itemTypes: SidebarItemType[];
  stats: DashboardStats;
}

const statCards = [
  {
    key: "items",
    label: "Total items",
    valueKey: "itemCount",
  },
  {
    key: "collections",
    label: "Total collections",
    valueKey: "collectionCount",
  },
  {
    key: "favoriteItems",
    label: "Favorite items",
    valueKey: "favoriteItemCount",
  },
  {
    key: "favoriteCollections",
    label: "Favorite collections",
    valueKey: "favoriteCollectionCount",
  },
] as const;

export const ProfileStats = ({ itemTypes, stats }: ProfileStatsProps) => {
  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Item type breakdown</CardTitle>
          <CardDescription>Counts across your saved content types.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {itemTypes.map((itemType) => (
            <div
              key={itemType.id}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: itemType.color }}
                />
                <span className="font-medium">{itemType.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{itemType.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((statCard) => (
          <Card key={statCard.key} className="border-border/70">
            <CardHeader>
              <CardDescription>{statCard.label}</CardDescription>
              <CardTitle className="text-3xl">
                {stats[statCard.valueKey].toLocaleString("en-US")}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};
