import { beforeAll, describe, expect, it } from "vitest";

import {
  buildUploadedFileUrl,
  getObjectKeyFromFileUrl,
  validateUploadFile,
} from "@/lib/files/upload";

beforeAll(() => {
  process.env.R2_PUBLIC_URL = "https://pub.example.r2.dev/uploads";
});

describe("validateUploadFile", () => {
  it("accepts supported image uploads", () => {
    const file = new File(["image"], "diagram.png", { type: "image/png" });

    expect(validateUploadFile(file, "image")).toBeNull();
  });

  it("rejects unsupported file extensions", () => {
    const file = new File(["content"], "archive.zip", { type: "application/zip" });

    expect(validateUploadFile(file, "file")).toBe(
      "Unsupported file type. Allowed: .pdf, .txt, .md, .json, .yaml, .yml, .xml, .csv, .toml, .ini."
    );
  });

  it("rejects oversized uploads", () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "photo.png", {
      type: "image/png",
    });

    expect(validateUploadFile(file, "image")).toBe("File is too large. Max size is 5 MB.");
  });
});

describe("R2 file URL helpers", () => {
  it("builds a public URL from an object key", () => {
    expect(buildUploadedFileUrl("users/user-1/file/spec doc.pdf")).toBe(
      "https://pub.example.r2.dev/uploads/users/user-1/file/spec%20doc.pdf"
    );
  });

  it("derives an object key from the public URL", () => {
    expect(
      getObjectKeyFromFileUrl(
        "https://pub.example.r2.dev/uploads/users/user-1/file/spec%20doc.pdf"
      )
    ).toBe("users/user-1/file/spec doc.pdf");
  });

  it("rejects URLs outside the configured public base", () => {
    expect(getObjectKeyFromFileUrl("https://example.com/file.pdf")).toBeNull();
  });
});
