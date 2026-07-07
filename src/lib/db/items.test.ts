import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  collectionFindManyMock,
  getDashboardUserMock,
  itemCountMock,
  itemCreateMock,
  itemDeleteManyMock,
  itemFindFirstMock,
  itemFindManyMock,
  itemTypeFindFirstMock,
  itemTypeFindManyMock,
  itemUpdateMock,
  prismaTransactionMock,
} = vi.hoisted(() => ({
  collectionFindManyMock: vi.fn(),
  getDashboardUserMock: vi.fn(),
  itemCountMock: vi.fn(),
  itemCreateMock: vi.fn(),
  itemDeleteManyMock: vi.fn(),
  itemFindFirstMock: vi.fn(),
  itemFindManyMock: vi.fn(),
  itemTypeFindFirstMock: vi.fn(),
  itemTypeFindManyMock: vi.fn(),
  itemUpdateMock: vi.fn(),
  prismaTransactionMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      count: itemCountMock,
      findMany: itemFindManyMock,
      findFirst: itemFindFirstMock,
      deleteMany: itemDeleteManyMock,
      create: itemCreateMock,
      update: itemUpdateMock,
    },
    itemType: {
      findMany: itemTypeFindManyMock,
      findFirst: itemTypeFindFirstMock,
    },
    collection: {
      findMany: collectionFindManyMock,
    },
    $transaction: prismaTransactionMock,
    $count: vi.fn(),
  },
}));

vi.mock("@/lib/db/dashboard-user", () => ({
  getDashboardUser: getDashboardUserMock,
}));

import {
  getFavoriteDashboardItems,
  getGlobalSearchItemPreview,
  getItemsByTypeSlug,
  mapGlobalSearchItem,
} from "@/lib/db/items";

describe("item db helpers", () => {
  beforeEach(() => {
    collectionFindManyMock.mockReset();
    getDashboardUserMock.mockReset();
    itemCountMock.mockReset();
    itemCreateMock.mockReset();
    itemDeleteManyMock.mockReset();
    itemFindFirstMock.mockReset();
    itemFindManyMock.mockReset();
    itemTypeFindFirstMock.mockReset();
    itemTypeFindManyMock.mockReset();
    itemUpdateMock.mockReset();
    prismaTransactionMock.mockReset();
  });

  it("builds a preview from description, content, url, or file name", () => {
    expect(
      getGlobalSearchItemPreview({
        description: "  Primary preview text  ",
        content: "const x = 1;",
        url: "https://example.com",
        fileName: "script.ts",
      }),
    ).toBe("Primary preview text");

    expect(
      getGlobalSearchItemPreview({
        description: null,
        content: "const value = 1;\nconsole.log(value);",
        url: null,
        fileName: null,
      }),
    ).toBe("const value = 1; console.log(value);");

    expect(
      getGlobalSearchItemPreview({
        description: null,
        content: null,
        url: null,
        fileName: null,
      }),
    ).toBe("No preview available.");
  });

  it("maps a global search item with preview text and keywords", () => {
    const item = mapGlobalSearchItem({
      id: "item-1",
      title: "Deploy command",
      description: null,
      content: "pnpm deploy --prod",
      url: null,
      fileName: null,
      fileSize: null,
      isFavorite: true,
      isPinned: false,
      createdAt: new Date("2026-04-10T08:00:00.000Z"),
      updatedAt: new Date("2026-04-12T10:00:00.000Z"),
      tags: [{ name: "deploy" }, { name: "ops" }],
      itemType: {
        id: "type-command",
        name: "command",
        icon: "Terminal",
        color: "#f97316",
      },
      collections: [
        {
          addedAt: new Date("2026-04-11T09:00:00.000Z"),
          collection: {
            id: "collection-1",
            name: "DevOps",
          },
        },
      ],
    });

    expect(item.description).toBe("pnpm deploy --prod");
    expect(item.collection).toEqual({
      id: "collection-1",
      name: "DevOps",
    });
    expect(item.searchText).toContain("Deploy command");
    expect(item.searchText).toContain("command");
    expect(item.searchText).toContain("pnpm deploy --prod");
    expect(item.searchText).toContain("deploy ops");
    expect(item.searchText).toContain("DevOps");
  });

  it("returns paginated items for a system item type", async () => {
    getDashboardUserMock.mockResolvedValue({
      id: "user-1",
    });
    itemTypeFindManyMock.mockResolvedValue([
      {
        id: "type-snippet",
        name: "snippet",
        icon: "Code",
        color: "#3b82f6",
      },
    ]);
    itemCountMock.mockResolvedValue(25);
    itemFindManyMock.mockResolvedValue([
      {
        id: "item-22",
        title: "Second page item",
        description: "Stored snippet",
        fileName: null,
        fileSize: null,
        isFavorite: false,
        isPinned: false,
        createdAt: new Date("2026-04-12T10:00:00.000Z"),
        updatedAt: new Date("2026-04-12T10:00:00.000Z"),
        tags: [{ name: "ts" }],
        itemType: {
          id: "type-snippet",
          name: "snippet",
          icon: "Code",
          color: "#3b82f6",
        },
        collections: [],
      },
    ]);

    const result = await getItemsByTypeSlug("snippets", 2, 21);

    expect(itemCountMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        itemTypeId: "type-snippet",
      },
    });
    expect(itemFindManyMock).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        itemTypeId: "type-snippet",
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
    expect(result?.items).toHaveLength(1);
    expect(result?.itemType.slug).toBe("snippets");
  });

  it("returns favorite dashboard items sorted by updatedAt", async () => {
    getDashboardUserMock.mockResolvedValue({
      id: "user-1",
    });
    itemFindManyMock.mockResolvedValue([
      {
        id: "item-1",
        title: "Deploy command",
        description: null,
        fileName: null,
        fileSize: null,
        isFavorite: true,
        isPinned: false,
        createdAt: new Date("2026-04-10T08:00:00.000Z"),
        updatedAt: new Date("2026-04-12T10:00:00.000Z"),
        tags: [{ name: "deploy" }],
        itemType: {
          id: "type-command",
          name: "command",
          icon: "Terminal",
          color: "#f97316",
        },
        collections: [
          {
            addedAt: new Date("2026-04-11T09:00:00.000Z"),
            collection: {
              id: "collection-1",
              name: "DevOps",
            },
          },
        ],
      },
    ]);

    const result = await getFavoriteDashboardItems();

    expect(itemFindManyMock).toHaveBeenCalledWith({
      where: {
        isFavorite: true,
        userId: "user-1",
      },
      select: expect.any(Object),
      orderBy: {
        updatedAt: "desc",
      },
    });
    expect(result).toEqual([
      {
        id: "item-1",
        title: "Deploy command",
        description: "No description yet.",
        fileName: null,
        fileSize: null,
        isFavorite: true,
        isPinned: false,
        createdAt: "2026-04-10T08:00:00.000Z",
        updatedAt: "2026-04-12T10:00:00.000Z",
        tags: ["deploy"],
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
      },
    ]);
  });
});
