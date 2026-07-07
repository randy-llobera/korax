import { Code, Folder, Pin, Star } from "lucide-react";

import type { DashboardStats as DashboardStatsData } from "@/lib/db/items";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";

interface DashboardStatsProps {
  data: DashboardStatsData;
}

export const DashboardStats = ({ data }: DashboardStatsProps) => {
  const stats = [
    {
      label: "Items",
      value: data.itemCount,
      helper: "Across your dashboard library",
      icon: Code,
    },
    {
      label: "Collections",
      value: data.collectionCount,
      helper: "Organized by project or topic",
      icon: Folder,
    },
    {
      label: "Favorite Items",
      value: data.favoriteItemCount,
      helper: "Saved for quick access",
      icon: Star,
    },
    {
      label: "Favorite Collections",
      value: data.favoriteCollectionCount,
      helper: "Your most-used collection groups",
      icon: Pin,
    },
  ] as const;

  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardStatCard key={stat.label} {...stat} />
      ))}
    </section>
  );
};
