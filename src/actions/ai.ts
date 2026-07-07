"use server";

import { z } from "zod";

import { getSessionUserId } from "@/lib/actions/auth";
import { getBillingState } from "@/lib/db/billing";
import { formatFileSize } from "@/lib/files/size";
import { getOpenAIClient, AI_MODEL } from "@/lib/ai/openai";
import { checkAiRateLimit, getRateLimitMessage, isRateLimitUnavailable } from "@/lib/rate-limit";
import { canUseAiFeatures } from "@/lib/billing/usage-limits";

const autoTagSchema = z.object({
  itemType: z.string().trim().min(1, "Item type is required."),
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(500).optional(),
  content: z.string().trim().optional(),
  language: z.string().trim().max(100).optional(),
  url: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).max(25).default([]),
});

type GenerateAutoTagsPayload = z.input<typeof autoTagSchema>;

const descriptionSummarySchema = z.object({
  itemType: z.string().trim().min(1, "Item type is required."),
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(500).optional(),
  content: z.string().trim().optional(),
  language: z.string().trim().max(100).optional(),
  url: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  fileName: z.string().trim().max(255).optional(),
  fileSize: z.number().int().nonnegative().optional(),
});

type GenerateDescriptionSummaryPayload = z.input<typeof descriptionSummarySchema>;

const explainCodeSchema = z.object({
  itemType: z.enum(["snippet", "command"]),
  title: z.string().trim().max(200).default(""),
  content: z.string().trim().min(1, "Content is required."),
  language: z.string().trim().max(100).optional(),
});

type ExplainCodePayload = z.input<typeof explainCodeSchema>;

const optimizePromptSchema = z.object({
  title: z.string().trim().max(200).default(""),
  description: z.string().trim().max(500).optional(),
  content: z.string().trim().min(1, "Content is required."),
});

type OptimizePromptPayload = z.input<typeof optimizePromptSchema>;

interface GenerateAutoTagsActionResult {
  success: boolean;
  data?: {
    tags: string[];
  };
  error?: string;
}

interface GenerateDescriptionSummaryActionResult {
  success: boolean;
  data?: {
    summary: string;
  };
  error?: string;
}

interface ExplainCodeActionResult {
  success: boolean;
  data?: {
    explanation: string;
  };
  error?: string;
}

interface OptimizePromptActionResult {
  success: boolean;
  data?: {
    changed: boolean;
    optimizedPrompt: string | null;
  };
  error?: string;
}

const AUTO_TAG_RATE_LIMIT_UNAVAILABLE_MESSAGE =
  "AI suggestions are temporarily unavailable. Please try again shortly.";

const autoTagResponseSchema = z.union([
  z.array(z.string()),
  z.object({
    tags: z.array(z.string()),
  }),
]);

const descriptionSummaryResponseSchema = z.union([
  z.string(),
  z.object({
    summary: z.string(),
  }),
]);

const explainCodeResponseSchema = z.union([
  z.string(),
  z.object({
    explanation: z.string(),
  }),
]);

const optimizePromptResponseSchema = z.object({
  changed: z.boolean(),
  optimizedPrompt: z.string(),
});

const normalizeTag = (value: string) =>
  value
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

const truncateAutoTagContent = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 2_000);
};

const truncateSummaryContent = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.slice(0, 4_000);
};

const getUrlHostname = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
};

const parseAutoTagResponse = (outputText: string, existingTags: string[]) => {
  const parsedJson = JSON.parse(outputText) as unknown;
  const parsedResponse = autoTagResponseSchema.parse(parsedJson);
  const rawTags = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.tags;
  const existingTagSet = new Set(existingTags.map(normalizeTag));
  const normalizedTags = Array.from(
    new Set(
      rawTags
        .map(normalizeTag)
        .filter((tag) => tag.length > 0 && !existingTagSet.has(tag)),
    ),
  ).slice(0, 5);

  if (normalizedTags.length === 0) {
    throw new Error("No valid tag suggestions were returned.");
  }

  return normalizedTags;
};

const parseDescriptionSummaryResponse = (outputText: string) => {
  const parsedJson = JSON.parse(outputText) as unknown;
  const parsedResponse = descriptionSummaryResponseSchema.parse(parsedJson);
  const summary =
    typeof parsedResponse === "string" ? parsedResponse : parsedResponse.summary;
  const normalizedSummary = summary.replace(/\s+/g, " ").trim();

  if (!normalizedSummary) {
    throw new Error("No summary was returned.");
  }

  return normalizedSummary;
};

