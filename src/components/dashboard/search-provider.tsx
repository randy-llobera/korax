"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSearchData } from "@/actions/search";
import type { GlobalSearchCollection } from "@/lib/db/collections";
import type { GlobalSearchItem } from "@/lib/db/items";

interface SearchContextValue {
  closeSearch: () => void;
  collections: GlobalSearchCollection[];
  error: string | null;
  invalidateSearchData: () => void;
  isLoading: boolean;
  items: GlobalSearchItem[];
  open: boolean;
  openSearch: () => void;
  query: string;
  setQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<GlobalSearchItem[]>([]);
  const [collections, setCollections] = useState<GlobalSearchCollection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSearchData = useCallback(async () => {
    if (isLoading || (hasLoaded && !isStale)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await getSearchData();

    setIsLoading(false);

    if (!result.success || !result.data) {
      setError(result.error ?? "Unable to load search data.");
      return;
    }

    setItems(result.data.items);
    setCollections(result.data.collections);
    setHasLoaded(true);
    setIsStale(false);
  }, [hasLoaded, isLoading, isStale]);

  const openSearch = useCallback(() => {
    setOpen(true);

    if (!hasLoaded || isStale) {
      void loadSearchData();
    }
  }, [hasLoaded, isStale, loadSearchData]);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    setError(null);
  }, []);

  const invalidateSearchData = useCallback(() => {
    setHasLoaded(false);
    setIsStale(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      event.preventDefault();

      if (open) {
        closeSearch();
        return;
      }

      openSearch();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSearch, open, openSearch]);

  const contextValue = useMemo<SearchContextValue>(
    () => ({
      closeSearch,
      collections,
      error,
      invalidateSearchData,
      isLoading,
      items,
      open,
      openSearch,
      query,
      setQuery,
    }),
    [
      closeSearch,
      collections,
      error,
      invalidateSearchData,
      isLoading,
      items,
      open,
      openSearch,
      query,
    ],
  );

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider.");
  }

  return context;
};
