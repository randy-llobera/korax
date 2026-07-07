import { describe, expect, it } from "vitest";

import {
  FREE_TIER_COLLECTION_LIMIT,
  FREE_TIER_ITEM_LIMIT,
  canCreateCollection,
  canCreateItem,
  canUseAiFeatures,
  canUseFileUploads,
  canUseImageUploads,
} from "@/lib/billing/usage-limits";

describe("usage limits", () => {
  it("allows free users to create items below the limit", () => {
    expect(
      canCreateItem({
        isPro: false,
        itemCount: FREE_TIER_ITEM_LIMIT - 1,
      }),
    ).toBe(true);
  });

  it("blocks free users from creating items at the limit", () => {
    expect(
      canCreateItem({
        isPro: false,
        itemCount: FREE_TIER_ITEM_LIMIT,
      }),
    ).toBe(false);
  });

  it("allows free users to create collections below the limit", () => {
    expect(
      canCreateCollection({
        isPro: false,
        collectionCount: FREE_TIER_COLLECTION_LIMIT - 1,
      }),
    ).toBe(true);
  });

  it("blocks free users from creating collections at the limit", () => {
    expect(
      canCreateCollection({
        isPro: false,
        collectionCount: FREE_TIER_COLLECTION_LIMIT,
      }),
    ).toBe(false);
  });

  it("blocks file uploads for free users", () => {
    expect(canUseFileUploads({ isPro: false })).toBe(false);
  });

  it("blocks image uploads for free users", () => {
    expect(canUseImageUploads({ isPro: false })).toBe(false);
  });

  it("lets Pro users bypass all current free-tier limits", () => {
    expect(
      canCreateItem({
        isPro: true,
        itemCount: FREE_TIER_ITEM_LIMIT,
      }),
    ).toBe(true);
    expect(
      canCreateCollection({
        isPro: true,
        collectionCount: FREE_TIER_COLLECTION_LIMIT,
      }),
    ).toBe(true);
    expect(canUseFileUploads({ isPro: true })).toBe(true);
    expect(canUseImageUploads({ isPro: true })).toBe(true);
    expect(canUseAiFeatures({ isPro: true })).toBe(true);
  });
});
