import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { DashboardCollection } from "@/lib/db/collections";

import { DashboardCollectionCard } from "@/components/dashboard/dashboard-collection-card";
import {
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

interface DashboardCollectionsProps {
  collections: DashboardCollection[];
}

export const DashboardCollections = ({
  collections,
}: DashboardCollectionsProps) => {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Collections
          </CardTitle>
          <CardDescription>
            Jump back into the collections you touched most recently.
          </CardDescription>
        </div>
        <Link
          href="/collections"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {collections.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {collections.map((collection) => (
            <DashboardCollectionCard
              key={collection.id}
              collection={collection}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-background/40 px-4 py-8 text-center text-sm text-muted-foreground">
          No collections to show yet.
        </div>
      )}
    </section>
  );
};
