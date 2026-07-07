import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  checkAiRateLimitMock,
  getBillingStateMock,
  getOpenAIClientMock,
  openAIResponsesCreateMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  checkAiRateLimitMock: vi.fn(),
  getBillingStateMock: vi.fn(),
  getOpenAIClientMock: vi.fn(),
  openAIResponsesCreateMock: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/billing", () => ({
  getBillingState: getBillingStateMock,
}));

vi.mock("@/lib/ai/openai", () => ({
  AI_MODEL: "gpt-5-nano",
  getOpenAIClient: getOpenAIClientMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkAiRateLimit: checkAiRateLimitMock,
  getRateLimitMessage: (reset: number) =>
    `Too many attempts. Please try again in ${Math.max(1, Math.ceil((reset - Date.now()) / 60_000))} minute(s).`,
  isRateLimitUnavailable: (result: { reason: "limited" | "unavailable" | null }) =>
    result.reason === "unavailable",
}));

import {
  explainCode,
  generateAutoTags,
  generateDescriptionSummary,
  optimizePrompt,
} from "@/actions/ai";

const setupAiActionMocks = () => {
  authMock.mockReset();
  checkAiRateLimitMock.mockReset();
  getBillingStateMock.mockReset();
  getOpenAIClientMock.mockReset();
  openAIResponsesCreateMock.mockReset();
  getOpenAIClientMock.mockReturnValue({
    responses: {
      create: openAIResponsesCreateMock,
    },
  });
  checkAiRateLimitMock.mockResolvedValue({
    remaining: 19,
    reason: null,
    reset: Date.now(),
    success: true,
  });
};

describe("generateAutoTags action", () => {
  beforeEach(() => {
    setupAiActionMocks();
  });

  it("rejects unauthenticated AI tag requests", async () => {
    authMock.mockResolvedValue(null);

    const result = await generateAutoTags({
      itemType: "snippet",
      title: "Sort an array",
      tags: [],
    });

    expect(result).toEqual({
      success: false,
      error: "You must be signed in to suggest tags.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("blocks free users from AI tag suggestions", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      itemCount: 2,
    });

    const result = await generateAutoTags({
      content: "const sorted = items.sort(compare);",
      itemType: "snippet",
      tags: [],
      title: "Sort helper",
    });

    expect(result).toEqual({
      success: false,
      error: "Upgrade to Pro to use AI tag suggestions.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("returns a rate limit message when the AI bucket is exceeded", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    checkAiRateLimitMock.mockResolvedValue({
      remaining: 0,
      reason: "limited",
      reset: Date.now() + 120_000,
      success: false,
    });

    const result = await generateAutoTags({
      content: "const sorted = items.sort(compare);",
      itemType: "snippet",
      tags: [],
      title: "Sort helper",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Too many attempts.");
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("normalizes OpenAI suggestions, removes existing tags, and limits to five tags", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({
        tags: ["React", "hooks", "react", "#TypeScript", "forms", "ui", "testing"],
      }),
    });

    const result = await generateAutoTags({
      content: "Build a React form hook with TypeScript validation.",
      itemType: "snippet",
      tags: ["react"],
      title: "Form hook",
    });

    expect(openAIResponsesCreateMock).toHaveBeenCalledOnce();
    expect(result).toEqual({
      success: true,
      data: {
        tags: ["hooks", "typescript", "forms", "ui", "testing"],
      },
    });
  });

  it("accepts array-shaped OpenAI responses", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify(["Next.js", "Caching", "Server Actions"]),
    });

    const result = await generateAutoTags({
      content: "Use server actions with caching in a Next.js app.",
      itemType: "note",
      tags: [],
      title: "Next.js notes",
    });

    expect(result).toEqual({
      success: true,
      data: {
        tags: ["next.js", "caching", "server actions"],
      },
    });
  });

  it("returns a safe error when the AI response is invalid", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: "not json",
    });

    const result = await generateAutoTags({
      content: "console.log('hi')",
      itemType: "snippet",
      tags: [],
      title: "Logger",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to generate tag suggestions right now.",
    });
  });
});

describe("generateDescriptionSummary action", () => {
  beforeEach(() => {
    setupAiActionMocks();
  });

  it("rejects summary requests with no usable item input", async () => {
    const result = await generateDescriptionSummary({
      itemType: "snippet",
      title: "   ",
    });

    expect(result).toEqual({
      success: false,
      error: "Add a title, content, URL, or file before generating a description.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("blocks free users from AI descriptions", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      itemCount: 2,
    });

    const result = await generateDescriptionSummary({
      content: "Build a sorted helper for arrays.",
      itemType: "snippet",
      title: "Sort helper",
    });

    expect(result).toEqual({
      success: false,
      error: "Upgrade to Pro to use AI descriptions.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("uses the summary AI rate-limit bucket", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({
        summary: "A helper for sorting arrays with a reusable compare callback.",
      }),
    });

    const result = await generateDescriptionSummary({
      content: "const sorted = items.sort(compare);",
      itemType: "snippet",
      title: "Sort helper",
    });

    expect(checkAiRateLimitMock).toHaveBeenCalledWith({
      identifier: "user-1",
      type: "summary",
    });
    expect(result).toEqual({
      success: true,
      data: {
        summary: "A helper for sorting arrays with a reusable compare callback.",
      },
    });
  });

  it("accepts file metadata for file and image summaries", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({
        summary: "A deployment checklist PDF for release prep and handoff reference.",
      }),
    });

    const result = await generateDescriptionSummary({
      fileName: "deployment-checklist.pdf",
      fileSize: 2048,
      itemType: "file",
      title: "Deployment checklist",
    });

    expect(result).toEqual({
      success: true,
      data: {
        summary: "A deployment checklist PDF for release prep and handoff reference.",
      },
    });
  });

  it("returns a safe error when the AI response is invalid", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: "not json",
    });

    const result = await generateDescriptionSummary({
      content: "Use a route handler to verify a webhook signature.",
      itemType: "note",
      title: "Webhook notes",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to generate a description right now.",
    });
  });
});

