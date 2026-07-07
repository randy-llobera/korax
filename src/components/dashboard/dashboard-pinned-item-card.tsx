import type { DashboardItem } from "@/lib/db/items";
import { DashboardItemCard } from "@/components/dashboard/dashboard-item-card";

interface DashboardPinnedItemCardProps {
  item: DashboardItem;
}

export const DashboardPinnedItemCard = ({ item }: DashboardPinnedItemCardProps) => {
  return <DashboardItemCard item={item} showPinnedIndicator />;
};
