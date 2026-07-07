import { describe, expect, it } from "vitest";

import {
  DEFAULT_EDITOR_PREFERENCES,
  mergeEditorPreferences,
  normalizeEditorPreferences,
} from "@/lib/editors/preferences";

describe("normalizeEditorPreferences", () => {
  it("returns defaults for null and invalid values", () => {
    expect(normalizeEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
    expect(
      normalizeEditorPreferences({
        fontSize: 99,
        tabSize: 3,
        wordWrap: "yes",
      }),
    ).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it("merges valid partial values with defaults", () => {
    expect(
      normalizeEditorPreferences({
        fontSize: 16,
        minimap: true,
      }),
    ).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 16,
      minimap: true,
    });
  });

  it("normalizes legacy theme values to vs-dark", () => {
    expect(
      normalizeEditorPreferences({
        ...DEFAULT_EDITOR_PREFERENCES,
        fontSize: 16,
        theme: "github-dark",
      }),
    ).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 16,
      theme: "vs-dark",
    });
  });
});

describe("mergeEditorPreferences", () => {
  it("applies a valid patch over the current preferences", () => {
    expect(
      mergeEditorPreferences(
        {
          ...DEFAULT_EDITOR_PREFERENCES,
          fontSize: 16,
          minimap: true,
        },
        {
          wordWrap: false,
        },
      ),
    ).toEqual({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 16,
      minimap: true,
      theme: "vs-dark",
      wordWrap: false,
    });
  });

  it("throws for invalid patches", () => {
    expect(() =>
      mergeEditorPreferences(DEFAULT_EDITOR_PREFERENCES, {
        theme: "light" as unknown as "vs-dark",
      }),
    ).toThrow();
  });
});
