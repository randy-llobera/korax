import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  canCreateCollectionForPlanMock,
  createCollectionRecordMock,
  deleteCollectionRecordMock,
  getBillingStateMock,
  updateCollectionRecordMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  canCreateCollectionForPlanMock: vi.fn(),
  createCollectionRecordMock: vi.fn(),
  deleteCollectionRecordMock: vi.fn(),
  getBillingStateMock: vi.fn(),
  updateCollectionRecordMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/billing/guards", () => ({
  canCreateCollectionForPlan: canCreateCollectionForPlanMock,
}));

vi.mock("@/lib/db/billing", () => ({
  getBillingState: getBillingStateMock,
}));

vi.mock("@/lib/db/collections", () => ({
  createCollection: createCollectionRecordMock,
  deleteCollection: deleteCollectionRecordMock,
  updateCollection: updateCollectionRecordMock,
}));

import {
  createCollection,
  deleteCollection,
  toggleCollectionFavorite,
  updateCollection,
} from "@/actions/collections";

describe("collections actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    canCreateCollectionForPlanMock.mockReset();
    createCollectionRecordMock.mockReset();
    deleteCollectionRecordMock.mockReset();
    getBillingStateMock.mockReset();
    updateCollectionRecordMock.mockReset();
    canCreateCollectionForPlanMock.mockReturnValue({ allowed: true });
  });

  it("rejects unauthenticated create requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await createCollection({
      name: "Frontend patterns",
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to create collections.",
    });
    expect(createCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid payloads", async () => {
    const result = await createCollection({
      name: "   ",
    });

    expect(result).toEqual({
      success: false,
      error: {
        message: "Please fix the highlighted fields.",
        fieldErrors: {
          name: ["Name is required."],
        },
      },
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(createCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("normalizes optional values before creating", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      collectionCount: 1,
    });
    createCollectionRecordMock.mockResolvedValue({
      id: "collection-1",
      name: "Frontend patterns",
      description: null,
    });

    const result = await createCollection({
      name: "  Frontend patterns  ",
      description: "   ",
    });

    expect(createCollectionRecordMock).toHaveBeenCalledWith("user-1", {
      name: "Frontend patterns",
      description: null,
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "collection-1",
        name: "Frontend patterns",
        description: null,
      },
    });
  });

  it("blocks collection creation at the free-tier limit", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      collectionCount: 3,
    });
    canCreateCollectionForPlanMock.mockReturnValue({
      allowed: false,
      message: "Free plans are limited to 3 collections. Upgrade to Pro to create more collections.",
    });

    const result = await createCollection({
      name: "Frontend patterns",
    });

    expect(result).toEqual({
      success: false,
      error: "Free plans are limited to 3 collections. Upgrade to Pro to create more collections.",
    });
    expect(createCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("returns a generic error when create fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      collectionCount: 1,
    });
    createCollectionRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await createCollection({
      name: "Frontend patterns",
      description: "Components and layout notes",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to create collection.",
    });
  });

  it("rejects unauthenticated update requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateCollection("collection-1", {
      name: "Frontend patterns",
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update collections.",
    });
    expect(updateCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("validates update payloads before loading auth", async () => {
    const result = await updateCollection("collection-1", {
      name: "   ",
    });

    expect(result).toEqual({
      success: false,
      error: {
        message: "Please fix the highlighted fields.",
        fieldErrors: {
          name: ["Name is required."],
        },
      },
    });
    expect(authMock).not.toHaveBeenCalled();
    expect(updateCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("normalizes optional values before updating", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateCollectionRecordMock.mockResolvedValue({
      id: "collection-1",
      name: "Frontend patterns",
      description: null,
    });

    const result = await updateCollection("collection-1", {
      name: "  Frontend patterns  ",
      description: "   ",
    });

    expect(updateCollectionRecordMock).toHaveBeenCalledWith("user-1", "collection-1", {
      name: "Frontend patterns",
      description: null,
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "collection-1",
        name: "Frontend patterns",
        description: null,
      },
    });
  });

  it("returns a not found error when update misses the collection", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateCollectionRecordMock.mockResolvedValue(null);

    const result = await updateCollection("collection-1", {
      name: "Frontend patterns",
    });

    expect(result).toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a generic error when update fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateCollectionRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await updateCollection("collection-1", {
      name: "Frontend patterns",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to update collection.",
    });
  });

  it("rejects unauthenticated delete requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to delete collections.",
    });
    expect(deleteCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("deletes an owned collection", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteCollectionRecordMock.mockResolvedValue(true);

    const result = await deleteCollection("collection-1");

    expect(deleteCollectionRecordMock).toHaveBeenCalledWith("user-1", "collection-1");
    expect(result).toEqual({
      success: true,
    });
  });

  it("returns a not found error when delete misses the collection", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteCollectionRecordMock.mockResolvedValue(false);

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a generic error when delete fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    deleteCollectionRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await deleteCollection("collection-1");

    expect(result).toEqual({
      success: false,
      error: "Unable to delete collection.",
    });
  });

  it("rejects unauthenticated favorite updates", async () => {
    authMock.mockResolvedValue(null);

    const result = await toggleCollectionFavorite("collection-1", true);

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update collections.",
    });
    expect(updateCollectionRecordMock).not.toHaveBeenCalled();
  });

  it("updates the collection favorite state", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateCollectionRecordMock.mockResolvedValue({
      id: "collection-1",
      isFavorite: true,
    });

    const result = await toggleCollectionFavorite("collection-1", true);

    expect(updateCollectionRecordMock).toHaveBeenCalledWith("user-1", "collection-1", {
      isFavorite: true,
    });
    expect(result).toEqual({
      success: true,
      data: {
        id: "collection-1",
        isFavorite: true,
      },
    });
  });

  it("returns a not found error when favorite update misses the collection", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateCollectionRecordMock.mockResolvedValue(null);

    const result = await toggleCollectionFavorite("collection-1", false);

    expect(result).toEqual({
      success: false,
      error: "Collection not found.",
    });
  });

  it("returns a generic error when favorite update fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    updateCollectionRecordMock.mockRejectedValue(new Error("db failure"));

    const result = await toggleCollectionFavorite("collection-1", false);

    expect(result).toEqual({
      success: false,
      error: "Unable to update collection.",
    });
  });
});
