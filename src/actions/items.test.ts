import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  canCreateItemForPlanMock,
  createItemRecordMock,
  deleteItemRecordMock,
  deleteR2ObjectMock,
  getBillingStateMock,
  getItemDrawerDetailMock,
  setItemFavoriteStateRecordMock,
  setItemPinnedStateRecordMock,
  updateItemRecordMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  canCreateItemForPlanMock: vi.fn(),
  createItemRecordMock: vi.fn(),
  deleteItemRecordMock: vi.fn(),
  deleteR2ObjectMock: vi.fn(),
  getBillingStateMock: vi.fn(),
  getItemDrawerDetailMock: vi.fn(),
  setItemFavoriteStateRecordMock: vi.fn(),
  setItemPinnedStateRecordMock: vi.fn(),
  updateItemRecordMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/billing/guards", () => ({
  canCreateItemForPlan: canCreateItemForPlanMock,
}));

vi.mock("@/lib/db/billing", () => ({
  getBillingState: getBillingStateMock,
}));

vi.mock("@/lib/db/items", () => ({
  createItem: createItemRecordMock,
  deleteItem: deleteItemRecordMock,
  getItemDrawerDetail: getItemDrawerDetailMock,
  setItemFavoriteState: setItemFavoriteStateRecordMock,
  setItemPinnedState: setItemPinnedStateRecordMock,
  updateItem: updateItemRecordMock,
}));

vi.mock("@/lib/files/upload", () => ({
  getObjectKeyFromFileUrl: (fileUrl: string) =>
    fileUrl === "https://files.example.com/users/user-1/file/file.txt"
      ? "users/user-1/file/file.txt"
      : fileUrl === "https://files.example.com/users/user-1/file/spec.pdf"
        ? "users/user-1/file/spec.pdf"
      : fileUrl === "https://files.example.com/users/other-user/file/file.txt"
        ? "users/other-user/file/file.txt"
        : null,
}));

vi.mock("@/lib/files/r2", () => ({
  deleteR2Object: deleteR2ObjectMock,
}));

import {
  createItem,
  deleteItem,
  toggleItemFavorite,
  toggleItemPin,
  updateItem,
} from "@/actions/items";

describe("createItem action", () => {
  beforeEach(() => {
    authMock.mockReset();
    canCreateItemForPlanMock.mockReset();
    createItemRecordMock.mockReset();
    deleteItemRecordMock.mockReset();
    deleteR2ObjectMock.mockReset();
    getBillingStateMock.mockReset();
    getItemDrawerDetailMock.mockReset();
    setItemFavoriteStateRecordMock.mockReset();
    setItemPinnedStateRecordMock.mockReset();
    updateItemRecordMock.mockReset();
    canCreateItemForPlanMock.mockReturnValue({ allowed: true });
  });

  it("rejects unauthenticated create requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await createItem({
      itemType: "snippet",
      title: "New item",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to create items.",
    });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid payloads", async () => {
    const result = await createItem({
      itemType: "link",
      title: "   ",
      url: "not-a-url",
      tags: [],
      collectionIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        title: ["Title is required."],
        url: ["Enter a valid URL."],
      },
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("normalizes optional values and deduplicates tags before creating", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      itemCount: 10,
    });
    createItemRecordMock.mockResolvedValue({
      id: "item-1",
      title: "New item",
    });

    const result = await createItem({
      itemType: "command",
      title: "  New item  ",
      description: "   ",
      content: "  npm run lint  ",
      language: "  Bash  ",
      tags: ["react", "react", " prisma "],
      collectionIds: ["collection-1", "collection-1", "collection-2"],
    });

    expect(createItemRecordMock).toHaveBeenCalledWith("user-1", {
      itemType: "command",
      title: "New item",
      description: null,
      content: "npm run lint",
      language: "Bash",
      tags: ["react", "prisma"],
      collectionIds: ["collection-1", "collection-2"],
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        title: "New item",
      },
    });
  });

  it("requires uploaded file fields for file items", async () => {
    const result = await createItem({
      itemType: "file",
      title: "Docs",
      tags: [],
      collectionIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        fileName: ["File name is required."],
        fileSize: ["File size is required."],
        fileUrl: ["A file upload is required."],
      },
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("passes uploaded file metadata through for file items", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 10,
    });
    createItemRecordMock.mockResolvedValue({
      id: "item-1",
      title: "API Spec",
    });

    await createItem({
      itemType: "file",
      title: " API Spec ",
      fileName: " api-spec.pdf ",
      fileSize: 2048,
      fileUrl: " https://files.example.com/users/user-1/file/spec.pdf ",
      tags: [],
      collectionIds: ["collection-7"],
    });

    expect(createItemRecordMock).toHaveBeenCalledWith("user-1", {
      itemType: "file",
      title: "API Spec",
      fileName: "api-spec.pdf",
      fileSize: 2048,
      fileUrl: "https://files.example.com/users/user-1/file/spec.pdf",
      tags: [],
      collectionIds: ["collection-7"],
    });
  });

  it("rejects uploaded file URLs outside the current user's namespace", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });

    const result = await createItem({
      itemType: "file",
      title: "API Spec",
      fileName: "api-spec.pdf",
      fileSize: 2048,
      fileUrl: "https://files.example.com/users/other-user/file/file.txt",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({
      success: false,
      error: {
        message: "Please fix the highlighted fields.",
        fieldErrors: {
          fileUrl: ["Uploaded file must belong to your storage bucket."],
        },
      },
    });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("blocks file item creation for free users", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      itemCount: 10,
    });
    canCreateItemForPlanMock.mockReturnValue({
      allowed: false,
      message: "Upgrade to Pro to create file and image items.",
    });

    const result = await createItem({
      itemType: "file",
      title: "API Spec",
      fileName: "api-spec.pdf",
      fileSize: 2048,
      fileUrl: "https://files.example.com/users/user-1/file/spec.pdf",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Upgrade to Pro to create file and image items.",
    });
    expect(createItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns a generic error when create fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      itemCount: 10,
    });
    createItemRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await createItem({
      itemType: "note",
      title: "New item",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to create item.",
    });
  });
});

