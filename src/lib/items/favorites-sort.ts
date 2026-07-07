import type { DashboardCollection } from "@/lib/db/collections";
import type { DashboardItem } from "@/lib/db/items";

export type FavoriteItemSortKey = "date" | "name" | "itemType";
export type FavoriteCollectionSortKey = "date" | "name";

const compareText = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: "base" });

const compareDateDesc = (left: string, right: string) =>
  new Date(right).getTime() - new Date(left).getTime();

const compareById = (left: string, right: string) => left.localeCompare(right);

const compareItemsByName = (left: DashboardItem, right: DashboardItem) => {
  const titleComparison = compareText(left.title, right.title);

  if (titleComparison !== 0) {
    return titleComparison;
  }

  const itemTypeComparison = compareText(left.itemType.name, right.itemType.name);

  if (itemTypeComparison !== 0) {
    return itemTypeComparison;
  }

  const dateComparison = compareDateDesc(left.updatedAt, right.updatedAt);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return compareById(left.id, right.id);
};

const compareItemsByDate = (left: DashboardItem, right: DashboardItem) => {
  const dateComparison = compareDateDesc(left.updatedAt, right.updatedAt);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return compareItemsByName(left, right);
};

const compareItemsByType = (left: DashboardItem, right: DashboardItem) => {
  const itemTypeComparison = compareText(left.itemType.name, right.itemType.name);

  if (itemTypeComparison !== 0) {
    return itemTypeComparison;
  }

  return compareItemsByName(left, right);
};

const compareCollectionsByName = (
  left: DashboardCollection,
  right: DashboardCollection,
) => {
  const nameComparison = compareText(left.name, right.name);

  if (nameComparison !== 0) {
    return nameComparison;
  }

  const dateComparison = compareDateDesc(left.updatedAt, right.updatedAt);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return compareById(left.id, right.id);
};

const compareCollectionsByDate = (
  left: DashboardCollection,
  right: DashboardCollection,
) => {
  const dateComparison = compareDateDesc(left.updatedAt, right.updatedAt);

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return compareCollectionsByName(left, right);
};

export const sortFavoriteItems = (
  items: DashboardItem[],
  sortKey: FavoriteItemSortKey,
) => {
  const sortedItems = [...items];

  sortedItems.sort((left, right) => {
    if (sortKey === "name") {
      return compareItemsByName(left, right);
    }

    if (sortKey === "itemType") {
      return compareItemsByType(left, right);
    }

    return compareItemsByDate(left, right);
  });

  return sortedItems;
};

export const sortFavoriteCollections = (
  collections: DashboardCollection[],
  sortKey: FavoriteCollectionSortKey,
) => {
  const sortedCollections = [...collections];

  sortedCollections.sort((left, right) => {
    if (sortKey === "name") {
      return compareCollectionsByName(left, right);
    }

    return compareCollectionsByDate(left, right);
  });

  return sortedCollections;
};
