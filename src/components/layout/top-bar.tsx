import type { ReactNode } from "react";
import Link from "next/link";
import { FolderPlus, Plus, Search, Sparkles, Star } from "lucide-react";

import { useSearch } from "@/components/dashboard/search-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  isPro: boolean;
  mobileSidebar: ReactNode;
  onCreateCollection: () => void;
  onCreateItem: () => void;
}

export const TopBar = ({
  isPro,
  mobileSidebar,
  onCreateCollection,
  onCreateItem,
}: TopBarProps) => {
  const { openSearch } = useSearch();

  return (
    <header className="border-b border-border/70">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-center">
          <div className="flex items-center justify-between gap-3 xl:justify-start">
            <div className="flex items-center gap-3">
              <div className="xl:hidden">{mobileSidebar}</div>
              <Link href="/dashboard" className="flex items-center gap-2.5 xl:gap-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground xl:size-7"
                >
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
                </svg>
                <span className="text-base font-semibold tracking-tight xl:text-lg">
                  Korax
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-1 xl:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={openSearch}
                aria-label="Open search"
              >
                <Search className="size-4" />
              </Button>
              {!isPro ? (
                <Button asChild variant="ghost" size="icon" className="size-9">
                  <Link href="/upgrade" aria-label="Upgrade to Pro">
                    <Sparkles className="size-4" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="icon" className="size-9">
                <Link href="/favorites" aria-label="Open favorites">
                  <Star className="size-4" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="icon"
                    className="size-9 bg-white! text-black! shadow-sm shadow-black/10 hover:bg-white/90!"
                    aria-label="Create new"
                  >
                    <Plus className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onSelect={onCreateCollection}>
                    <FolderPlus className="size-4" />
                    <span>New Collection</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onCreateItem}>
                    <Plus className="size-4" />
                    <span>New Item</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="relative hidden min-w-0 xl:block xl:w-md xl:justify-self-center">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              readOnly
              role="button"
              aria-label="Open global search"
              aria-haspopup="dialog"
              placeholder="Search items and collections... (⌘K)"
              className="h-10 cursor-pointer pl-9"
              onClick={openSearch}
              onFocus={(event) => {
                event.target.blur();
                openSearch();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openSearch();
                }
              }}
            />
          </div>

          <div className="hidden flex-wrap items-center gap-2 sm:justify-end xl:flex xl:flex-nowrap xl:justify-self-end">
            {!isPro ? (
              <Button asChild variant="ghost" className="w-full shrink-0 sm:w-auto">
                <Link href="/upgrade">Upgrade</Link>
              </Button>
            ) : null}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
            >
              <Link href="/favorites" aria-label="Open favorites">
                <Star className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 sm:w-auto"
              onClick={onCreateCollection}
            >
              <FolderPlus className="size-4" />
              New Collection
            </Button>
            <Button
              type="button"
              className="w-full shrink-0 sm:w-auto"
              onClick={onCreateItem}
            >
              <Plus className="size-4" />
              New Item
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
