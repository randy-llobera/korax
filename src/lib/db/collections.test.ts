import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  collectionDeleteMock,
  collectionFindManyMock,
  collectionFindFirstMock,
  collectionUpdateMock,
  getDashboardUserMock,
  itemCountMock,
  itemFindFirstMock,
  itemFindManyMock,
  itemGroupByMock,
  itemTypeFindManyMock,
  itemCollectionDeleteManyMock,
  prismaTransactionMock,
} = vi.hoisted(() => ({
  collectionDeleteMock: vi.fn(),
  collectionFindManyMock: vi.fn(),
  collectionFindFirstMock: vi.fn(),
  collectionUpdateMock: vi.fn(),
  getDashboardUserMock: vi.fn(),
  itemCountMock: vi.fn(),
  itemFindFirstMock: vi.fn(),
  itemFindManyMock: vi.fn(),
  itemGroupByMock: vi.fn(),
  itemTypeFindManyMock: vi.fn(),
  itemCollectionDeleteManyMock: vi.fn(),
  prismaTransactionMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    collection: {
      findMany: collectionFindManyMock,
      findFirst: collectionFindFirstMock,
      update: collectionUpdateMock,
      delete: collectionDeleteMock,
    },
    item: {
      count: itemCountMock,
      findFirst: itemFindFirstMock,
      findMany: itemFindManyMock,
      groupBy: itemGroupByMock,
    },
    itemType: {
      findMany: itemTypeFindManyMock,
    },
    itemCollection: {
      deleteMany: itemCollectionDeleteManyMock,
    },
    $transaction: prismaTransactionMock,
  },
}));

vi.mock("@/lib/db/dashboard-user", () => ({
  getDashboardUser: getDashboardUserMock,
}));

import {
  buildCollectionSummary,
  deleteCollection,
  getFavoriteDashboardCollections,
  getCollectionDetailById,
  mapGlobalSearchCollection,
  mapCollectionDetailItem,
  updateCollection,
} from "@/lib/db/collections";

