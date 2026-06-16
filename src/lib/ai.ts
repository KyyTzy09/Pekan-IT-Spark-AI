import { createOpenAI } from "@ai-sdk/openai";

// Default OpenAI provider (e.g. Sumopod)
export const provider = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const heavyModelBaseUrl =
  process.env.HEAVY_MODEL_BASE_URL ??
  process.env.OPENAI_BASE_URL ??
  "https://api.openai.com/v1";

// Separate provider for heavy reasoning tasks (Socratic tutor, challenge
// generation, curriculum design, answer evaluation).
const heavyProvider = createOpenAI({
  baseURL: heavyModelBaseUrl,
  apiKey: process.env.HEAVY_MODEL_API_KEY ?? process.env.OPENAI_API_KEY,
});

export const chatModel = heavyProvider.chat(
  process.env.HEAVY_MODEL_NAME ?? "mimo-v2.5-pro",
);
export const fastModel = provider.chat("gpt-4o-mini");
export const embeddingModel = provider.embedding("text-embedding-3-small");
