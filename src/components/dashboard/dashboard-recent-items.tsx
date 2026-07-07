import Link from "next/link";

import type { DashboardItem } from "@/lib/db/items";

import { DashboardRecentItemRow } from "@/components/dashboard/dashboard-recent-item-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

interface DashboardRecentItemsProps {
  items: DashboardItem[];
}

export const DashboardRecentItems = ({ items }: DashboardRecentItemsProps) => {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Recent Items
          </CardTitle>
          <CardDescription>
            The latest additions and updates across your saved knowledge.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Showing {items.length} items
          </Badge>
          <Button asChild variant="ghost" size="sm" className="px-2">
            <Link href="/dashboard?createItem=1">New item</Link>
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
          <div className="hidden grid-cols-[minmax(0,1.35fr)_2.25rem_minmax(12rem,0.8fr)_6rem] gap-4 border-b border-border/70 bg-muted/25 px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground md:grid">
            <span>Item</span>
            <span aria-hidden="true" />
            <span>Collection</span>
            <span className="text-right">Updated</span>
          </div>

          <div className="divide-y divide-border/70">
            {items.map((item) => (
              <DashboardRecentItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-6 py-10 text-center">
          <p className="text-base font-semibold">No recent items yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first item to start building your knowledge hub.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard?createItem=1">Create item</Link>
          </Button>
        </div>
      )}
    </section>
  );
};
