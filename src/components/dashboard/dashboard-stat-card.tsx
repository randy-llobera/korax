import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

interface DashboardStatCardProps {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
}

const STAT_ICON_STYLES: Record<string, string> = {
  Items: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  Collections: "border-violet-500/20 bg-violet-500/10 text-violet-400",
  "Favorite Items": "border-amber-500/20 bg-amber-500/10 text-amber-400",
  "Favorite Collections": "border-pink-500/20 bg-pink-500/10 text-pink-400",
};

export const DashboardStatCard = ({
  label,
  value,
  icon: Icon,
}: DashboardStatCardProps) => {
  const iconStyles =
    STAT_ICON_STYLES[label] ?? "border-border/60 bg-muted/35 text-muted-foreground";

  return (
    <Card className="border-border/70 bg-card/70 shadow-sm shadow-black/5">
      <CardContent className="flex items-center gap-3 px-3 py-3 lg:px-4">
        <div className={`rounded-lg border p-2 ${iconStyles} lg:rounded-xl lg:p-2.5`}>
          <Icon className="size-3.5 lg:size-4.5" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <CardTitle className="text-xl font-semibold tracking-tight lg:text-2xl">
            {value}
          </CardTitle>
          <CardDescription className="text-sm text-foreground/85">
            {label}
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );
};
