import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  getGlobalSearchCollectionsMock,
  getGlobalSearchItemsMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getGlobalSearchCollectionsMock: vi.fn(),
  getGlobalSearchItemsMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  getGlobalSearchItems: getGlobalSearchItemsMock,
}));

vi.mock("@/lib/db/collections", () => ({
  getGlobalSearchCollections: getGlobalSearchCollectionsMock,
}));

import { getSearchData } from "@/actions/search";

describe("search actions", () => {
  beforeEach(() => {
    authMock.mockReset();
    getGlobalSearchCollectionsMock.mockReset();
    getGlobalSearchItemsMock.mockReset();
  });

  it("rejects unauthenticated search requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await getSearchData();

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to search.",
    });
    expect(getGlobalSearchItemsMock).not.toHaveBeenCalled();
    expect(getGlobalSearchCollectionsMock).not.toHaveBeenCalled();
  });

  it("returns combined item and collection search data", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getGlobalSearchItemsMock.mockResolvedValue([{ id: "item-1", title: "Deploy" }]);
    getGlobalSearchCollectionsMock.mockResolvedValue([{ id: "collection-1", name: "DevOps" }]);

    const result = await getSearchData();

    expect(getGlobalSearchItemsMock).toHaveBeenCalledWith("user-1");
    expect(getGlobalSearchCollectionsMock).toHaveBeenCalledWith("user-1");
    expect(result).toEqual({
      success: true,
      data: {
        items: [{ id: "item-1", title: "Deploy" }],
        collections: [{ id: "collection-1", name: "DevOps" }],
      },
    });
  });

  it("returns a generic error when loading search data fails", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getGlobalSearchItemsMock.mockRejectedValue(new Error("db failure"));

    const result = await getSearchData();

    expect(result).toEqual({
      success: false,
      error: "Unable to load search data.",
    });
  });
});
