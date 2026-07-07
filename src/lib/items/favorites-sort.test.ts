import { describe, expect, it } from "vitest";

import {
  sortFavoriteCollections,
  sortFavoriteItems,
} from "@/lib/items/favorites-sort";

describe("favorites sort helpers", () => {
  it("sorts favorite items by updated date descending by default", () => {
    const items = [
      {
        id: "item-1",
        title: "Zeta",
        description: "No description yet.",
        fileName: null,
        fileSize: null,
        isFavorite: true,
        isPinned: false,
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-02T08:00:00.000Z",
        tags: [],
        itemType: {
          id: "type-note",
          name: "note",
          icon: "StickyNote",
          color: "#fde047",
        },
        collection: null,
      },
      {
        id: "item-2",
        title: "Alpha",
        description: "No description yet.",
        fileName: null,
        fileSize: null,
        isFavorite: true,
        isPinned: false,
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-05T08:00:00.000Z",
        tags: [],
        itemType: {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
        },
        collection: null,
      },
    ];

    expect(sortFavoriteItems(items, "date").map((item) => item.id)).toEqual([
      "item-2",
      "item-1",
    ]);
    expect(items.map((item) => item.id)).toEqual(["item-1", "item-2"]);
  });

  it("sorts favorite items by name case-insensitively", () => {
    const items = [
      {
        id: "item-1",
        title: "zeta",
        description: "No description yet.",
        fileName: null,
        fileSize: null,
        isFavorite: true,
        isPinned: false,
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-02T08:00:00.000Z",
        tags: [],
        itemType: {
          id: "type-note",
          name: "note",
          icon: "StickyNote",
          color: "#fde047",
        },
        collection: null,
      },
      {
        id: "item-2",
        title: "Alpha",
        description: "No description yet.",
        fileName: null,
        fileSize: null,
        isFavorite: true,
        isPinned: false,
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-05T08:00:00.000Z",
        tags: [],
        itemType: {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
        },
        collection: null,
      },
    ];

    expect(sortFavoriteItems(items, "name").map((item) => item.id)).toEqual([
      "item-2",
      "item-1",
    ]);
  });

  it("sorts favorite items by item type, then name", () => {
    const items = [
      {
        id: "item-1",
        title: "Zeta command",
        description: "No description yet.",
        fileName: null,
        fileSize: null,
        isFavorite: true,
        isPinned: false,
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-02T08:00:00.000Z",
        tags: [],
        itemType: {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
        },
        collection: null,
      },
      {
        id: "item-2",
        title: "Alpha note",
        description: "No description yet.",
        fileName: null,
        fileSize: null,
        isFavorite: true,
        isPinned: false,
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-05T08:00:00.000Z",
        tags: [],
        itemType: {
          id: "type-note",
          name: "note",
          icon: "StickyNote",
          color: "#fde047",
        },
        collection: null,
      },
      {
        id: "item-3",
        title: "Alpha command",
        description: "No description yet.",
        fileName: null,
        fileSize: null,
        isFavorite: true,
        isPinned: false,
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-04T08:00:00.000Z",
        tags: [],
        itemType: {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
        },
        collection: null,
      },
    ];

    expect(sortFavoriteItems(items, "itemType").map((item) => item.id)).toEqual([
      "item-3",
      "item-1",
      "item-2",
    ]);
  });

  it("sorts favorite collections by updated date descending", () => {
    const collections = [
      {
        id: "collection-1",
        name: "Zeta",
        description: "No description yet.",
        isFavorite: true,
        itemCount: 1,
        typeCount: 1,
        updatedAt: "2026-04-02T08:00:00.000Z",
        dominantTypeColor: "#f97316",
        itemTypes: [],
      },
      {
        id: "collection-2",
        name: "Alpha",
        description: "No description yet.",
        isFavorite: true,
        itemCount: 2,
        typeCount: 1,
        updatedAt: "2026-04-05T08:00:00.000Z",
        dominantTypeColor: "#3b82f6",
        itemTypes: [],
      },
    ];

    expect(sortFavoriteCollections(collections, "date").map((collection) => collection.id)).toEqual([
      "collection-2",
      "collection-1",
    ]);
    expect(collections.map((collection) => collection.id)).toEqual([
      "collection-1",
      "collection-2",
    ]);
  });

  it("sorts favorite collections by name case-insensitively", () => {
    const collections = [
      {
        id: "collection-1",
        name: "zeta",
        description: "No description yet.",
        isFavorite: true,
        itemCount: 1,
        typeCount: 1,
        updatedAt: "2026-04-02T08:00:00.000Z",
        dominantTypeColor: "#f97316",
        itemTypes: [],
      },
      {
        id: "collection-2",
        name: "Alpha",
        description: "No description yet.",
        isFavorite: true,
        itemCount: 2,
        typeCount: 1,
        updatedAt: "2026-04-05T08:00:00.000Z",
        dominantTypeColor: "#3b82f6",
        itemTypes: [],
      },
    ];

    expect(sortFavoriteCollections(collections, "name").map((collection) => collection.id)).toEqual([
      "collection-2",
      "collection-1",
    ]);
  });
});
