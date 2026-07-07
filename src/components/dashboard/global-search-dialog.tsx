"use client";

import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";

import { ItemTypeIconBadge } from "@/components/dashboard/item-identity";
import { useSearch } from "@/components/dashboard/search-provider";
import { useItemDrawer } from "@/components/dashboard/item-drawer-provider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const normalizeSearchValue = (value: string) => value.trim().toLowerCase();

const getCommandScore = (value: string, search: string, keywords?: string[]) => {
  const normalizedSearch = normalizeSearchValue(search);

  if (!normalizedSearch) {
    return 1;
  }

  const title = normalizeSearchValue(value);
  const terms = normalizedSearch.split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return 1;
  }

  const normalizedKeywords = (keywords ?? []).map(normalizeSearchValue);
  let score = 0;

  for (const term of terms) {
    if (title.startsWith(term)) {
      score += 120;
      continue;
    }

    if (title.includes(term)) {
      score += 80;
      continue;
    }

    const matchingKeyword = normalizedKeywords.find((keyword) => keyword.includes(term));

    if (!matchingKeyword) {
      return 0;
    }

    score += matchingKeyword === term ? 50 : 25;
  }

  return score;
};

interface SearchItemResultProps {
  item: ReturnType<typeof useSearch>["items"][number];
  onSelect: (item: ReturnType<typeof useSearch>["items"][number]) => void;
}

const SearchItemResult = ({ item, onSelect }: SearchItemResultProps) => (
    <CommandItem
      value={item.title}
      keywords={[
        item.itemType.name,
        ...item.tags,
        ...(item.collection ? [item.collection.name] : []),
      ]}
      onSelect={() => onSelect(item)}
      className="items-start gap-3 px-3 py-3"
    >
      <ItemTypeIconBadge
        icon={item.itemType.icon}
        color={item.itemType.color}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{item.title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {item.itemType.name}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {item.description}
        </p>
        {item.collection ? (
          <p className="mt-2 text-xs text-muted-foreground">
            In {item.collection.name}
          </p>
        ) : null}
      </div>
    </CommandItem>
);

interface SearchCollectionResultProps {
  collection: ReturnType<typeof useSearch>["collections"][number];
  onSelect: (collectionId: string) => void;
}

const SearchCollectionResult = ({
  collection,
  onSelect,
}: SearchCollectionResultProps) => (
  <CommandItem
    value={collection.name}
    keywords={collection.itemTypes.map((itemType) => itemType.name)}
    onSelect={() => onSelect(collection.id)}
    className="items-start gap-3 px-3 py-3"
  >
    <div className="mt-0.5 rounded-xl border border-border/60 bg-muted/50 p-2 text-muted-foreground">
      <Folder className="size-4" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-medium">{collection.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {collection.itemTypes.slice(0, 3).map((itemType) => (
          <span key={itemType.id}>{itemType.name}</span>
        ))}
      </div>
    </div>
  </CommandItem>
);

export const GlobalSearchDialog = () => {
  const router = useRouter();
  const { openItem } = useItemDrawer();
  const {
    closeSearch,
    collections,
    error,
    isLoading,
    items,
    open,
    query,
    setQuery,
  } = useSearch();

  const handleSelectItem = (item: (typeof items)[number]) => {
    closeSearch();
    openItem(item);
  };

  const handleSelectCollection = (collectionId: string) => {
    closeSearch();
    router.push(`/collections/${collectionId}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeSearch();
        }
      }}
    >
      <DialogContent
        className="overflow-hidden border-border/70 bg-background p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <Command shouldFilter loop filter={getCommandScore}>
          <CommandInput
            placeholder="Search items and collections..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-112">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading search data...
              </div>
            ) : error ? (
              <div className="py-6 text-center text-sm text-destructive">
                {error}
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {items.length > 0 || collections.length > 0
                    ? "No items or collections match your search."
                    : "No searchable items or collections yet."}
                </CommandEmpty>
                {items.length > 0 ? (
                  <CommandGroup heading="Items">
                    {items.map((item) => (
                      <SearchItemResult
                        key={item.id}
                        item={item}
                        onSelect={handleSelectItem}
                      />
                    ))}
                  </CommandGroup>
                ) : null}
                {collections.length > 0 ? (
                  <CommandGroup heading="Collections">
                    {collections.map((collection) => (
                      <SearchCollectionResult
                        key={collection.id}
                        collection={collection}
                        onSelect={handleSelectCollection}
                      />
                    ))}
                  </CommandGroup>
                ) : null}
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};
