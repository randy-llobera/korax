import "server-only";

import OpenAI from "openai";

export const AI_MODEL = "gpt-5-nano";

let client: OpenAI | null = null;

export const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
};
