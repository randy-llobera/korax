"use server";

import { z } from "zod";

import { getSessionUserId } from "@/lib/actions/auth";
import {
  getFieldValidationError,
  normalizeOptionalText,
  VALIDATION_ERROR_MESSAGE,
} from "@/lib/actions/validation";
import { canCreateItemForPlan } from "@/lib/billing/guards";
import { getBillingState } from "@/lib/db/billing";
import { deleteR2Object } from "@/lib/files/r2";
import { getObjectKeyFromFileUrl } from "@/lib/files/upload";
import { ITEM_FORM_TYPES } from "@/lib/items/form";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  getItemDrawerDetail,
  setItemFavoriteState as setItemFavoriteStateRecord,
  setItemPinnedState as setItemPinnedStateRecord,
  updateItem as updateItemRecord,
} from "@/lib/db/items";

const createItemTypeSchema = z.enum(ITEM_FORM_TYPES);

const itemCreateSchema = z
  .object({
    itemType: createItemTypeSchema,
    title: z
      .string()
      .trim()
      .min(1, "Title is required."),
    description: z
      .string()
      .trim()
      .nullable()
      .optional(),
    content: z
      .string()
      .trim()
      .nullable()
      .optional(),
    url: z
      .string()
      .trim()
      .url("Enter a valid URL.")
      .nullable()
      .optional(),
    language: z
      .string()
      .trim()
      .nullable()
      .optional(),
    fileName: z
      .string()
      .trim()
      .min(1, "File name is required.")
      .nullable()
      .optional(),
    fileSize: z
      .number()
      .int()
      .positive("File size is required.")
      .nullable()
      .optional(),
    fileUrl: z
      .string()
      .trim()
      .url("Enter a valid file URL.")
      .nullable()
      .optional(),
    tags: z
      .array(z.string().trim().min(1, "Tags cannot be empty."))
      .transform((tags) => Array.from(new Set(tags))),
    collectionIds: z
      .array(z.string().trim().min(1, "Collection selection is invalid."))
      .transform((collectionIds) => Array.from(new Set(collectionIds))),
  })
  .superRefine((value, context) => {
    if (value.itemType === "link" && !value.url) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "URL is required for links.",
      });
    }

    if ((value.itemType === "file" || value.itemType === "image") && !value.fileUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileUrl"],
        message: "A file upload is required.",
      });
    }

    if ((value.itemType === "file" || value.itemType === "image") && !value.fileName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileName"],
        message: "File name is required.",
      });
    }

    if ((value.itemType === "file" || value.itemType === "image") && !value.fileSize) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fileSize"],
        message: "File size is required.",
      });
    }
  });

const itemUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required."),
  description: z
    .string()
    .trim()
    .nullable()
    .optional(),
  content: z
    .string()
    .trim()
    .nullable()
    .optional(),
  url: z
    .string()
    .trim()
    .url("Enter a valid URL.")
    .nullable()
    .optional(),
  language: z
    .string()
    .trim()
    .nullable()
    .optional(),
  tags: z
    .array(z.string().trim().min(1, "Tags cannot be empty."))
    .transform((tags) => Array.from(new Set(tags))),
  collectionIds: z
    .array(z.string().trim().min(1, "Collection selection is invalid."))
    .transform((collectionIds) => Array.from(new Set(collectionIds))),
});

type UpdateItemPayload = z.input<typeof itemUpdateSchema>;
type CreateItemPayload = z.input<typeof itemCreateSchema>;

export interface UpdateItemActionError {
  message: string;
  fieldErrors?: Partial<Record<keyof UpdateItemPayload, string[]>>;
}

export interface CreateItemActionError {
  message: string;
  fieldErrors?: Partial<Record<keyof CreateItemPayload, string[]>>;
}

interface UpdateItemActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof updateItemRecord>>;
  error?: UpdateItemActionError | string;
}

interface CreateItemActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof createItemRecord>>;
  error?: CreateItemActionError | string;
}

interface DeleteItemActionResult {
  success: boolean;
  error?: string;
}

interface ToggleItemFavoriteActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof setItemFavoriteStateRecord>>;
  error?: string;
}

interface ToggleItemPinActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof setItemPinnedStateRecord>>;
  error?: string;
}

const buildParsedPayload = <T extends CreateItemPayload | UpdateItemPayload>(
  data: T,
) => ({
  tags: data.tags,
  collectionIds: data.collectionIds,
  title: data.title,
  ...(Object.prototype.hasOwnProperty.call(data, "description")
    ? { description: normalizeOptionalText(data.description) }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(data, "content")
    ? { content: normalizeOptionalText(data.content) }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(data, "url")
    ? { url: normalizeOptionalText(data.url) }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(data, "language")
    ? { language: normalizeOptionalText(data.language) }
    : {}),
});