const parseExplainCodeResponse = (outputText: string) => {
  const parsedJson = JSON.parse(outputText) as unknown;
  const parsedResponse = explainCodeResponseSchema.parse(parsedJson);
  const explanation =
    typeof parsedResponse === "string"
      ? parsedResponse
      : parsedResponse.explanation;
  const normalizedExplanation = explanation.trim();

  if (!normalizedExplanation) {
    throw new Error("No explanation was returned.");
  }

  return normalizedExplanation;
};

const parseOptimizePromptResponse = (
  outputText: string,
  currentPrompt: string,
) => {
  const parsedJson = JSON.parse(outputText) as unknown;
  const parsedResponse = optimizePromptResponseSchema.parse(parsedJson);
  const normalizedPrompt = parsedResponse.optimizedPrompt.trim();
  const hasMeaningfulChange =
    parsedResponse.changed && normalizedPrompt.length > 0 && normalizedPrompt !== currentPrompt.trim();

  return {
    changed: hasMeaningfulChange,
    optimizedPrompt: hasMeaningfulChange ? normalizedPrompt : null,
  };
};

const buildAutoTagPrompt = (data: z.output<typeof autoTagSchema>) => {
  const promptSections = [
    'Return valid JSON in the shape {"tags":["tag"]}.',
    `Item type: ${data.itemType}`,
    `Title: ${data.title || "N/A"}`,
    `Description: ${data.description || "N/A"}`,
    `Language: ${data.language || "N/A"}`,
    `URL hostname: ${getUrlHostname(data.url) || "N/A"}`,
    `Existing tags: ${data.tags.length > 0 ? data.tags.join(", ") : "None"}`,
    `Content (truncated to 2000 chars):\n${truncateAutoTagContent(data.content) || "N/A"}`,
  ];

  return promptSections.join("\n\n");
};

const buildDescriptionSummaryPrompt = (data: z.output<typeof descriptionSummarySchema>) => {
  const promptSections = [
    'Return valid JSON in the shape {"summary":"text"}.',
    `Item type: ${data.itemType}`,
    `Title: ${data.title || "N/A"}`,
    `Existing description: ${data.description || "N/A"}`,
    `Language: ${data.language || "N/A"}`,
    `URL: ${data.url || "N/A"}`,
    `URL hostname: ${getUrlHostname(data.url) || "N/A"}`,
    `File name: ${data.fileName || "N/A"}`,
    `File size: ${formatFileSize(data.fileSize) || "N/A"}`,
    `Content (truncated to 4000 chars):\n${truncateSummaryContent(data.content) || "N/A"}`,
  ];

  return promptSections.join("\n\n");
};

const buildExplainCodePrompt = (data: z.output<typeof explainCodeSchema>) => {
  const promptSections = [
    'Return valid JSON in the shape {"explanation":"markdown"}.',
    `Item type: ${data.itemType}`,
    `Title: ${data.title || "N/A"}`,
    `Language: ${data.language || "N/A"}`,
    `Content (truncated to 4000 chars):\n${truncateSummaryContent(data.content)}`,
  ];

  return promptSections.join("\n\n");
};

const buildOptimizePromptInput = (data: z.output<typeof optimizePromptSchema>) => {
  const promptSections = [
    'Return valid JSON in the shape {"changed":boolean,"optimizedPrompt":"text"}.',
    "If the prompt is already clear, specific, and well-structured, set changed to false and optimizedPrompt to an empty string.",
    "If it needs improvement, keep the original intent and output only the refined prompt text in optimizedPrompt.",
    `Title: ${data.title || "N/A"}`,
    `Description: ${data.description || "N/A"}`,
    `Current prompt (truncated to 4000 chars):\n${truncateSummaryContent(data.content)}`,
  ];

  return promptSections.join("\n\n");
};

const getOpenAIErrorStatus = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  typeof error.status === "number"
    ? error.status
    : null;

const getOpenAIErrorRequestId = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "request_id" in error &&
  typeof error.request_id === "string"
    ? error.request_id
    : typeof error === "object" &&
        error !== null &&
        "requestID" in error &&
        typeof error.requestID === "string"
      ? error.requestID
      : null;

type AiRateLimitType = "autoTag" | "summary" | "explain" | "optimizePrompt";

