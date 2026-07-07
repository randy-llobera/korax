"use client";

import { createElement } from "react";
import {
  Download,
  File,
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileVideo,
  type LucideIcon,
} from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";
import { formatFileSize } from "@/lib/files/size";
import { getFileExtension } from "@/lib/files/upload";

import { ItemFavoriteButton } from "@/components/dashboard/item-favorite-button";
import { useItemDrawer } from "@/components/dashboard/item-drawer-provider";
import { formatDate } from "@/components/utils/date";

interface DashboardFileRowProps {
  item: DashboardItem;
}

const FILE_ICON_BY_EXTENSION: Record<string, LucideIcon> = {
  ".aac": FileAudio,
  ".avi": FileVideo,
  ".csv": FileSpreadsheet,
  ".doc": FileText,
  ".docx": FileText,
  ".gif": FileImage,
  ".jpeg": FileImage,
  ".jpg": FileImage,
  ".json": FileJson,
  ".md": FileText,
  ".mov": FileVideo,
  ".mp3": FileAudio,
  ".mp4": FileVideo,
  ".pdf": FileText,
  ".png": FileImage,
  ".ppt": FileText,
  ".pptx": FileText,
  ".rar": FileArchive,
  ".svg": FileImage,
  ".tar": FileArchive,
  ".ts": FileCode2,
  ".tsx": FileCode2,
  ".txt": FileText,
  ".wav": FileAudio,
  ".webm": FileVideo,
  ".webp": FileImage,
  ".xls": FileSpreadsheet,
  ".xlsx": FileSpreadsheet,
  ".zip": FileArchive,
};

const getFileIcon = (fileName: string | null, fallbackIcon: string) => {
  const extension = fileName ? getFileExtension(fileName) : "";

  return FILE_ICON_BY_EXTENSION[extension] ?? (fallbackIcon === "File" ? File : FileText);
};

export const DashboardFileRow = ({ item }: DashboardFileRowProps) => {
  const { openItem } = useItemDrawer();
  const fileLabel = item.fileName ?? item.title;
  const FileIcon = getFileIcon(item.fileName, item.itemType.icon);

  return (
    <div
      className="flex w-full items-start gap-3 rounded-[1.25rem] border border-border/60 bg-card/45 px-4 py-4 text-left shadow-sm shadow-black/5 transition-colors hover:border-foreground/15 hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 sm:items-center sm:px-5"
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-3 text-left sm:items-center"
        onClick={() => openItem(item)}
      >
        <div className="rounded-2xl bg-muted/45 p-3 text-muted-foreground ring-1 ring-white/5">
          {createElement(FileIcon, {
            className: "size-5",
            style: { color: item.itemType.color },
          })}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">{fileLabel}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
                {item.description}
              </p>
            </div>

            <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:min-w-55 sm:items-end sm:text-sm">
              <span>{formatFileSize(item.fileSize) ?? "Unknown size"}</span>
              <span>Uploaded {formatDate(item.createdAt)}</span>
            </div>
          </div>
        </div>
      </button>

      <ItemFavoriteButton
        itemId={item.id}
        itemTitle={item.title}
        isFavorite={item.isFavorite}
        className="shrink-0 rounded-full border border-border/60 bg-background/70 text-muted-foreground"
        stopPropagation={false}
      />

      <a
        href={`/api/items/${item.id}/download`}
        download
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        aria-label={`Download ${fileLabel}`}
      >
        <Download className="size-3.5" />
        <span className="hidden sm:inline">Download</span>
      </a>
    </div>
  );
};
