import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  getFieldValidationError,
  normalizeOptionalText,
  VALIDATION_ERROR_MESSAGE,
} from "@/lib/actions/validation";

describe("normalizeOptionalText", () => {
  it("returns null for missing values", () => {
    expect(normalizeOptionalText(null)).toBeNull();
    expect(normalizeOptionalText(undefined)).toBeNull();
  });

  it("trims non-empty text and converts blank text to null", () => {
    expect(normalizeOptionalText("  Deploy notes  ")).toBe("Deploy notes");
    expect(normalizeOptionalText("   ")).toBeNull();
  });
});

describe("getFieldValidationError", () => {
  it("returns the shared validation message and flattened field errors", () => {
    const schema = z.object({
      title: z.string().min(1, "Title is required."),
    });
    const result = schema.safeParse({
      title: "",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(getFieldValidationError(result.error)).toEqual({
        message: VALIDATION_ERROR_MESSAGE,
        fieldErrors: {
          title: ["Title is required."],
        },
      });
    }
  });
});