describe("updateItem action", () => {
  beforeEach(() => {
    authMock.mockReset();
    canCreateItemForPlanMock.mockReset();
    createItemRecordMock.mockReset();
    deleteItemRecordMock.mockReset();
    deleteR2ObjectMock.mockReset();
    getBillingStateMock.mockReset();
    getItemDrawerDetailMock.mockReset();
    setItemFavoriteStateRecordMock.mockReset();
    setItemPinnedStateRecordMock.mockReset();
    updateItemRecordMock.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateItem("item-1", {
      title: "Updated title",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update items.",
    });
    expect(getItemDrawerDetailMock).not.toHaveBeenCalled();
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns an error when the item does not belong to the user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue(null);

    const result = await updateItem("item-1", {
      title: "Updated title",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Item not found.",
    });
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid payloads", async () => {
    const result = await updateItem("item-1", {
      title: "   ",
      url: "not-a-url",
      tags: [],
      collectionIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual({
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        title: ["Title is required."],
        url: ["Enter a valid URL."],
      },
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(getItemDrawerDetailMock).not.toHaveBeenCalled();
    expect(updateItemRecordMock).not.toHaveBeenCalled();
  });

  it("normalizes optional values and deduplicates tags before updating", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
    });
    updateItemRecordMock.mockResolvedValue({
      id: "item-1",
      title: "Updated title",
    });

    const result = await updateItem("item-1", {
      title: "  Updated title  ",
      description: "   ",
      content: "  console.log('hi')  ",
      language: "  TypeScript  ",
      url: "  https://example.com/docs  ",
      tags: ["react", "react", " prisma "],
      collectionIds: ["collection-1", "collection-1", "collection-3"],
    });

    expect(updateItemRecordMock).toHaveBeenCalledWith("item-1", "user-1", {
      title: "Updated title",
      description: null,
      content: "console.log('hi')",
      language: "TypeScript",
      url: "https://example.com/docs",
      tags: ["react", "prisma"],
      collectionIds: ["collection-1", "collection-3"],
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        title: "Updated title",
      },
    });
  });

  it("returns a generic error when the update fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
    });
    updateItemRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await updateItem("item-1", {
      title: "Updated title",
      tags: [],
      collectionIds: [],
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to update item.",
    });
  });
});

