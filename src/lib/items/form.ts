export const ITEM_FORM_TYPES = [
  'snippet',
  'prompt',
  'command',
  'note',
  'file',
  'image',
  'link',
] as const;

export type ItemFormType = (typeof ITEM_FORM_TYPES)[number];

export const CONTENT_ITEM_TYPES = ['snippet', 'prompt', 'command', 'note'] as const;
export const FILE_ITEM_TYPES = ['file', 'image'] as const;
export const LANGUAGE_ITEM_TYPES = ['snippet', 'command'] as const;
export const MARKDOWN_ITEM_TYPES = ['note', 'prompt'] as const;
export const URL_ITEM_TYPES = ['link'] as const;

const contentItemTypeSet = new Set<ItemFormType>(CONTENT_ITEM_TYPES);
const fileItemTypeSet = new Set<ItemFormType>(FILE_ITEM_TYPES);
const languageItemTypeSet = new Set<ItemFormType>(LANGUAGE_ITEM_TYPES);
const markdownItemTypeSet = new Set<ItemFormType>(MARKDOWN_ITEM_TYPES);
const urlItemTypeSet = new Set<ItemFormType>(URL_ITEM_TYPES);

const normalizeItemType = (itemType: string | null | undefined) =>
  itemType?.trim().toLowerCase() ?? '';

export const isContentItemType = (itemType: string | null | undefined) =>
  contentItemTypeSet.has(normalizeItemType(itemType) as ItemFormType);

export const isFileItemType = (itemType: string | null | undefined) =>
  fileItemTypeSet.has(normalizeItemType(itemType) as ItemFormType);

export const isLanguageItemType = (itemType: string | null | undefined) =>
  languageItemTypeSet.has(normalizeItemType(itemType) as ItemFormType);

export const isMarkdownItemType = (itemType: string | null | undefined) =>
  markdownItemTypeSet.has(normalizeItemType(itemType) as ItemFormType);

export const isUrlItemType = (itemType: string | null | undefined) =>
  urlItemTypeSet.has(normalizeItemType(itemType) as ItemFormType);

export const getItemFormCapabilities = (itemType: string | null | undefined) => ({
  hasContent: isContentItemType(itemType),
  hasFile: isFileItemType(itemType),
  hasLanguage: isLanguageItemType(itemType),
  hasMarkdown: isMarkdownItemType(itemType),
  hasUrl: isUrlItemType(itemType),
});

export const getDefaultCodeLanguageLabel = (
  itemType: string | null | undefined,
) => (normalizeItemType(itemType) === 'command' ? 'Default (Shell)' : 'Plain text');

export const getItemContentPlaceholder = (
  itemType: string | null | undefined,
) => {
  switch (normalizeItemType(itemType)) {
    case 'prompt':
      return 'Write the prompt text';
    case 'note':
      return 'Write your note';
    default:
      return 'Paste the content here';
  }
};

export const resetItemFormValuesForType = <
  T extends {
    content: string;
    language: string;
    url: string;
  },
>(
  state: T,
  itemType: string,
) => {
  const capabilities = getItemFormCapabilities(itemType);

  return {
    ...state,
    ...(capabilities.hasContent ? {} : { content: '' }),
    ...(capabilities.hasLanguage ? {} : { language: '' }),
    ...(capabilities.hasUrl ? {} : { url: '' }),
  };
};

interface ItemFormPayloadBase {
  collectionIds: string[];
  content: string;
  description: string;
  language: string;
  tags: string[];
  title: string;
  url: string;
}

interface CreateItemPayloadInput extends ItemFormPayloadBase {
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  itemType: ItemFormType;
}

interface UpdateItemPayloadInput extends ItemFormPayloadBase {
  itemType: string;
}

export const buildCreateItemPayload = ({
  collectionIds,
  content,
  description,
  fileName,
  fileSize,
  fileUrl,
  itemType,
  language,
  tags,
  title,
  url,
}: CreateItemPayloadInput) => {
  const capabilities = getItemFormCapabilities(itemType);

  return {
    itemType,
    title,
    description,
    tags,
    ...(capabilities.hasContent ? { content } : {}),
    ...(capabilities.hasLanguage ? { language } : {}),
    ...(capabilities.hasFile && fileName ? { fileName } : {}),
    ...(capabilities.hasFile && typeof fileSize === 'number' ? { fileSize } : {}),
    ...(capabilities.hasFile && fileUrl ? { fileUrl } : {}),
    ...(capabilities.hasUrl ? { url } : {}),
    collectionIds,
  };
};

export const buildUpdateItemPayload = ({
  collectionIds,
  content,
  description,
  itemType,
  language,
  tags,
  title,
  url,
}: UpdateItemPayloadInput) => {
  const capabilities = getItemFormCapabilities(itemType);

  return {
    title,
    description,
    tags,
    ...(capabilities.hasContent ? { content } : {}),
    ...(capabilities.hasLanguage ? { language } : {}),
    ...(capabilities.hasUrl ? { url } : {}),
    collectionIds,
  };
};

export const parseItemTagsInput = (value: string) =>
  Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
