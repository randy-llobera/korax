import { FILE_ITEM_TYPES } from "@/lib/items/form";

export const FILE_UPLOAD_TYPES = FILE_ITEM_TYPES;

export type FileUploadItemType = (typeof FILE_UPLOAD_TYPES)[number];

interface FileUploadRules {
  extensions: string[];
  maxSize: number;
  mimeTypes: string[];
}

const MB = 1024 * 1024;
const GENERIC_MIME_TYPES = new Set(["", "application/octet-stream"]);

export const FILE_UPLOAD_RULES: Record<FileUploadItemType, FileUploadRules> = {
  image: {
    maxSize: 5 * MB,
    extensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"],
    mimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"],
  },
  file: {
    maxSize: 10 * MB,
    extensions: [".pdf", ".txt", ".md", ".json", ".yaml", ".yml", ".xml", ".csv", ".toml", ".ini"],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/json",
      "application/x-yaml",
      "text/yaml",
      "application/xml",
      "text/xml",
      "text/csv",
      "application/toml",
    ],
  },
};

const formatAllowedExtensions = (extensions: string[]) => extensions.join(", ");

export const getFileExtension = (fileName: string) => {
  const lastDotIndex = fileName.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex).toLowerCase();
};

export const isFileUploadItemType = (value: string): value is FileUploadItemType =>
  FILE_UPLOAD_TYPES.includes(value as FileUploadItemType);

export const getFileUploadAccept = (itemType: FileUploadItemType) =>
  FILE_UPLOAD_RULES[itemType].extensions.join(",");

export const validateUploadFile = (file: File, itemType: FileUploadItemType) => {
  const rules = FILE_UPLOAD_RULES[itemType];
  const extension = getFileExtension(file.name);

  if (!rules.extensions.includes(extension)) {
    return `Unsupported file type. Allowed: ${formatAllowedExtensions(rules.extensions)}.`;
  }

  if (file.size > rules.maxSize) {
    return `File is too large. Max size is ${rules.maxSize / MB} MB.`;
  }

  const normalizedMimeType = file.type.toLowerCase();

  if (
    !GENERIC_MIME_TYPES.has(normalizedMimeType) &&
    !rules.mimeTypes.includes(normalizedMimeType)
  ) {
    return "Unsupported file format.";
  }

  return null;
};

export const sanitizeUploadedFileName = (fileName: string) =>
  fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getPublicBaseUrl = () => {
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!publicUrl) {
    throw new Error("R2_PUBLIC_URL is not configured.");
  }

  return trimTrailingSlash(publicUrl);
};

const encodeObjectKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

export const buildUploadedFileUrl = (key: string) => `${getPublicBaseUrl()}/${encodeObjectKey(key)}`;

export const getObjectKeyFromFileUrl = (fileUrl: string) => {
  const publicUrl = new URL(getPublicBaseUrl());
  const resolvedFileUrl = new URL(fileUrl);
  const publicPath = trimTrailingSlash(publicUrl.pathname);

  if (publicUrl.origin !== resolvedFileUrl.origin) {
    return null;
  }

  const pathPrefix = publicPath ? `${publicPath}/` : "/";

  if (!resolvedFileUrl.pathname.startsWith(pathPrefix)) {
    return null;
  }

  return decodeURIComponent(resolvedFileUrl.pathname.slice(pathPrefix.length));
};

export const isSvgFileName = (fileName: string | null | undefined) =>
  getFileExtension(fileName ?? "") === ".svg";
