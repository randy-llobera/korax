import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  getItemDrawerDetailMock,
  getObjectKeyFromFileUrlMock,
  getR2ObjectMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getItemDrawerDetailMock: vi.fn(),
  getObjectKeyFromFileUrlMock: vi.fn(),
  getR2ObjectMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/items", () => ({
  getItemDrawerDetail: getItemDrawerDetailMock,
}));

vi.mock("@/lib/files/upload", () => ({
  getObjectKeyFromFileUrl: getObjectKeyFromFileUrlMock,
  isSvgFileName: (fileName: string | null | undefined) => fileName?.endsWith(".svg") ?? false,
}));

vi.mock("@/lib/files/r2", () => ({
  getR2Object: getR2ObjectMock,
}));

import { GET } from "@/app/api/items/[id]/download/route";

describe("item download route GET", () => {
  beforeEach(() => {
    authMock.mockReset();
    getItemDrawerDetailMock.mockReset();
    getObjectKeyFromFileUrlMock.mockReset();
    getR2ObjectMock.mockReset();
  });

  it("rejects unauthenticated downloads", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/items/item-1/download"), {
      params: Promise.resolve({ id: "item-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "You must be signed in to download files.",
    });
  });

  it("returns not found when the item has no file", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getItemDrawerDetailMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/items/item-1/download"), {
      params: Promise.resolve({ id: "item-1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "File not found." });
  });

  it("proxies the file bytes with attachment headers", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getItemDrawerDetailMock.mockResolvedValue({
      title: "Spec",
      fileName: "spec.pdf",
      fileUrl: "https://files.example.com/spec.pdf",
    });
    getObjectKeyFromFileUrlMock.mockReturnValue("users/user-1/file/spec.pdf");
    getR2ObjectMock.mockResolvedValue({
      ContentType: "application/pdf",
      Body: {
        transformToByteArray: async () => new Uint8Array([1, 2, 3]),
      },
    });

    const response = await GET(new Request("http://localhost/api/items/item-1/download"), {
      params: Promise.resolve({ id: "item-1" }),
    });

    expect(getR2ObjectMock).toHaveBeenCalledWith("users/user-1/file/spec.pdf");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="spec.pdf"'
    );
    await expect(response.arrayBuffer()).resolves.toEqual(new Uint8Array([1, 2, 3]).buffer);
  });

  it("forces SVG downloads to attachment even when inline is requested", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    getItemDrawerDetailMock.mockResolvedValue({
      title: "Logo",
      fileName: "logo.svg",
      fileUrl: "https://files.example.com/logo.svg",
    });
    getObjectKeyFromFileUrlMock.mockReturnValue("users/user-1/image/logo.svg");
    getR2ObjectMock.mockResolvedValue({
      ContentType: "image/svg+xml",
      Body: {
        transformToByteArray: async () => new Uint8Array([4, 5, 6]),
      },
    });

    const response = await GET(
      new Request("http://localhost/api/items/item-1/download?inline=1"),
      {
        params: Promise.resolve({ id: "item-1" }),
      }
    );

    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="logo.svg"'
    );
    expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
  });
});
