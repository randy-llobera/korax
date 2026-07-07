import { z } from "zod";

export const VALIDATION_ERROR_MESSAGE = "Please fix the highlighted fields.";

export const normalizeOptionalText = (value: string | null | undefined) => {
  if (typeof value !== "string") {
    return value ?? null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

export const getFieldValidationError = <Payload>(
  error: z.ZodError<Payload>,
): {
  message: string;
  fieldErrors: Partial<Record<keyof Payload, string[]>>;
} => ({
  message: VALIDATION_ERROR_MESSAGE,
  fieldErrors: error.flatten().fieldErrors as Partial<Record<keyof Payload, string[]>>,
});
