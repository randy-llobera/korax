import { describe, expect, it } from "vitest";

import {
  getPaginationState,
  getVisiblePageNumbers,
  parsePageParam,
} from "@/lib/pagination";

describe("pagination helpers", () => {
  it("parses valid page params and falls back to the first page", () => {
    expect(parsePageParam("3")).toBe(3);
    expect(parsePageParam(["4", "5"])).toBe(4);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("builds a bounded pagination state", () => {
    expect(
      getPaginationState({
        currentPage: 4,
        perPage: 21,
        totalItems: 25,
      }),
    ).toEqual({
      currentPage: 2,
      totalPages: 2,
      totalItems: 25,
      perPage: 21,
      offset: 21,
      hasPreviousPage: true,
      hasNextPage: false,
    });
  });

  it("returns the visible page numbers around the current page", () => {
    expect(getVisiblePageNumbers(5, 10)).toEqual([1, 4, 5, 6, 10]);
    expect(getVisiblePageNumbers(1, 3)).toEqual([1, 2, 3]);
  });
});
