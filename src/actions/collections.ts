"use server";

import { z } from "zod";

import {
  getFieldValidationError,
  normalizeOptionalText,
} from "@/lib/actions/validation";
import { getSessionUserId } from "@/lib/actions/auth";
import { canCreateCollectionForPlan } from "@/lib/billing/guards";
import { getBillingState } from "@/lib/db/billing";
import {
  createCollection as createCollectionRecord,
  deleteCollection as deleteCollectionRecord,
  updateCollection as updateCollectionRecord,
} from "@/lib/db/collections";

const collectionCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required."),
  description: z
    .string()
    .trim()
    .nullable()
    .optional(),
});

type CreateCollectionPayload = z.input<typeof collectionCreateSchema>;
type UpdateCollectionPayload = z.input<typeof collectionCreateSchema>;

export interface CreateCollectionActionError {
  message: string;
  fieldErrors?: Partial<Record<keyof CreateCollectionPayload, string[]>>;
}

export interface UpdateCollectionActionError {
  message: string;
  fieldErrors?: Partial<Record<keyof UpdateCollectionPayload, string[]>>;
}

interface CreateCollectionActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof createCollectionRecord>>;
  error?: CreateCollectionActionError | string;
}

interface UpdateCollectionActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof updateCollectionRecord>>;
  error?: UpdateCollectionActionError | string;
}

interface DeleteCollectionActionResult {
  success: boolean;
  error?: string;
}

interface ToggleCollectionFavoriteActionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof updateCollectionRecord>>;
  error?: string;
}

const buildCreateCollectionPayload = (data: CreateCollectionPayload) => ({
  name: data.name,
  ...(Object.prototype.hasOwnProperty.call(data, "description")
    ? { description: normalizeOptionalText(data.description) }
    : {}),
});

export const createCollection = async (
  data: CreateCollectionPayload,
): Promise<CreateCollectionActionResult> => {
  const parsedPayload = collectionCreateSchema.safeParse(
    buildCreateCollectionPayload(data),
  );

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
      error: "You must be signed in to create collections.",
    };
  }

  const billingState = await getBillingState(userId);

  if (!billingState) {
    return {
      success: false,
      error: "User not found.",
    };
  }

  const billingGuard = canCreateCollectionForPlan({
    isPro: billingState.isPro,
    collectionCount: billingState.collectionCount,
  });

  if (!billingGuard.allowed) {
    return {
      success: false,
      error: billingGuard.message ?? "Unable to create collection.",
    };
  }

  try {
    const createdCollection = await createCollectionRecord(userId, parsedPayload.data);

    return {
      success: true,
      data: createdCollection,
    };
  } catch (error) {
    console.error("Failed to create collection.", error);

    return {
      success: false,
      error: "Unable to create collection.",
    };
  }
};

export const updateCollection = async (
  collectionId: string,
  data: UpdateCollectionPayload,
): Promise<UpdateCollectionActionResult> => {
  const parsedPayload = collectionCreateSchema.safeParse(
    buildCreateCollectionPayload(data),
  );

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
      error: "You must be signed in to update collections.",
    };
  }

  try {
    const updatedCollection = await updateCollectionRecord(
      userId,
      collectionId,
      parsedPayload.data,
    );

    if (!updatedCollection) {
      return {
        success: false,
        error: "Collection not found.",
      };
    }

    return {
      success: true,
      data: updatedCollection,
    };
  } catch (error) {
    console.error("Failed to update collection.", error);

    return {
      success: false,
      error: "Unable to update collection.",
    };
  }
};

export const deleteCollection = async (
  collectionId: string,
): Promise<DeleteCollectionActionResult> => {
  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to delete collections.",
    };
  }

  try {
    const deletedCollection = await deleteCollectionRecord(userId, collectionId);

    if (!deletedCollection) {
      return {
        success: false,
        error: "Collection not found.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete collection.", error);

    return {
      success: false,
      error: "Unable to delete collection.",
    };
  }
};

export const toggleCollectionFavorite = async (
  collectionId: string,
  isFavorite: boolean,
): Promise<ToggleCollectionFavoriteActionResult> => {
  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update collections.",
    };
  }

  try {
    const updatedCollection = await updateCollectionRecord(userId, collectionId, {
      isFavorite,
    });

    if (!updatedCollection) {
      return {
        success: false,
        error: "Collection not found.",
      };
    }

    return {
      success: true,
      data: updatedCollection,
    };
  } catch (error) {
    console.error("Failed to update collection favorite state.", error);

    return {
      success: false,
      error: "Unable to update collection.",
    };
  }
};
