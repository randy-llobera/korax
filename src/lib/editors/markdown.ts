import { MARKDOWN_ITEM_TYPES } from "@/lib/items/form";

const MARKDOWN_EDITOR_ITEM_TYPES = new Set<string>(MARKDOWN_ITEM_TYPES);

export const isMarkdownEditorItemType = (itemType: string | null | undefined) =>
  MARKDOWN_EDITOR_ITEM_TYPES.has(itemType?.trim().toLowerCase() ?? '');
