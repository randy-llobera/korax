"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ItemsUpgradePageProps {
  itemTypeLabel: string;
}

export const ItemsUpgradePage = ({ itemTypeLabel }: ItemsUpgradePageProps) => {
  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lock className="size-4" />
          Pro-only access
        </div>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          Upgrade to open {itemTypeLabel}
        </CardTitle>
        <CardDescription className="max-w-2xl text-base">
          {itemTypeLabel} are part of Pro. Upgrade to unlock file and image items, uploads, and
          the full {itemTypeLabel.toLowerCase()} library.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/upgrade">View upgrade options</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/items/snippets">Go to snippets</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