describe("deleteItem action", () => {
  beforeEach(() => {
    authMock.mockReset();
    createItemRecordMock.mockReset();
    deleteItemRecordMock.mockReset();
    deleteR2ObjectMock.mockReset();
    getItemDrawerDetailMock.mockReset();
    setItemFavoriteStateRecordMock.mockReset();
    setItemPinnedStateRecordMock.mockReset();
    updateItemRecordMock.mockReset();
  });

  it("rejects unauthenticated delete requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to delete items.",
    });
    expect(getItemDrawerDetailMock).not.toHaveBeenCalled();
    expect(deleteItemRecordMock).not.toHaveBeenCalled();
  });

  it("returns an error when the item does not belong to the user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue(null);

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Item not found.",
    });
    expect(deleteItemRecordMock).not.toHaveBeenCalled();
  });

  it("deletes the item when the user owns it", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
      fileUrl: null,
    });
    deleteItemRecordMock.mockResolvedValue(true);

    const result = await deleteItem("item-1");

    expect(deleteR2ObjectMock).not.toHaveBeenCalled();
    expect(deleteItemRecordMock).toHaveBeenCalledWith("item-1", "user-1");
    expect(result).toEqual({
      success: true,
    });
  });

  it("deletes the attached R2 object before removing the item", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
      fileUrl: "https://files.example.com/users/user-1/file/file.txt",
    });
    deleteItemRecordMock.mockResolvedValue(true);

    const result = await deleteItem("item-1");

    expect(deleteR2ObjectMock).toHaveBeenCalledWith("users/user-1/file/file.txt");
    expect(deleteItemRecordMock).toHaveBeenCalledWith("item-1", "user-1");
    expect(result).toEqual({
      success: true,
    });
  });

  it("still deletes the item when the attached file key cannot be derived", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
      fileUrl: "https://example.com/not-r2.txt",
    });
    deleteItemRecordMock.mockResolvedValue(true);

    const result = await deleteItem("item-1");

    expect(deleteR2ObjectMock).not.toHaveBeenCalled();
    expect(deleteItemRecordMock).toHaveBeenCalledWith("item-1", "user-1");
    expect(result).toEqual({
      success: true,
    });
  });

  it("returns a generic error when delete fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getItemDrawerDetailMock.mockResolvedValue({
      id: "item-1",
    });
    deleteItemRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await deleteItem("item-1");

    expect(result).toEqual({
      success: false,
      error: "Unable to delete item.",
    });
  });
});

describe("toggleItemFavorite action", () => {
  beforeEach(() => {
    authMock.mockReset();
    createItemRecordMock.mockReset();
    deleteItemRecordMock.mockReset();
    deleteR2ObjectMock.mockReset();
    getItemDrawerDetailMock.mockReset();
    setItemFavoriteStateRecordMock.mockReset();
    setItemPinnedStateRecordMock.mockReset();
    updateItemRecordMock.mockReset();
  });

  it("rejects unauthenticated favorite updates", async () => {
    authMock.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-1", true);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update items.",
    });
    expect(setItemFavoriteStateRecordMock).not.toHaveBeenCalled();
  });

  it("updates the item favorite state", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    setItemFavoriteStateRecordMock.mockResolvedValue({
      id: "item-1",
      isFavorite: true,
    });

    const result = await toggleItemFavorite("item-1", true);

    expect(setItemFavoriteStateRecordMock).toHaveBeenCalledWith("item-1", "user-1", true);
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        isFavorite: true,
      },
    });
  });

  it("returns not found when the item does not belong to the user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    setItemFavoriteStateRecordMock.mockResolvedValue(null);

    const result = await toggleItemFavorite("item-1", false);

    expect(result).toEqual({
      success: false,
      error: "Item not found.",
    });
  });

  it("returns a generic error when the favorite update fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    setItemFavoriteStateRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await toggleItemFavorite("item-1", false);

    expect(result).toEqual({
      success: false,
      error: "Unable to update item.",
    });
  });
});

describe("toggleItemPin action", () => {
  beforeEach(() => {
    authMock.mockReset();
    createItemRecordMock.mockReset();
    deleteItemRecordMock.mockReset();
    deleteR2ObjectMock.mockReset();
    getItemDrawerDetailMock.mockReset();
    setItemFavoriteStateRecordMock.mockReset();
    setItemPinnedStateRecordMock.mockReset();
    updateItemRecordMock.mockReset();
  });

  it("rejects unauthenticated pin updates", async () => {
    authMock.mockResolvedValue(null);

    const result = await toggleItemPin("item-1", true);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update items.",
    });
    expect(setItemPinnedStateRecordMock).not.toHaveBeenCalled();
  });

  it("updates the item pinned state", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    setItemPinnedStateRecordMock.mockResolvedValue({
      id: "item-1",
      isPinned: true,
    });

    const result = await toggleItemPin("item-1", true);

    expect(setItemPinnedStateRecordMock).toHaveBeenCalledWith("item-1", "user-1", true);
    expect(result).toEqual({
      success: true,
      data: {
        id: "item-1",
        isPinned: true,
      },
    });
  });

  it("returns not found when the item does not belong to the user", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    setItemPinnedStateRecordMock.mockResolvedValue(null);

    const result = await toggleItemPin("item-1", false);

    expect(result).toEqual({
      success: false,
      error: "Item not found.",
    });
  });

  it("returns a generic error when the pin update fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    setItemPinnedStateRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await toggleItemPin("item-1", false);

    expect(result).toEqual({
      success: false,
      error: "Unable to update item.",
    });
  });
});