describe("explainCode action", () => {
  beforeEach(() => {
    setupAiActionMocks();
  });

  it("rejects explain requests without code content", async () => {
    const result = await explainCode({
      content: "   ",
      itemType: "snippet",
      title: "Array helper",
    });

    expect(result).toEqual({
      success: false,
      error: "Add code or a command before requesting an explanation.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("blocks free users from AI code explanations", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      itemCount: 2,
    });

    const result = await explainCode({
      content: "git rebase -i HEAD~3",
      itemType: "command",
      title: "Interactive rebase",
    });

    expect(result).toEqual({
      success: false,
      error: "Upgrade to Pro to use AI code explanations.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("uses the explain AI rate-limit bucket", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({
        explanation: "This command rewrites the last three commits by opening the interactive rebase todo list.",
      }),
    });

    const result = await explainCode({
      content: "git rebase -i HEAD~3",
      itemType: "command",
      title: "Interactive rebase",
    });

    expect(checkAiRateLimitMock).toHaveBeenCalledWith({
      identifier: "user-1",
      type: "explain",
    });
    expect(result).toEqual({
      success: true,
      data: {
        explanation: "This command rewrites the last three commits by opening the interactive rebase todo list.",
      },
    });
  });

  it("accepts string-shaped OpenAI explanation responses", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify("This snippet sorts items in place and relies on the provided comparator to control the final order."),
    });

    const result = await explainCode({
      content: "items.sort(compare)",
      itemType: "snippet",
      title: "Sort helper",
    });

    expect(result).toEqual({
      success: true,
      data: {
        explanation: "This snippet sorts items in place and relies on the provided comparator to control the final order.",
      },
    });
  });

  it("returns a safe error when the AI explanation response is invalid", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: "not json",
    });

    const result = await explainCode({
      content: "items.sort(compare)",
      itemType: "snippet",
      title: "Sort helper",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to explain this code right now.",
    });
  });
});

describe("optimizePrompt action", () => {
  beforeEach(() => {
    setupAiActionMocks();
  });

  it("rejects optimization requests without prompt content", async () => {
    const result = await optimizePrompt({
      content: "   ",
      title: "Prompt draft",
    });

    expect(result).toEqual({
      success: false,
      error: "Add prompt text before requesting optimization.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("blocks free users from AI prompt optimization", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: false,
      itemCount: 2,
    });

    const result = await optimizePrompt({
      content: "Write a release note for this pull request.",
      title: "Release note prompt",
    });

    expect(result).toEqual({
      success: false,
      error: "Upgrade to Pro to use AI prompt optimization.",
    });
    expect(openAIResponsesCreateMock).not.toHaveBeenCalled();
  });

  it("uses the prompt optimization AI rate-limit bucket", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({
        changed: true,
        optimizedPrompt:
          "Write concise release notes for this pull request. Include user-facing changes, breaking changes, and deployment notes.",
      }),
    });

    const result = await optimizePrompt({
      content: "Write a release note for this pull request.",
      title: "Release note prompt",
    });

    expect(checkAiRateLimitMock).toHaveBeenCalledWith({
      identifier: "user-1",
      type: "optimizePrompt",
    });
    expect(result).toEqual({
      success: true,
      data: {
        changed: true,
        optimizedPrompt:
          "Write concise release notes for this pull request. Include user-facing changes, breaking changes, and deployment notes.",
      },
    });
  });

  it("returns no-change when the model says the prompt is already good", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: JSON.stringify({
        changed: false,
        optimizedPrompt: "",
      }),
    });

    const result = await optimizePrompt({
      content: "Summarize this API error and list the likely root cause.",
      title: "API error summary prompt",
    });

    expect(result).toEqual({
      success: true,
      data: {
        changed: false,
        optimizedPrompt: null,
      },
    });
  });

  it("returns a safe error when the AI optimization response is invalid", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "user-1",
      },
    });
    getBillingStateMock.mockResolvedValue({
      isPro: true,
      itemCount: 2,
    });
    openAIResponsesCreateMock.mockResolvedValue({
      output_text: "not json",
    });

    const result = await optimizePrompt({
      content: "Summarize this API error and list the likely root cause.",
      title: "API error summary prompt",
    });

    expect(result).toEqual({
      success: false,
      error: "Unable to optimize this prompt right now.",
    });
  });
});
