"use server";

import { getSessionUserId } from "@/lib/actions/auth";
import type { GlobalSearchCollection } from "@/lib/db/collections";
import { getGlobalSearchCollections } from "@/lib/db/collections";
import type { GlobalSearchItem } from "@/lib/db/items";
import { getGlobalSearchItems } from "@/lib/db/items";

export interface SearchData {
  collections: GlobalSearchCollection[];
  items: GlobalSearchItem[];
}

interface SearchActionResult {
  success: boolean;
  data?: SearchData;
  error?: string;
}

export const getSearchData = async (): Promise<SearchActionResult> => {
  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to search.",
    };
  }

  try {
    const [items, collections] = await Promise.all([
      getGlobalSearchItems(userId),
      getGlobalSearchCollections(userId),
    ]);

    return {
      success: true,
      data: {
        items,
        collections,
      },
    };
  } catch (error) {
    console.error("Failed to load search data.", error);

    return {
      success: false,
      error: "Unable to load search data.",
    };
  }
};
