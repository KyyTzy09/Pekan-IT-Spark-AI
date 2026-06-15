import { createOpenAI } from "@ai-sdk/openai";

export const provider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

export const chatModel = provider.chat("deepseek-v4-flash");
export const fastModel = provider.chat("gpt-4o-mini");
export const embeddingModel = provider.embedding("text-embedding-3-small");