describe("collection db helpers", () => {
  beforeEach(() => {
    collectionDeleteMock.mockReset();
    collectionFindManyMock.mockReset();
    collectionFindFirstMock.mockReset();
    collectionUpdateMock.mockReset();
    getDashboardUserMock.mockReset();
    itemCountMock.mockReset();
    itemFindFirstMock.mockReset();
    itemFindManyMock.mockReset();
    itemGroupByMock.mockReset();
    itemTypeFindManyMock.mockReset();
    itemCollectionDeleteManyMock.mockReset();
    prismaTransactionMock.mockReset();
  });

  it("builds a summary with type counts, latest update, and fallback description", () => {
    const summary = buildCollectionSummary({
      id: "collection-1",
      name: "DevOps",
      description: null,
      isFavorite: true,
      updatedAt: new Date("2026-04-10T08:00:00.000Z"),
      items: [
        {
          item: {
            updatedAt: new Date("2026-04-12T10:00:00.000Z"),
            itemType: {
              id: "type-command",
              name: "command",
              icon: "Terminal",
              color: "#f97316",
            },
          },
        },
        {
          item: {
            updatedAt: new Date("2026-04-11T09:00:00.000Z"),
            itemType: {
              id: "type-link",
              name: "link",
              icon: "Link",
              color: "#10b981",
            },
          },
        },
        {
          item: {
            updatedAt: new Date("2026-04-11T11:00:00.000Z"),
            itemType: {
              id: "type-command",
              name: "command",
              icon: "Terminal",
              color: "#f97316",
            },
          },
        },
      ],
    });

    expect(summary).toEqual({
      id: "collection-1",
      name: "DevOps",
      description: "No description yet.",
      isFavorite: true,
      itemCount: 3,
      typeCount: 2,
      updatedAt: "2026-04-12T10:00:00.000Z",
      dominantTypeColor: "#f97316",
      itemTypes: [
        {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
          itemCount: 2,
        },
        {
          id: "type-link",
          name: "link",
          icon: "Link",
          color: "#10b981",
          itemCount: 1,
        },
      ],
    });
  });

  it("sorts equally common types by name", () => {
    const summary = buildCollectionSummary({
      id: "collection-2",
      name: "Frontend",
      description: "UI patterns",
      isFavorite: false,
      updatedAt: new Date("2026-04-10T08:00:00.000Z"),
      items: [
        {
          item: {
            updatedAt: new Date("2026-04-10T08:00:00.000Z"),
            itemType: {
              id: "type-snippet",
              name: "snippet",
              icon: "Code",
              color: "#3b82f6",
            },
          },
        },
        {
          item: {
            updatedAt: new Date("2026-04-10T08:00:00.000Z"),
            itemType: {
              id: "type-note",
              name: "note",
              icon: "StickyNote",
              color: "#fde047",
            },
          },
        },
      ],
    });

    expect(summary.itemTypes.map((itemType) => itemType.name)).toEqual(["note", "snippet"]);
    expect(summary.dominantTypeColor).toBe("#fde047");
  });

  it("maps a collection detail item into the dashboard item shape", () => {
    const item = mapCollectionDetailItem(
      {
        id: "collection-1",
        name: "DevOps",
      },
      {
        id: "item-1",
        title: "Deploy to Production",
        description: null,
        fileName: "deploy.sh",
        fileSize: 2048,
        isFavorite: true,
        isPinned: false,
        createdAt: new Date("2026-04-10T08:00:00.000Z"),
        updatedAt: new Date("2026-04-12T10:00:00.000Z"),
        tags: [{ name: "ci" }, { name: "deploy" }],
        itemType: {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
        },
      }
    );

    expect(item).toEqual({
      id: "item-1",
      title: "Deploy to Production",
      description: "No description yet.",
      fileName: "deploy.sh",
      fileSize: 2048,
      isFavorite: true,
      isPinned: false,
      createdAt: "2026-04-10T08:00:00.000Z",
      updatedAt: "2026-04-12T10:00:00.000Z",
      tags: ["ci", "deploy"],
      itemType: {
        id: "type-command",
        name: "command",
        icon: "Terminal",
        color: "#f97316",
      },
      collection: {
        id: "collection-1",
        name: "DevOps",
      },
    });
  });

  it("maps a global search collection with keywords and counts", () => {
    const collection = mapGlobalSearchCollection({
      id: "collection-1",
      name: "DevOps",
      description: "Deployment commands",
      isFavorite: false,
      itemCount: 3,
      typeCount: 2,
      updatedAt: "2026-04-12T10:00:00.000Z",
      dominantTypeColor: "#f97316",
      itemTypes: [
        {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
          itemCount: 2,
        },
        {
          id: "type-link",
          name: "link",
          icon: "Link",
          color: "#10b981",
          itemCount: 1,
        },
      ],
    });

    expect(collection).toEqual({
      id: "collection-1",
      name: "DevOps",
      itemCount: 3,
      itemTypes: [
        {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
          itemCount: 2,
        },
        {
          id: "type-link",
          name: "link",
          icon: "Link",
          color: "#10b981",
          itemCount: 1,
        },
      ],
      searchText: "DevOps Deployment commands command link",
    });
  });

  it("returns favorite dashboard collections sorted by updatedAt", async () => {
    getDashboardUserMock.mockResolvedValue({
      id: "user-1",
    });
    collectionFindManyMock.mockResolvedValue([
      {
        id: "collection-1",
        name: "DevOps",
        description: null,
        isFavorite: true,
        updatedAt: new Date("2026-04-10T08:00:00.000Z"),
        items: [
          {
            item: {
              updatedAt: new Date("2026-04-12T10:00:00.000Z"),
              itemType: {
                id: "type-command",
                name: "command",
                icon: "Terminal",
                color: "#f97316",
              },
            },
          },
        ],
      },
      {
        id: "collection-2",
        name: "Archived",
        description: null,
        isFavorite: false,
        updatedAt: new Date("2026-04-14T08:00:00.000Z"),
        items: [],
      },
    ]);

    const result = await getFavoriteDashboardCollections();

    expect(collectionFindManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
      },
      select: expect.any(Object),
    });
    expect(result).toEqual([
      {
        id: "collection-1",
        name: "DevOps",
        description: "No description yet.",
        isFavorite: true,
        itemCount: 1,
        typeCount: 1,
        updatedAt: "2026-04-12T10:00:00.000Z",
        dominantTypeColor: "#f97316",
        itemTypes: [
          {
            id: "type-command",
            name: "command",
            icon: "Terminal",
            color: "#f97316",
            itemCount: 1,
          },
        ],
      },
    ]);
  });

  it("returns paginated collection detail without fetching every item", async () => {
    getDashboardUserMock.mockResolvedValue({
      id: "user-1",
    });
    collectionFindFirstMock.mockResolvedValue({
      id: "collection-1",
      name: "DevOps",
      description: null,
      isFavorite: true,
      updatedAt: new Date("2026-04-10T08:00:00.000Z"),
    });
    itemCountMock.mockResolvedValue(25);
    itemFindFirstMock.mockResolvedValue({
      updatedAt: new Date("2026-04-12T10:00:00.000Z"),
    });
    itemGroupByMock.mockResolvedValue([
      {
        itemTypeId: "type-command",
        _count: {
          _all: 25,
        },
      },
    ]);
    itemTypeFindManyMock.mockResolvedValue([
      {
        id: "type-command",
        name: "command",
        icon: "Terminal",
        color: "#f97316",
      },
    ]);
    itemFindManyMock.mockResolvedValue([
      {
        id: "item-22",
        title: "Deploy command",
        description: null,
        fileName: null,
        fileSize: null,
        isFavorite: false,
        isPinned: false,
        createdAt: new Date("2026-04-12T10:00:00.000Z"),
        updatedAt: new Date("2026-04-12T10:00:00.000Z"),
        tags: [{ name: "deploy" }],
        itemType: {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
        },
      },
    ]);

    const result = await getCollectionDetailById("collection-1", 2, 21);

    expect(itemFindManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        collections: {
          some: {
            collectionId: "collection-1",
          },
        },
      },
      select: expect.any(Object),
      skip: 21,
      take: 21,
      orderBy: [
        {
          isPinned: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
    });
    expect(result?.pagination).toEqual({
      currentPage: 2,
      totalPages: 2,
      totalItems: 25,
      perPage: 21,
      offset: 21,
      hasPreviousPage: true,
      hasNextPage: false,
    });
    expect(result?.itemCount).toBe(25);
    expect(result?.updatedAt).toBe("2026-04-12T10:00:00.000Z");
    expect(result?.itemTypes).toEqual([
      {
        id: "type-command",
        name: "command",
        icon: "Terminal",
        color: "#f97316",
        itemCount: 25,
      },
    ]);
    expect(result?.items[0]?.collection).toEqual({
      id: "collection-1",
      name: "DevOps",
    });
  });

  it("updates an owned collection", async () => {
    collectionFindFirstMock.mockResolvedValue({
      id: "collection-1",
    });
    collectionUpdateMock.mockResolvedValue({
      id: "collection-1",
      name: "Frontend",
      description: "UI patterns",
      isFavorite: false,
      createdAt: new Date("2026-04-10T08:00:00.000Z"),
      updatedAt: new Date("2026-04-12T10:00:00.000Z"),
    });

    const result = await updateCollection("user-1", "collection-1", {
      name: "Frontend",
      description: "UI patterns",
    });

    expect(collectionFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: "collection-1",
        userId: "user-1",
      },
      select: {
        id: true,
      },
    });
    expect(collectionUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "collection-1",
      },
      data: {
        name: "Frontend",
        description: "UI patterns",
      },
      select: {
        id: true,
        name: true,
        description: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(result).toEqual({
      id: "collection-1",
      name: "Frontend",
      description: "UI patterns",
      isFavorite: false,
      createdAt: "2026-04-10T08:00:00.000Z",
      updatedAt: "2026-04-12T10:00:00.000Z",
    });
  });

  it("does not update a collection the user does not own", async () => {
    collectionFindFirstMock.mockResolvedValue(null);

    const result = await updateCollection("user-1", "collection-1", {
      name: "Frontend",
      description: null,
    });

    expect(collectionUpdateMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("deletes join rows before deleting an owned collection", async () => {
    prismaTransactionMock.mockImplementation(async (callback) =>
      callback({
        collection: {
          findFirst: collectionFindFirstMock,
          delete: collectionDeleteMock,
        },
        itemCollection: {
          deleteMany: itemCollectionDeleteManyMock,
        },
      }),
    );
    collectionFindFirstMock.mockResolvedValue({
      id: "collection-1",
    });

    const result = await deleteCollection("user-1", "collection-1");

    expect(itemCollectionDeleteManyMock).toHaveBeenCalledWith({
      where: {
        collectionId: "collection-1",
      },
    });
    expect(collectionDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "collection-1",
      },
    });
    expect(result).toBe(true);
  });

  it("does not delete when the collection is not owned by the user", async () => {
    prismaTransactionMock.mockImplementation(async (callback) =>
      callback({
        collection: {
          findFirst: collectionFindFirstMock,
          delete: collectionDeleteMock,
        },
        itemCollection: {
          deleteMany: itemCollectionDeleteManyMock,
        },
      }),
    );
    collectionFindFirstMock.mockResolvedValue(null);

    const result = await deleteCollection("user-1", "collection-1");

    expect(itemCollectionDeleteManyMock).not.toHaveBeenCalled();
    expect(collectionDeleteMock).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
