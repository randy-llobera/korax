import type { DashboardItem } from "@/lib/db/items";

import { DashboardPinnedItemCard } from "@/components/dashboard/dashboard-pinned-item-card";
import { Badge } from "@/components/ui/badge";
import {
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

interface DashboardPinnedItemsProps {
  items: DashboardItem[];
}

export const DashboardPinnedItems = ({ items }: DashboardPinnedItemsProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Pinned
          </CardTitle>
          <CardDescription>
            Keep your most important references one click away.
          </CardDescription>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {items.length} pinned
        </Badge>
      </div>
      <div className="space-y-2.5">
        {items.map((item) => (
          <DashboardPinnedItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};
