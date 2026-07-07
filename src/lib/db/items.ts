import { ContentType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import {
  DASHBOARD_RECENT_ITEMS_LIMIT,
  getPaginationState,
  ITEMS_PER_PAGE,
  type PaginationState,
} from "@/lib/pagination";

interface CollectionLookupClient {
  collection: {
    findMany: typeof prisma.collection.findMany;
  };
}

export type DashboardItemCollection = {
  id: string;
  name: string;
};

export type DashboardItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export interface DashboardItem {
  id: string;
  title: string;
  description: string;
  fileName: string | null;
  fileSize: number | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  itemType: DashboardItemType;
  collection: DashboardItemCollection | null;
}

export interface GlobalSearchItem extends DashboardItem {
  searchText: string;
}

export interface ItemDrawerCollection {
  id: string;
  name: string;
}

export interface ItemDrawerDetail {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileUrl: string | null;
  url: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  language: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  itemType: DashboardItemType;
  collections: ItemDrawerCollection[];
}

export interface ItemTypeSummary {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface ItemsByTypeResult {
  itemType: ItemTypeSummary;
  items: DashboardItem[];
  pagination: PaginationState;
}

export interface DashboardStats {
  itemCount: number;
  collectionCount: number;
  favoriteItemCount: number;
  favoriteCollectionCount: number;
}

export interface SidebarItemType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
}

export interface UpdateItemInput {
  title: string;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  language?: string | null;
  tags: string[];
  collectionIds: string[];
}

export interface CreateItemInput {
  itemType: "snippet" | "prompt" | "command" | "note" | "file" | "image" | "link";
  title: string;
  description?: string | null;
  content?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
  url?: string | null;
  language?: string | null;
  tags: string[];
  collectionIds: string[];
}

const ITEM_CONTENT_TYPES: Partial<Record<CreateItemInput["itemType"], ContentType>> = {
  file: ContentType.FILE,
  image: ContentType.FILE,
  link: ContentType.URL,
};

export const deleteItem = async (itemId: string, userId: string): Promise<boolean> => {
  const result = await prisma.item.deleteMany({
    where: {
      id: itemId,
      userId,
    },
  });

  return result.count > 0;
};

const capitalize = (value: string) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
export const getItemTypeSlug = (name: string) => `${name.toLowerCase()}s`;
export const getItemTypeLabel = (name: string) => `${capitalize(name)}s`;

const buildTagConnections = (tags: string[]) =>
  tags.map((tag) => ({
    where: {
      name: tag,
    },
    create: {
      name: tag,
    },
  }));

const getCreateItemContentType = (itemType: CreateItemInput["itemType"]) =>
  ITEM_CONTENT_TYPES[itemType] ?? ContentType.TEXT;

const getItemCollectionConnections = (collectionIds: string[]) => ({
  create: collectionIds.map((collectionId) => ({
    collection: {
      connect: {
        id: collectionId,
      },
    },
  })),
});

const getCreateItemData = (userId: string, itemTypeId: string, data: CreateItemInput) => ({
  userId,
  itemTypeId,
  title: data.title,
  description: data.description ?? null,
  contentType: getCreateItemContentType(data.itemType),
  content: data.itemType === "link" || data.itemType === "file" || data.itemType === "image"
    ? null
    : (data.content ?? null),
  fileName: data.itemType === "file" || data.itemType === "image" ? (data.fileName ?? null) : null,
  fileSize: data.itemType === "file" || data.itemType === "image" ? (data.fileSize ?? null) : null,
  fileUrl: data.itemType === "file" || data.itemType === "image" ? (data.fileUrl ?? null) : null,
  url: data.itemType === "link" ? (data.url ?? null) : null,
  language: data.itemType === "snippet" || data.itemType === "command"
    ? (data.language ?? null)
    : null,
  tags: {
    connectOrCreate: buildTagConnections(data.tags),
  },
  collections: getItemCollectionConnections(data.collectionIds),
});

const findSystemItemType = async (name: CreateItemInput["itemType"]) =>
  prisma.itemType.findFirst({
    where: {
      name,
      isSystem: true,
    },
    select: {
      id: true,
    },
  });

const getOwnedCollectionIds = async (
  tx: CollectionLookupClient,
  userId: string,
  collectionIds: string[],
) => {
  if (collectionIds.length === 0) {
    return [];
  }

  const collections = await tx.collection.findMany({
    where: {
      userId,
      id: {
        in: collectionIds,
      },
    },
    select: {
      id: true,
    },
  });

  return collectionIds.filter((collectionId) =>
    collections.some((collection) => collection.id === collectionId)
  );
};

type DashboardItemBaseInput = {
  id: string;
  title: string;
  description: string | null;
  fileName: string | null;
  fileSize: number | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { name: string }[];
  itemType: DashboardItemType;
};

export const mapDashboardItemBase = (
  item: DashboardItemBaseInput,
  collection: DashboardItemCollection | null,
): DashboardItem => ({
  id: item.id,
  title: item.title,
  description: item.description ?? "No description yet.",
  fileName: item.fileName ?? null,
  fileSize: item.fileSize ?? null,
  isFavorite: item.isFavorite,
  isPinned: item.isPinned,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
  tags: item.tags.map((tag) => tag.name),
  itemType: item.itemType,
  collection,
});

const mapDashboardItem = (item: DashboardItemBaseInput & {
  collections: {
    addedAt: Date;
    collection: DashboardItemCollection;
  }[];
}): DashboardItem => {
  const [primaryCollection] = [...item.collections].sort(
    (left, right) => left.addedAt.getTime() - right.addedAt.getTime()
  );

  return mapDashboardItemBase(item, primaryCollection?.collection ?? null);
};

const getSearchTextPart = (value: string | null | undefined, limit = 500) =>
  value?.replace(/\s+/g, " ").trim().slice(0, limit) ?? "";

export const getGlobalSearchItemPreview = (item: {
  description: string | null;
  content: string | null;
  url: string | null;
  fileName: string | null;
}) => {
  const preview = getSearchTextPart(item.description, 160)
    || getSearchTextPart(item.content, 160)
    || getSearchTextPart(item.url, 160)
    || getSearchTextPart(item.fileName, 160);

  return preview || "No preview available.";
};

export const mapGlobalSearchItem = (item: {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  isFavorite: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags: { name: string }[];
  itemType: DashboardItemType;
  collections: {
    addedAt: Date;
    collection: DashboardItemCollection;
  }[];
}): GlobalSearchItem => {
  const dashboardItem = mapDashboardItem({
    ...item,
    description: getGlobalSearchItemPreview(item),
  });

  const searchText = [
    item.title,
    item.itemType.name,
    getSearchTextPart(item.description),
    getSearchTextPart(item.content),
    getSearchTextPart(item.url),
    getSearchTextPart(item.fileName),
    item.tags.map((tag) => tag.name).join(" "),
    item.collections.map(({ collection }) => collection.name).join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ...dashboardItem,
    searchText,
  };
};

const mapItemDrawerDetail = (item: {
  id: string;
  title: string;
  description: string | null;
  contentType: "TEXT" | "FILE" | "URL";
  content: string | null;
  fileName: string | null;
  fileSize: number | null;
  fileUrl: string | null;
  url: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  language: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: { name: string }[];
  itemType: DashboardItemType;
  collections: {
    collection: ItemDrawerCollection;
  }[];
}): ItemDrawerDetail => ({
  id: item.id,
  title: item.title,
  description: item.description,
  contentType: item.contentType,
  content: item.content,
  fileName: item.fileName,
  fileSize: item.fileSize,
  fileUrl: item.fileUrl,
  url: item.url,
  isFavorite: item.isFavorite,
  isPinned: item.isPinned,
  language: item.language,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
  tags: item.tags.map((tag) => tag.name),
  itemType: item.itemType,
  collections: item.collections.map(({ collection }) => collection),
});

const itemDrawerDetailSelect = {
  id: true,
  title: true,
  description: true,
  contentType: true,
  content: true,
  fileName: true,
  fileSize: true,
  fileUrl: true,
  url: true,
  isFavorite: true,
  isPinned: true,
  language: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: {
      name: true,
    },
  },
  itemType: {
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  },
  collections: {
    select: {
      collection: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      addedAt: "asc" as const,
    },
  },
};

