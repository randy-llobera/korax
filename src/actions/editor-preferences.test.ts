import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  userFindUniqueMock,
  userUpdateMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  userFindUniqueMock: vi.fn(),
  userUpdateMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: userFindUniqueMock,
      update: userUpdateMock,
    },
  },
}));

import { updateEditorPreferences } from "@/actions/editor-preferences";

describe("updateEditorPreferences", () => {
  beforeEach(() => {
    authMock.mockReset();
    userFindUniqueMock.mockReset();
    userUpdateMock.mockReset();
  });

  it("rejects unauthenticated requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await updateEditorPreferences({
      theme: "vs-dark",
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to update editor preferences.",
    });
    expect(userFindUniqueMock).not.toHaveBeenCalled();
    expect(userUpdateMock).not.toHaveBeenCalled();
  });

  it("merges the patch with stored preferences before saving", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    userFindUniqueMock.mockResolvedValue({
      editorPreferences: {
        fontSize: 16,
        tabSize: 4,
        wordWrap: true,
        minimap: false,
        theme: "github-dark",
      },
    });
    userUpdateMock.mockResolvedValue({
      id: "user-1",
    });

    const result = await updateEditorPreferences({
      minimap: true,
    });

    expect(userUpdateMock).toHaveBeenCalledWith({
      where: {
        id: "user-1",
      },
      data: {
        editorPreferences: {
          fontSize: 16,
          tabSize: 4,
          wordWrap: true,
          minimap: true,
          theme: "vs-dark",
        },
      },
    });
    expect(result).toEqual({
      success: true,
      data: {
        fontSize: 16,
        tabSize: 4,
        wordWrap: true,
        minimap: true,
        theme: "vs-dark",
      },
    });
  });

  it("returns a validation error for invalid patches", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    userFindUniqueMock.mockResolvedValue({
      editorPreferences: null,
    });

    const result = await updateEditorPreferences({
      theme: "light" as "vs-dark",
    });

    expect(result).toEqual({
      success: false,
      error: "Editor preferences payload is invalid.",
    });
    expect(userUpdateMock).not.toHaveBeenCalled();
  });
});
