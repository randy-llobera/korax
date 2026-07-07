"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import type { SidebarCollection } from "@/lib/db/collections";
import type { DashboardUser } from "@/lib/db/dashboard-user";
import type { SidebarItemType } from "@/lib/db/items";

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileSidebarTriggerProps {
  user: DashboardUser | null;
  itemTypes: SidebarItemType[];
  favoriteCollections: SidebarCollection[];
  recentCollections: SidebarCollection[];
}

export const MobileSidebarTrigger = ({
  user,
  itemTypes,
  favoriteCollections,
  recentCollections,
}: MobileSidebarTriggerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Open sidebar"
        >
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-75 p-0 sm:max-w-none"
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sidebar navigation</SheetTitle>
          <SheetDescription>Browse item types and collections.</SheetDescription>
        </SheetHeader>
        <Sidebar
          mobile
          user={user}
          itemTypes={itemTypes}
          favoriteCollections={favoriteCollections}
          recentCollections={recentCollections}
          className="border-r-0"
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};