interface RunAiJsonFeatureOptions<Result> {
  emptyOutputError: string;
  fallbackError: string;
  input: string;
  instructions: string;
  logMessage: string;
  metadataFeature: string;
  parseOutput: (outputText: string) => Result;
  rateLimitType: AiRateLimitType;
  signedInError: string;
  upgradeError: string;
}

type AiJsonFeatureResult<Result> =
  | {
      success: true;
      data: Result;
    }
  | {
      success: false;
      error: string;
    };

const runAiJsonFeature = async <Result>({
  emptyOutputError,
  fallbackError,
  input,
  instructions,
  logMessage,
  metadataFeature,
  parseOutput,
  rateLimitType,
  signedInError,
  upgradeError,
}: RunAiJsonFeatureOptions<Result>): Promise<AiJsonFeatureResult<Result>> => {
  const userId = await getSessionUserId();

  if (!userId) {
    return {
      success: false,
      error: signedInError,
    };
  }

  const billingState = await getBillingState(userId);

  if (!billingState) {
    return {
      success: false,
      error: "User not found.",
    };
  }

  if (!canUseAiFeatures({ isPro: billingState.isPro })) {
    return {
      success: false,
      error: upgradeError,
    };
  }

  const rateLimitResult = await checkAiRateLimit({
    identifier: userId,
    type: rateLimitType,
  });

  if (!rateLimitResult.success) {
    return {
      success: false,
      error: isRateLimitUnavailable(rateLimitResult)
        ? AUTO_TAG_RATE_LIMIT_UNAVAILABLE_MESSAGE
        : getRateLimitMessage(rateLimitResult.reset),
    };
  }

  try {
    const response = await getOpenAIClient().responses.create({
      model: AI_MODEL,
      instructions,
      input,
      metadata: {
        feature: metadataFeature,
        userId,
      },
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    if (!response.output_text) {
      return {
        success: false,
        error: emptyOutputError,
      };
    }

    return {
      success: true,
      data: parseOutput(response.output_text),
    };
  } catch (error) {
    const status = getOpenAIErrorStatus(error);
    const requestId = getOpenAIErrorRequestId(error);

    console.error(logMessage, {
      error,
      feature: metadataFeature,
      requestId,
      status,
      userId,
    });

    if (status === 429) {
      return {
        success: false,
        error: "AI suggestions are temporarily rate limited. Please try again shortly.",
      };
    }

    if (status === 400 || status === 401 || status === 403 || status === 422 || (status ?? 0) >= 500) {
      return {
        success: false,
        error: AUTO_TAG_RATE_LIMIT_UNAVAILABLE_MESSAGE,
      };
    }

    return {
      success: false,
      error: fallbackError,
    };
  }
};

export const generateAutoTags = async (
  data: GenerateAutoTagsPayload,
): Promise<GenerateAutoTagsActionResult> => {
  const parsedPayload = autoTagSchema.safeParse({
    ...data,
    content: data.content?.trim() ?? "",
    description: data.description?.trim() ?? "",
    language: data.language?.trim() ?? "",
    tags: data.tags ?? [],
    title: data.title?.trim() ?? "",
    url: data.url?.trim() ?? "",
  });

  if (!parsedPayload.success) {
    return {
      success: false,
      error: "Enter a valid item before requesting tag suggestions.",
    };
  }

  if (!parsedPayload.data.title && !parsedPayload.data.description && !parsedPayload.data.content) {
    return {
      success: false,
      error: "Add a title or content before requesting tag suggestions.",
    };
  }

  const result = await runAiJsonFeature({
    emptyOutputError: "Unable to generate tag suggestions right now.",
    fallbackError: "Unable to generate tag suggestions right now.",
    input: buildAutoTagPrompt(parsedPayload.data),
    instructions:
      "You suggest 3 to 5 concise freeform tags for a developer knowledge item. Return JSON only in the shape {\"tags\": [\"tag\"]}. Use lowercase tags, avoid duplicates, avoid generic filler, and do not repeat any existing tags.",
    logMessage: "Failed to generate auto tags.",
    metadataFeature: "auto-tagging",
    parseOutput: (outputText) => ({
      tags: parseAutoTagResponse(outputText, parsedPayload.data.tags),
    }),
    rateLimitType: "autoTag",
    signedInError: "You must be signed in to suggest tags.",
    upgradeError: "Upgrade to Pro to use AI tag suggestions.",
  });

  return result;
};

export const generateDescriptionSummary = async (
  data: GenerateDescriptionSummaryPayload,
): Promise<GenerateDescriptionSummaryActionResult> => {
  const parsedPayload = descriptionSummarySchema.safeParse({
    ...data,
    content: data.content?.trim() ?? "",
    description: data.description?.trim() ?? "",
    fileName: data.fileName?.trim() ?? "",
    language: data.language?.trim() ?? "",
    title: data.title?.trim() ?? "",
    url: data.url?.trim() ?? "",
  });

  if (!parsedPayload.success) {
    return {
      success: false,
      error: "Enter a valid item before generating a description.",
    };
  }

  if (
    !parsedPayload.data.title &&
    !parsedPayload.data.description &&
    !parsedPayload.data.content &&
    !parsedPayload.data.url &&
    !parsedPayload.data.fileName
  ) {
    return {
      success: false,
      error: "Add a title, content, URL, or file before generating a description.",
    };
  }

  const result = await runAiJsonFeature({
    emptyOutputError: "Unable to generate a description right now.",
    fallbackError: "Unable to generate a description right now.",
    input: buildDescriptionSummaryPrompt(parsedPayload.data),
    instructions:
      'You write concise descriptions for developer knowledge items. Return JSON only in the shape {"summary":"text"}. Write 1 to 2 sentences, keep it specific, use the provided item details only, and avoid filler.',
    logMessage: "Failed to generate description summary.",
    metadataFeature: "description-summary",
    parseOutput: (outputText) => ({
      summary: parseDescriptionSummaryResponse(outputText),
    }),
    rateLimitType: "summary",
    signedInError: "You must be signed in to generate descriptions.",
    upgradeError: "Upgrade to Pro to use AI descriptions.",
  });

  return result;
};

export const explainCode = async (
  data: ExplainCodePayload,
): Promise<ExplainCodeActionResult> => {
  const parsedPayload = explainCodeSchema.safeParse({
    ...data,
    content: data.content?.trim() ?? "",
    language: data.language?.trim() ?? "",
    title: data.title?.trim() ?? "",
  });

  if (!parsedPayload.success) {
    return {
      success: false,
      error: "Add code or a command before requesting an explanation.",
    };
  }

  const result = await runAiJsonFeature({
    emptyOutputError: "Unable to explain this code right now.",
    fallbackError: "Unable to explain this code right now.",
    input: buildExplainCodePrompt(parsedPayload.data),
    instructions:
      'You explain developer code and shell commands. Return JSON only in the shape {"explanation":"markdown"}. Write a concise explanation around 200 to 300 words. Cover what it does, how it works, and the key concepts or risks. Use short markdown paragraphs or bullets. Do not invent behavior not supported by the content.',
    logMessage: "Failed to explain code.",
    metadataFeature: "explain-code",
    parseOutput: (outputText) => ({
      explanation: parseExplainCodeResponse(outputText),
    }),
    rateLimitType: "explain",
    signedInError: "You must be signed in to explain code.",
    upgradeError: "Upgrade to Pro to use AI code explanations.",
  });

  return result;
};

export const optimizePrompt = async (
  data: OptimizePromptPayload,
): Promise<OptimizePromptActionResult> => {
  const parsedPayload = optimizePromptSchema.safeParse({
    ...data,
    content: data.content?.trim() ?? "",
    description: data.description?.trim() ?? "",
    title: data.title?.trim() ?? "",
  });

  if (!parsedPayload.success) {
    return {
      success: false,
      error: "Add prompt text before requesting optimization.",
    };
  }

  const result = await runAiJsonFeature({
    emptyOutputError: "Unable to optimize this prompt right now.",
    fallbackError: "Unable to optimize this prompt right now.",
    input: buildOptimizePromptInput(parsedPayload.data),
    instructions:
      'You improve prompts for developer workflows. Return JSON only in the shape {"changed":boolean,"optimizedPrompt":"text"}. Preserve the original intent. Improve clarity, structure, constraints, and output instructions only when needed. If the prompt is already strong, return {"changed":false,"optimizedPrompt":""}.',
    logMessage: "Failed to optimize prompt.",
    metadataFeature: "prompt-optimization",
    parseOutput: (outputText) =>
      parseOptimizePromptResponse(outputText, parsedPayload.data.content),
    rateLimitType: "optimizePrompt",
    signedInError: "You must be signed in to optimize prompts.",
    upgradeError: "Upgrade to Pro to use AI prompt optimization.",
  });

  return result;
};
