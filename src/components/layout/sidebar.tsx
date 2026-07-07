"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut as clientSignOut } from "next-auth/react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  User,
} from "lucide-react";

import type { SidebarCollection } from "@/lib/db/collections";
import type { DashboardUser } from "@/lib/db/dashboard-user";
import type { SidebarItemType } from "@/lib/db/items";
import { getItemTypeHref, isProOnlyItemRoute } from "@/lib/items/navigation";

import { UserAvatar } from "@/components/auth/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getItemTypeIcon } from "@/components/utils/item-type";

interface SidebarProps {
  user: DashboardUser | null;
  itemTypes: SidebarItemType[];
  favoriteCollections: SidebarCollection[];
  recentCollections: SidebarCollection[];
  collapsed?: boolean;
  mobile?: boolean;
  className?: string;
  onNavigate?: () => void;
  onToggleCollapsed?: () => void;
}
export const Sidebar = ({
  user,
  itemTypes,
  favoriteCollections,
  recentCollections,
  collapsed = false,
  mobile = false,
  className,
  onNavigate,
  onToggleCollapsed,
}: SidebarProps) => {
  const pathname = usePathname();
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
  const [activeCollectionNavKey, setActiveCollectionNavKey] = useState<string | null>(null);
  const collectionsSectionId = mobile ? "sidebar-collections-mobile" : "sidebar-collections";
  const displayName = user?.name?.trim() || "User";
  const getNavLinkClassName = (isActive: boolean, compact = false) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
      isActive
        ? "bg-primary/12 text-foreground shadow-sm shadow-black/5"
        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
      compact && "justify-center px-2"
    );

  const handleSignOut = async () => {
    onNavigate?.();
    await clientSignOut({ callbackUrl: "/sign-in" });
  };

  const getCollectionNavKey = (section: "favorite" | "recent", collectionId: string) =>
    `${section}:${collectionId}`;

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-border/70 bg-card/30 transition-[width] duration-200",
        mobile ? "w-full" : collapsed ? "w-20" : "w-72",
        className
      )}
    >
      <div className="border-b border-border/70 px-3 py-3">
        {collapsed && !mobile ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium tracking-tight text-foreground">
              Navigation
            </span>
            {mobile ? null : (
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <section className="space-y-2">
          {collapsed && !mobile ? null : (
            <div className="px-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Types
            </div>
          )}
          <nav className="space-y-1">
            {itemTypes.map((itemType) => {
              const Icon = getItemTypeIcon(itemType.icon);
              const showProBadge = isProOnlyItemRoute(itemType.slug);
              const href = getItemTypeHref(itemType.slug);
              const isActive = pathname === href;

              return (
                <Link
                  key={itemType.id}
                  href={href}
                  onClick={onNavigate}
                  title={itemType.name}
                  aria-current={isActive ? "page" : undefined}
                  className={getNavLinkClassName(isActive, collapsed && !mobile)}
                >
                  <Icon
                    className="size-4 shrink-0"
                    style={itemType.color ? { color: itemType.color } : undefined}
                  />
                  {collapsed && !mobile ? null : (
                    <>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate">{itemType.name}</span>
                        {showProBadge ? (
                          <Badge
                            variant="outline"
                            className="h-5 rounded-full border-border/70 px-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground"
                          >
                            PRO
                          </Badge>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground/80">
                        {itemType.count}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </section>

        {collapsed && !mobile ? null : (
          <section className="space-y-2 border-t border-border/70 pt-5">
            <button
              type="button"
              onClick={() => setIsCollectionsOpen((current) => !current)}
              aria-controls={collectionsSectionId}
              aria-expanded={isCollectionsOpen}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:bg-muted/70"
            >
              <span className="flex-1 text-left">Collections</span>
              {isCollectionsOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>

            {isCollectionsOpen ? (
              <div id={collectionsSectionId} className="space-y-5">
                <div className="space-y-2">
                  <div className="px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
                    Favorites
                  </div>
                  <div className="space-y-1">
                    {favoriteCollections.map((collection) => {
                      const href = `/collections/${collection.id}`;
                      const navKey = getCollectionNavKey("favorite", collection.id);
                      const hasActiveCollectionNavKey =
                        activeCollectionNavKey?.endsWith(`:${collection.id}`) ?? false;
                      const isActive =
                        pathname === href &&
                        (hasActiveCollectionNavKey ? activeCollectionNavKey === navKey : true);

                      return (
                      <Link
                        key={collection.id}
                        href={href}
                        onClick={() => {
                          setActiveCollectionNavKey(navKey);
                          onNavigate?.();
                        }}
                        title={collection.name}
                        aria-current={isActive ? "page" : undefined}
                        className={getNavLinkClassName(isActive)}
                      >
                        <Folder className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                        <Star className="size-3.5 fill-current text-yellow-400" />
                      </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
                    Recent
                  </div>
                  <div className="space-y-1">
                    {recentCollections.map((collection) => {
                      const href = `/collections/${collection.id}`;
                      const navKey = getCollectionNavKey("recent", collection.id);
                      const isFavoriteCollection = favoriteCollections.some(
                        (favoriteCollection) => favoriteCollection.id === collection.id
                      );
                      const hasActiveCollectionNavKey =
                        activeCollectionNavKey?.endsWith(`:${collection.id}`) ?? false;
                      const isActive =
                        pathname === href &&
                        (hasActiveCollectionNavKey
                          ? activeCollectionNavKey === navKey
                          : !isFavoriteCollection);

                      return (
                      <Link
                        key={collection.id}
                        href={href}
                        onClick={() => {
                          setActiveCollectionNavKey(navKey);
                          onNavigate?.();
                        }}
                        title={collection.name}
                        aria-current={isActive ? "page" : undefined}
                        className={getNavLinkClassName(isActive)}
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={
                            collection.dominantTypeColor
                              ? { backgroundColor: collection.dominantTypeColor }
                              : undefined
                          }
                        />
                        <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                        <span className="text-xs text-muted-foreground/80">
                          {collection.itemCount}
                        </span>
                      </Link>
                      );
                    })}
                  </div>
                </div>

                <Link
                  href="/collections"
                  onClick={onNavigate}
                  aria-current={pathname === "/collections" ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center px-3 py-2 text-sm font-medium transition-colors",
                    pathname === "/collections"
                      ? "text-foreground"
                      : "text-primary hover:text-primary/80"
                  )}
                >
                  View all collections
                </Link>
              </div>
            ) : null}
          </section>
        )}
      </div>

      <div className="mt-auto border-t border-border/70 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={displayName}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/70 data-[state=open]:bg-muted/70",
                collapsed && !mobile && "justify-center px-2"
              )}
            >
              <UserAvatar
                name={user?.name}
                image={user?.image}
                fallbackLabel={user?.email ?? "User"}
              />
              {collapsed && !mobile ? null : (
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{displayName}</div>
                  <div className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={collapsed && !mobile ? "end" : "start"}
            side="top"
            className="w-56"
          >
            <DropdownMenuItem
              asChild
              className={cn(pathname === "/profile" && "bg-muted text-foreground")}
            >
              <Link
                href="/profile"
                onClick={onNavigate}
                aria-current={pathname === "/profile" ? "page" : undefined}
              >
                <User className="size-4 shrink-0" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              asChild
              className={cn(pathname === "/settings" && "bg-muted text-foreground")}
            >
              <Link
                href="/settings"
                onClick={onNavigate}
                aria-current={pathname === "/settings" ? "page" : undefined}
              >
                <Settings className="size-4 shrink-0" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSignOut} variant="destructive">
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
};
