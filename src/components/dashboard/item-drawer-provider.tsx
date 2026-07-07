"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { CollectionOption } from "@/lib/db/collections";
import type { DashboardItem, ItemDrawerDetail } from "@/lib/db/items";

import { ItemDrawer } from "@/components/dashboard/item-drawer";

interface ItemDrawerContextValue {
  openItem: (item: DashboardItem) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

const parseItemResponse = async (response: Response) => {
  const payload = (await response.json()) as
    | {
        item?: ItemDrawerDetail;
        error?: string;
      }
    | undefined;

  if (!response.ok || !payload?.item) {
    throw new Error(payload?.error ?? "Failed to load item details.");
  }

  return payload.item;
};

export const ItemDrawerProvider = ({
  children,
  collections,
  isPro,
}: {
  children: ReactNode;
  collections: CollectionOption[];
  isPro: boolean;
}) => {
  const cacheRef = useRef<Map<string, ItemDrawerDetail>>(new Map());
  const requestIdRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<DashboardItem | null>(null);
  const [item, setItem] = useState<ItemDrawerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openItem = useCallback((nextItem: DashboardItem) => {
    const cachedItem = cacheRef.current.get(nextItem.id) ?? null;

    setOpen(true);
    setPreview(nextItem);
    setItem(cachedItem);
    setError(null);

    if (cachedItem) {
      setIsLoading(false);
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    setIsLoading(true);

    void fetch(`/api/items/${nextItem.id}`)
      .then(parseItemResponse)
      .then((result) => {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        cacheRef.current.set(result.id, result);
        setItem(result);
        setIsLoading(false);
      })
      .catch((fetchError: unknown) => {
        if (requestIdRef.current !== currentRequestId) {
          return;
        }

        setError(
          fetchError instanceof Error ? fetchError.message : "Failed to load item details.",
        );
        setIsLoading(false);
      });
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      requestIdRef.current += 1;
      setIsLoading(false);
      setError(null);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!item) {
      return;
    }

    const value = item.content ?? item.url ?? item.fileUrl ?? item.title;
    await navigator.clipboard.writeText(value);
  }, [item]);

  const handleItemUpdated = useCallback((updatedItem: ItemDrawerDetail) => {
    cacheRef.current.set(updatedItem.id, updatedItem);
    setItem(updatedItem);
    setError(null);
    setPreview((currentPreview) => {
      if (!currentPreview || currentPreview.id !== updatedItem.id) {
        return currentPreview;
      }

      return {
        ...currentPreview,
        title: updatedItem.title,
        description: updatedItem.description ?? "No description yet.",
        isFavorite: updatedItem.isFavorite,
        isPinned: updatedItem.isPinned,
        updatedAt: updatedItem.updatedAt,
        tags: updatedItem.tags,
        itemType: updatedItem.itemType,
        collection: updatedItem.collections[0] ?? null,
      };
    });
  }, []);

  const handleItemDeleted = useCallback((itemId: string) => {
    cacheRef.current.delete(itemId);
    requestIdRef.current += 1;
    setOpen(false);
    setPreview(null);
    setItem(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const contextValue = useMemo<ItemDrawerContextValue>(
    () => ({
      openItem,
    }),
    [openItem],
  );

  return (
    <ItemDrawerContext.Provider value={contextValue}>
      {children}
      <ItemDrawer
        collections={collections}
        error={error}
        isLoading={isLoading}
        isPro={isPro}
        item={item}
        key={`${item?.id ?? preview?.id ?? "empty"}:${item?.updatedAt ?? "stale"}:${open ? "open" : "closed"}`}
        onCopy={handleCopy}
        onItemDeleted={handleItemDeleted}
        onItemUpdated={handleItemUpdated}
        onOpenChange={handleOpenChange}
        open={open}
        preview={preview}
      />
    </ItemDrawerContext.Provider>
  );
};

export const useItemDrawer = () => {
  const context = useContext(ItemDrawerContext);

  if (!context) {
    throw new Error("useItemDrawer must be used within an ItemDrawerProvider.");
  }

  return context;
};
