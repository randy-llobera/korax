"use server";

import { z } from "zod";

import { getSessionUserId } from "@/lib/actions/auth";
import {
  editorPreferencesPatchSchema,
  mergeEditorPreferences,
  type EditorPreferences,
  type EditorPreferencesPatch,
} from "@/lib/editors/preferences";
import { prisma } from "@/lib/prisma";

interface UpdateEditorPreferencesActionResult {
  success: boolean;
  data?: EditorPreferences;
  error?: string;
}

export const updateEditorPreferences = async (
  patch: EditorPreferencesPatch,
): Promise<UpdateEditorPreferencesActionResult> => {
  const parsedPatch = editorPreferencesPatchSchema.safeParse(patch);

  if (!parsedPatch.success) {
    return {
      success: false,
      error: "Editor preferences payload is invalid.",
    };
  }

  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to update editor preferences.",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        editorPreferences: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found.",
      };
    }

    const nextPreferences = mergeEditorPreferences(
      user.editorPreferences,
      parsedPatch.data,
    );

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        editorPreferences: nextPreferences,
      },
    });

    return {
      success: true,
      data: nextPreferences,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Editor preferences payload is invalid.",
      };
    }

    console.error("Failed to update editor preferences.", error);

    return {
      success: false,
      error: "Unable to update editor preferences.",
    };
  }
};