const buildCreateItemPayload = (data: CreateItemPayload) => ({
  itemType: data.itemType,
  ...buildParsedPayload(data),
  ...(Object.prototype.hasOwnProperty.call(data, "fileName")
    ? { fileName: normalizeOptionalText(data.fileName) }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(data, "fileSize")
    ? { fileSize: data.fileSize ?? null }
    : {}),
  ...(Object.prototype.hasOwnProperty.call(data, "fileUrl")
    ? { fileUrl: normalizeOptionalText(data.fileUrl) }
    : {}),
});

const getOwnedItem = async (itemId: string, userId: string) => getItemDrawerDetail(itemId, userId);

const validateUploadedFileOwnership = (userId: string, fileUrl: string) => {
  const objectKey = getObjectKeyFromFileUrl(fileUrl);

  if (!objectKey || !objectKey.startsWith(`users/${userId}/`)) {
    return {
      message: VALIDATION_ERROR_MESSAGE,
      fieldErrors: {
        fileUrl: ["Uploaded file must belong to your storage bucket."],
      },
    } satisfies CreateItemActionError;
  }

  return null;
};

export const createItem = async (data: CreateItemPayload): Promise<CreateItemActionResult> => {
  const parsedPayload = itemCreateSchema.safeParse(buildCreateItemPayload(data));

  if (!parsedPayload.success) {
    return {
      success: false,
      error: getFieldValidationError(parsedPayload.error),
    };
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to create items.",
    };
  }

  if (
    (parsedPayload.data.itemType === "file" || parsedPayload.data.itemType === "image") &&
    parsedPayload.data.fileUrl
  ) {
    const ownershipError = validateUploadedFileOwnership(userId, parsedPayload.data.fileUrl);

    if (ownershipError) {
      return {
        success: false,
        error: ownershipError,
      };
    }
  }

  const billingState = await getBillingState(userId);

  if (!billingState) {
    return {
      success: false,
      error: "User not found.",
    };
  }

  const billingGuard = canCreateItemForPlan({
    isPro: billingState.isPro,
    itemCount: billingState.itemCount,
    itemType: parsedPayload.data.itemType,
  });

  if (!billingGuard.allowed) {
    return {
      success: false,
      error: billingGuard.message ?? "Unable to create item.",
    };
  }

  try {
    const createdItem = await createItemRecord(userId, parsedPayload.data);

    if (!createdItem) {
      return {
        success: false,
        error: "Invalid item type.",
      };
    }

    return {
      success: true,
      data: createdItem,
    };
  } catch (error) {
    console.error("Failed to create item.", error);

    return {
      success: false,
      error: "Unable to create item.",
    };
  }
};

export const updateItem = async (
  itemId: string,
  data: UpdateItemPayload
): Promise<UpdateItemActionResult> => {
  const parsedPayload = itemUpdateSchema.safeParse(buildParsedPayload(data));

  if (!parsedPayload.success) {
    return {
      success: false,
      error: getFieldValidationError(parsedPayload.error),
    };
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update items.",
    };
  }

  const existingItem = await getOwnedItem(itemId, userId);

  if (!existingItem) {
    return {
      success: false,
      error: "Item not found.",
    };
  }

  try {
    const updatedItem = await updateItemRecord(itemId, userId, parsedPayload.data);

    if (!updatedItem) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    return {
      success: true,
      data: updatedItem,
    };
  } catch (error) {
    console.error("Failed to update item.", error);

    return {
      success: false,
      error: "Unable to update item.",
    };
  }
};

export const deleteItem = async (itemId: string): Promise<DeleteItemActionResult> => {
  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to delete items.",
    };
  }

  const existingItem = await getOwnedItem(itemId, userId);

  if (!existingItem) {
    return {
      success: false,
      error: "Item not found.",
    };
  }

  try {
    if (existingItem.fileUrl) {
      const objectKey = getObjectKeyFromFileUrl(existingItem.fileUrl);

      if (objectKey) {
        await deleteR2Object(objectKey);
      }
    }

    const deleted = await deleteItemRecord(itemId, userId);

    if (!deleted) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete item.", error);

    return {
      success: false,
      error: "Unable to delete item.",
    };
  }
};

export const toggleItemFavorite = async (
  itemId: string,
  isFavorite: boolean,
): Promise<ToggleItemFavoriteActionResult> => {
  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update items.",
    };
  }

  try {
    const updatedItem = await setItemFavoriteStateRecord(itemId, userId, isFavorite);

    if (!updatedItem) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    return {
      success: true,
      data: updatedItem,
    };
  } catch (error) {
    console.error("Failed to update item favorite state.", error);

    return {
      success: false,
      error: "Unable to update item.",
    };
  }
};

export const toggleItemPin = async (
  itemId: string,
  isPinned: boolean,
): Promise<ToggleItemPinActionResult> => {
  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update items.",
    };
  }

  try {
    const updatedItem = await setItemPinnedStateRecord(itemId, userId, isPinned);

    if (!updatedItem) {
      return {
        success: false,
        error: "Item not found.",
      };
    }

    return {
      success: true,
      data: updatedItem,
    };
  } catch (error) {
    console.error("Failed to update item pinned state.", error);

    return {
      success: false,
      error: "Unable to update item.",
    };
  }
};