export const itemTypeSummarySelect = {
  id: true,
  name: true,
  icon: true,
  color: true,
} as const;

export const dashboardItemCoreSelect = {
  id: true,
  title: true,
  description: true,
  fileName: true,
  fileSize: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: {
      name: true,
    },
  },
  itemType: {
    select: itemTypeSummarySelect,
  },
} as const;

const dashboardItemSelect = {
  ...dashboardItemCoreSelect,
  collections: {
    select: {
      addedAt: true,
      collection: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

const globalSearchItemSelect = {
  id: true,
  title: true,
  description: true,
  content: true,
  url: true,
  fileName: true,
  fileSize: true,
  isFavorite: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  tags: {
    select: {
      name: true,
    },
  },
  itemType: {
    select: itemTypeSummarySelect,
  },
  collections: {
    select: {
      addedAt: true,
      collection: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

const getDashboardItems = async ({
  isPinned,
  isFavorite,
  limit,
}: {
  isPinned?: boolean;
  isFavorite?: boolean;
  limit?: number;
} = {}) => {
  const user = await getDashboardUser();

  if (!user) {
    return [];
  }

  return prisma.item.findMany({
    where: {
      ...(typeof isPinned === "boolean" ? { isPinned } : {}),
      ...(typeof isFavorite === "boolean" ? { isFavorite } : {}),
      userId: user.id,
    },
    select: dashboardItemSelect,
    ...(typeof limit === "number" ? { take: limit } : {}),
    orderBy: {
      updatedAt: "desc",
    },
  });
};

export const getPinnedDashboardItems = async (): Promise<DashboardItem[]> => {
  const items = await getDashboardItems({ isPinned: true });

  return items.map(mapDashboardItem);
};

export const getRecentDashboardItems = async (
  limit = DASHBOARD_RECENT_ITEMS_LIMIT
): Promise<DashboardItem[]> => {
  const items = await getDashboardItems({ limit });

  return items.map(mapDashboardItem);
};

export const getFavoriteDashboardItems = async (): Promise<DashboardItem[]> => {
  const items = await getDashboardItems({ isFavorite: true });

  return items.map(mapDashboardItem);
};

export const getGlobalSearchItems = async (userId: string): Promise<GlobalSearchItem[]> => {
  const items = await prisma.item.findMany({
    where: {
      userId,
    },
    select: globalSearchItemSelect,
    orderBy: {
      updatedAt: "desc",
    },
  });

  return items.map(mapGlobalSearchItem);
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const user = await getDashboardUser();

  if (!user) {
    return {
      itemCount: 0,
      collectionCount: 0,
      favoriteItemCount: 0,
      favoriteCollectionCount: 0,
    };
  }

  const [itemCount, collectionCount, favoriteItemCount, favoriteCollectionCount] =
    await Promise.all([
      prisma.item.count({
        where: {
          userId: user.id,
        },
      }),
      prisma.collection.count({
        where: {
          userId: user.id,
        },
      }),
      prisma.item.count({
        where: {
          userId: user.id,
          isFavorite: true,
        },
      }),
      prisma.collection.count({
        where: {
          userId: user.id,
          isFavorite: true,
        },
      }),
    ]);

  return {
    itemCount,
    collectionCount,
    favoriteItemCount,
    favoriteCollectionCount,
  };
};

const SIDEBAR_ITEM_TYPE_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
] as const;

export const getSidebarItemTypes = async (): Promise<SidebarItemType[]> => {
  const user = await getDashboardUser();

  const itemTypes = await prisma.itemType.findMany({
    where: {
      isSystem: true,
    },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
      _count: {
        select: {
          items: user
            ? {
                where: {
                  userId: user.id,
                },
              }
            : true,
        },
      },
    },
  });

  return itemTypes
    .sort((left, right) => {
      const leftIndex = SIDEBAR_ITEM_TYPE_ORDER.indexOf(
        left.name as (typeof SIDEBAR_ITEM_TYPE_ORDER)[number]
      );
      const rightIndex = SIDEBAR_ITEM_TYPE_ORDER.indexOf(
        right.name as (typeof SIDEBAR_ITEM_TYPE_ORDER)[number]
      );

      if (leftIndex === -1 || rightIndex === -1) {
        return left.name.localeCompare(right.name);
      }

      return leftIndex - rightIndex;
    })
    .map((itemType) => ({
      id: itemType.id,
      name: getItemTypeLabel(itemType.name),
      slug: getItemTypeSlug(itemType.name),
      icon: itemType.icon,
      color: itemType.color,
      count: user ? itemType._count.items : 0,
    }));
};

export const getItemDrawerDetail = async (
  itemId: string,
  userId: string
): Promise<ItemDrawerDetail | null> => {
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      userId,
    },
    select: itemDrawerDetailSelect,
  });

  return item ? mapItemDrawerDetail(item) : null;
};

export const createItem = async (
  userId: string,
  data: CreateItemInput
): Promise<ItemDrawerDetail | null> => {
  const itemType = await findSystemItemType(data.itemType);

  if (!itemType) {
    return null;
  }

  const ownedCollectionIds = await getOwnedCollectionIds(prisma, userId, data.collectionIds);

  const item = await prisma.item.create({
    data: getCreateItemData(userId, itemType.id, {
      ...data,
      collectionIds: ownedCollectionIds,
    }),
    select: itemDrawerDetailSelect,
  });

  return mapItemDrawerDetail(item);
};

export const updateItem = async (
  itemId: string,
  userId: string,
  data: UpdateItemInput
): Promise<ItemDrawerDetail | null> => {
  const scalarData = {
    title: data.title,
    ...(Object.prototype.hasOwnProperty.call(data, "description")
      ? { description: data.description ?? null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "content")
      ? { content: data.content ?? null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "url")
      ? { url: data.url ?? null }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(data, "language")
      ? { language: data.language ?? null }
      : {}),
  };

  const item = await prisma.$transaction(async (tx) => {
    const ownedCollectionIds = await getOwnedCollectionIds(tx, userId, data.collectionIds);
    const existingItem = await tx.item.findUnique({
      where: {
        id: itemId,
      },
      select: {
        id: true,
      },
    });

    if (!existingItem) {
      return null;
    }

    await tx.item.update({
      where: {
        id: itemId,
      },
      data: {
        ...scalarData,
        tags: {
          set: [],
        },
        collections: {
          deleteMany: {},
        },
      },
    });

    const updatedItem = await tx.item.update({
      where: {
        id: itemId,
      },
      data: {
        tags: {
          connectOrCreate: buildTagConnections(data.tags),
        },
        collections: getItemCollectionConnections(ownedCollectionIds),
      },
      select: itemDrawerDetailSelect,
    });

    return updatedItem;
  });

  return item ? mapItemDrawerDetail(item) : null;
};

export const setItemFavoriteState = async (
  itemId: string,
  userId: string,
  isFavorite: boolean,
): Promise<ItemDrawerDetail | null> => {
  const existingItem = await prisma.item.findFirst({
    where: {
      id: itemId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existingItem) {
    return null;
  }

  const item = await prisma.item.update({
    where: {
      id: itemId,
    },
    data: {
      isFavorite,
    },
    select: itemDrawerDetailSelect,
  });

  return mapItemDrawerDetail(item);
};

export const setItemPinnedState = async (
  itemId: string,
  userId: string,
  isPinned: boolean,
): Promise<ItemDrawerDetail | null> => {
  const existingItem = await prisma.item.findFirst({
    where: {
      id: itemId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existingItem) {
    return null;
  }

  const item = await prisma.item.update({
    where: {
      id: itemId,
    },
    data: {
      isPinned,
    },
    select: itemDrawerDetailSelect,
  });

  return mapItemDrawerDetail(item);
};

export const getItemsByTypeSlug = async (
  slug: string,
  page = 1,
  perPage = ITEMS_PER_PAGE,
): Promise<ItemsByTypeResult | null> => {
  const user = await getDashboardUser();

  if (!user) {
    return null;
  }

  const itemTypes = await prisma.itemType.findMany({
    where: {
      isSystem: true,
    },
    select: itemTypeSummarySelect,
  });

  const matchedItemType = itemTypes.find((itemType) => getItemTypeSlug(itemType.name) === slug);

  if (!matchedItemType) {
    return null;
  }

  const totalItems = await prisma.item.count({
    where: {
      userId: user.id,
      itemTypeId: matchedItemType.id,
    },
  });
  const pagination = getPaginationState({
    currentPage: page,
    perPage,
    totalItems,
  });

  const items = await prisma.item.findMany({
    where: {
      userId: user.id,
      itemTypeId: matchedItemType.id,
    },
    select: dashboardItemSelect,
    skip: pagination.offset,
    take: pagination.perPage,
    orderBy: [
      {
        isPinned: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
  });

  return {
    itemType: {
      ...matchedItemType,
      slug,
    },
    items: items.map(mapDashboardItem),
    pagination,
  };
};
