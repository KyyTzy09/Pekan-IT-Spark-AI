import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openaiDefault = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const heavyModelBaseUrl =
  process.env.HEAVY_MODEL_BASE_URL ??
  process.env.OPENAI_BASE_URL ??
  "https://api.groq.com/openai/v1";

// Groq API key rotation: collect all available keys
const groqKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];

// Create Groq clients for each key
const groqClients = groqKeys.map(
  (key) => new OpenAI({ baseURL: heavyModelBaseUrl, apiKey: key }),
);

// Primary client (first key) - for backward compatibility
const openaiHeavy = groqClients[0] ?? new OpenAI({
  baseURL: heavyModelBaseUrl,
  apiKey: process.env.HEAVY_MODEL_API_KEY ?? process.env.OPENAI_API_KEY,
});

// Track current key index for rotation
let currentGroqKeyIndex = 0;

function getNextGroqClient(): { client: OpenAI; keyIndex: number } {
  if (groqClients.length === 0) {
    return { client: openaiHeavy, keyIndex: -1 };
  }
  const index = currentGroqKeyIndex % groqClients.length;
  currentGroqKeyIndex = (currentGroqKeyIndex + 1) % groqClients.length;
  return { client: groqClients[index], keyIndex: index };
}

function rotateToNextGroqKey(): { client: OpenAI; keyIndex: number } {
  if (groqClients.length === 0) {
    return { client: openaiHeavy, keyIndex: -1 };
  }
  currentGroqKeyIndex = (currentGroqKeyIndex + 1) % groqClients.length;
  return { client: groqClients[currentGroqKeyIndex], keyIndex: currentGroqKeyIndex };
}

export const chatModel = "heavy" as const;
export const fastModel = "fast" as const;
export const embeddingModel = "embedding" as const;

type ChatMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

function logAIError(
  method: string,
  modelName: string,
  baseURL: string,
  err: unknown,
) {
  console.error(
    `[AI_ERROR] ${method} | model=${modelName} | endpoint=${baseURL} | msg=${err instanceof Error ? err.message : String(err)}`,
  );
}

function isRateLimitError(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err) {
    return (err as { status: number }).status === 429;
  }
  return false;
}

function getRetryAfter(err: unknown): number {
  if (err && typeof err === "object" && "headers" in err) {
    const h = (err as { headers: Headers }).headers;
    if (h && typeof h.get === "function") {
      const val = h.get("retry-after");
      if (val) return parseInt(val, 10) || 5;
    }
  }
  return 5;
}

const AI_TIMEOUT_MS = 30_000;
const AI_TIMEOUT_STREAM_MS = 60_000;
const AI_TIMEOUT_EMBED_MS = 15_000;

// Helper: try all Groq keys for a completion request
async function tryGroqCompletion(
  modelName: string,
  messages: ChatMessageParam[],
  temperature: number,
  isStream: false,
): Promise<{ text: string }>;
async function tryGroqCompletion(
  modelName: string,
  messages: ChatMessageParam[],
  temperature: number,
  isStream: true,
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>>;
async function tryGroqCompletion(
  modelName: string,
  messages: ChatMessageParam[],
  temperature: number,
  isStream: boolean,
): Promise<{ text: string } | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const totalKeys = groqClients.length;
  let lastErr: unknown;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const { client, keyIndex } = attempt === 0 ? getNextGroqClient() : rotateToNextGroqKey();
    const maskedKey = groqKeys[keyIndex]?.slice(0, 10) + "...";

    try {
      if (isStream) {
        console.log(`[AI_SERVICE] Groq attempt ${attempt + 1}/${totalKeys} with key[${keyIndex}] ${maskedKey}`);
        const stream = await client.chat.completions.create(
          { model: modelName, messages, temperature, stream: true },
          { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
        );
        return stream;
      } else {
        console.log(`[AI_SERVICE] Groq attempt ${attempt + 1}/${totalKeys} with key[${keyIndex}] ${maskedKey}`);
        const response = await client.chat.completions.create(
          { model: modelName, messages, temperature },
          { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
        );
        return { text: response.choices[0]?.message?.content || "" };
      }
    } catch (err) {
      lastErr = err;
      logAIError(`Groq key[${keyIndex}] ${maskedKey}`, modelName, heavyModelBaseUrl, err);

      // Retry with next key if available (any error: 429, 500, timeout, network, etc.)
      if (attempt < totalKeys - 1) {
        const reason = isRateLimitError(err) ? "Rate limited" : "Failed";
        console.warn(`[AI_SERVICE] ${reason} on key[${keyIndex}] ${maskedKey}, trying next key...`);
        continue;
      }
    }
  }

  throw lastErr;
}

export async function generateText({
  model,
  system,
  prompt,
  temperature = 0.7,
}: {
  model: "heavy" | "fast" | "embedding";
  system?: string;
  prompt?: string;
  temperature?: number;
}) {
  const isHeavy = model === "heavy";
  const modelName = isHeavy
    ? (process.env.HEAVY_MODEL_NAME ?? "llama-3.3-70b-versatile")
    : "deepseek-v4-flash";

  console.log(`
=========================================
[AI_SERVICE] generateText REQUEST
-----------------------------------------
* Model Type: ${model} (Resolved Name: ${modelName})
* Endpoint:   ${isHeavy ? heavyModelBaseUrl : openaiDefault.baseURL}
* Temp:       ${temperature}
* System:
${system ? system : "(none)"}
* Prompt:
${prompt ? prompt : "(none)"}
=========================================
`);

  const messages: ChatMessageParam[] = [];
  if (system) {
    messages.push({ role: "system", content: system });
  }
  if (prompt) {
    messages.push({ role: "user", content: prompt });
  }

  // Heavy model: try Groq with key rotation
  if (isHeavy) {
    try {
      const result = await tryGroqCompletion(modelName, messages, temperature, false);
      console.log(`
=========================================
[AI_SERVICE] generateText RESPONSE
-----------------------------------------
* Model Used: ${modelName}
* Output Text:
${result.text}
=========================================
`);
      return result;
    } catch (err) {
      // All Groq keys failed, fall through to fallbacks
      console.warn(`[AI_SERVICE] All Groq keys failed. Trying fallbacks...`);

      // Fallback 1: Gemini (free)
      if (gemini) {
        console.warn(`[AI_SERVICE] Trying Gemini gemini-2.0-flash...`);
        try {
          const geminiModel = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
          const promptText = system ? `${system}\n\n${prompt || ""}` : prompt || "";
          const result = await geminiModel.generateContent(promptText);
          const textResult = result.response.text();
          console.log(`
=========================================
[AI_SERVICE] generateText RESPONSE (Gemini)
-----------------------------------------
* Model Used: gemini-2.0-flash
* Output Text:
${textResult}
=========================================
`);
          return { text: textResult };
        } catch (geminiErr) {
          logAIError("generateText (Fallback: Gemini)", "gemini-2.0-flash", "generativelanguage.googleapis.com", geminiErr);
        }
      }

      // Fallback 2: fast model on Sumopod
      console.warn(`[AI_SERVICE] Trying deepseek-v4-flash on Sumopod...`);
      try {
        const response = await openaiDefault.chat.completions.create(
          { model: "deepseek-v4-flash", messages, temperature },
          { timeout: AI_TIMEOUT_MS, maxRetries: 0 },
        );
        const textResult = response.choices[0]?.message?.content || "";
        return { text: textResult };
      } catch (fallbackSumopodErr) {
        logAIError("generateText (Fallback: deepseek-v4-flash)", "deepseek-v4-flash", openaiDefault.baseURL, fallbackSumopodErr);
      }

      // Fallback 3: glm-5 on Groq (first available client)
      try {
        const response = await openaiHeavy.chat.completions.create(
          { model: "glm-5", messages, temperature },
          { timeout: AI_TIMEOUT_MS, maxRetries: 0 },
        );
        const textResult = response.choices[0]?.message?.content || "";
        return { text: textResult };
      } catch (fallbackGlmErr) {
        logAIError("generateText (Fallback: glm-5)", "glm-5", heavyModelBaseUrl, fallbackGlmErr);
        throw err;
      }
    }
  }

  // Non-heavy model: direct call to Sumopod
  try {
    const response = await openaiDefault.chat.completions.create(
      { model: modelName, messages, temperature },
      { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
    );
    const textResult = response.choices[0]?.message?.content || "";
    return { text: textResult };
  } catch (err) {
    logAIError("generateText", modelName, openaiDefault.baseURL, err);
    throw err;
  }
}

export async function streamText({
  model,
  system,
  messages,
  temperature = 0.7,
}: {
  model: "heavy" | "fast" | "embedding";
  system?: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
}) {
  const isHeavy = model === "heavy";

  const apiMessages: ChatMessageParam[] = [];
  if (system) {
    apiMessages.push({ role: "system", content: system });
  }
  for (const m of messages) {
    apiMessages.push({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    });
  }

  if (isHeavy) {
    const heavyModelName =
      process.env.HEAVY_MODEL_NAME ?? "llama-3.3-70b-versatile";

    // Try Groq with key rotation
    try {
      const stream = await tryGroqCompletion(heavyModelName, apiMessages, temperature, true);

      console.log(`[AI_SERVICE] streamText streaming started (Groq)`);
      let chunkCount = 0;
      let fullText = "";

      return {
        text: (async () => {
          for await (const chunk of stream) {
            chunkCount++;
            const content = chunk.choices[0]?.delta?.content || "";
            fullText += content;
          }
          console.log(`[AI_SERVICE] streamText streaming completed, chunks: ${chunkCount}`);
          console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE (Groq)
-----------------------------------------
* Model Used: ${heavyModelName}
* Output Text:
${fullText}
=========================================
`);
          return fullText;
        })(),
      };
    } catch (groqErr) {
      // All Groq keys failed, try fallbacks
      console.warn(`[AI_SERVICE] All Groq keys failed for streamText. Trying fallbacks...`);

      // Fallback 1: Gemini (free)
      if (gemini) {
        console.warn(`[AI_SERVICE] Trying Gemini gemini-2.0-flash for streamText...`);
        try {
          const geminiModel = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });
          const promptText = apiMessages.map(m => m.content).join("\n");
          const result = await geminiModel.generateContentStream(promptText);

          let fullText = "";
          return {
            text: (async () => {
              for await (const chunk of result.stream) {
                const content = chunk.text() || "";
                fullText += content;
              }
              console.log(`[AI_SERVICE] streamText Gemini completed`);
              console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE (Gemini)
-----------------------------------------
* Model Used: gemini-2.0-flash
* Output Text:
${fullText}
=========================================
`);
              return fullText;
            })(),
          };
        } catch (geminiErr) {
          logAIError("streamText (Fallback: Gemini)", "gemini-2.0-flash", "generativelanguage.googleapis.com", geminiErr);
        }
      }

      // Fallback 2: Sumopod
      const sumopodModel = "deepseek-v4-flash";
      try {
        const stream = await openaiDefault.chat.completions.create(
          { model: sumopodModel, messages: apiMessages, temperature, stream: true },
          { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
        );

        let chunkCount = 0;
        let fullText = "";
        return {
          text: (async () => {
            for await (const chunk of stream) {
              chunkCount++;
              fullText += chunk.choices[0]?.delta?.content || "";
            }
            console.log(`[AI_SERVICE] streamText fallback completed, chunks: ${chunkCount}`);
            return fullText;
          })(),
        };
      } catch (sumopodErr) {
        logAIError("streamText (Fallback: Sumopod)", sumopodModel, openaiDefault.baseURL, sumopodErr);
      }

      // Fallback 2: glm-5 on Groq
      try {
        const stream = await openaiHeavy.chat.completions.create(
          { model: "glm-5", messages: apiMessages, temperature, stream: true },
          { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
        );

        let chunkCount = 0;
        let fullText = "";
        return {
          text: (async () => {
            for await (const chunk of stream) {
              chunkCount++;
              fullText += chunk.choices[0]?.delta?.content || "";
            }
            console.log(`[AI_SERVICE] streamText glm-5 fallback completed, chunks: ${chunkCount}`);
            return fullText;
          })(),
        };
      } catch (glmErr) {
        logAIError("streamText (Fallback: glm-5)", "glm-5", heavyModelBaseUrl, glmErr);
        throw groqErr;
      }
    }
  } else {
    // Non-heavy: Sumopod direct
    const modelName = "deepseek-v4-flash";
    const stream = await openaiDefault.chat.completions.create(
      { model: modelName, messages: apiMessages, temperature, stream: true },
      { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
    );

    let chunkCount = 0;
    let fullText = "";
    return {
      text: (async () => {
        for await (const chunk of stream) {
          chunkCount++;
          fullText += chunk.choices[0]?.delta?.content || "";
        }
        console.log(`[AI_SERVICE] streamText completed, chunks: ${chunkCount}`);
        return fullText;
      })(),
    };
  }
}

// Gemini for fallback
const geminiApiKey = process.env.GEMINI_API_KEY ?? "";
const gemini = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

export async function embed({
  model: _model,
  value,
}: {
  model: "heavy" | "fast" | "embedding";
  value: string;
}) {
  const modelName = "text-embedding-3-small";
  const baseURL = openaiDefault.baseURL;
  console.log(`
=========================================
[AI_SERVICE] embed REQUEST
-----------------------------------------
* Model Type: embedding
* Model Name: ${modelName}
* Endpoint:   ${baseURL}
* Value:      "${value.slice(0, 200)}${value.length > 200 ? "..." : ""}" (Total Length: ${value.length})
=========================================
`);
  try {
    const response = await openaiDefault.embeddings.create(
      {
        model: modelName,
        input: value,
      },
      { timeout: AI_TIMEOUT_EMBED_MS, maxRetries: 0 },
    );
    const embedding = response.data[0]?.embedding || [];
    console.log(`
=========================================
[AI_SERVICE] embed RESPONSE
-----------------------------------------
* Model Used: ${response.model || modelName}
* Dimensions: ${embedding.length}
=========================================
`);
    return {
      embedding,
    };
  } catch (err) {
    logAIError("embed", modelName, baseURL, err);
    throw err;
  }
}

export async function embedMany({
  model: _model,
  values,
}: {
  model: "heavy" | "fast" | "embedding";
  values: string[];
}) {
  const modelName = "text-embedding-3-small";
  const baseURL = openaiDefault.baseURL;
  console.log(`
=========================================
[AI_SERVICE] embedMany REQUEST
-----------------------------------------
* Model Type: embedding
* Model Name: ${modelName}
* Endpoint:   ${baseURL}
* Count:      ${values.length}
* Inputs:
${values
  .map((v, i) => `  [${i}]: "${v.slice(0, 100)}${v.length > 100 ? "..." : ""}"`)
  .slice(0, 10)
  .join("\n")}
${values.length > 10 ? `  ... and ${values.length - 10} more inputs` : ""}
=========================================
`);
  try {
    const response = await openaiDefault.embeddings.create(
      {
        model: modelName,
        input: values,
      },
      { timeout: AI_TIMEOUT_EMBED_MS, maxRetries: 0 },
    );
    const embeddings = response.data.map((item) => item.embedding);
    console.log(`
=========================================
[AI_SERVICE] embedMany RESPONSE
-----------------------------------------
* Model Used: ${response.model || modelName}
* Count:      ${embeddings.length}
* Dimensions: ${embeddings[0]?.length || 0}
=========================================
`);
    return {
      embeddings,
    };
  } catch (err) {
    logAIError("embedMany", modelName, baseURL, err);
    throw err;
  }
}

export function safeParseJson(text: string): unknown {
  // 1. Try to find content within ```json and ```
  const jsonBlocks: string[] = [];
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/gi;
  let match = jsonRegex.exec(text);
  while (match !== null) {
    if (match[1]) jsonBlocks.push(match[1].trim());
    match = jsonRegex.exec(text);
  }

  // Also try general code blocks if no json blocks found
  if (jsonBlocks.length === 0) {
    const codeRegex = /```\s*([\s\S]*?)\s*```/gi;
    let codeMatch = codeRegex.exec(text);
    while (codeMatch !== null) {
      if (codeMatch[1]) jsonBlocks.push(codeMatch[1].trim());
      codeMatch = codeRegex.exec(text);
    }
  }

  // Try to parse any extracted blocks
  for (const block of jsonBlocks) {
    try {
      return parseCleanedJson(block);
    } catch (_e) {}
  }

  // 2. If no code blocks parsed successfully, look for braces/brackets in the whole text
  try {
    return parseCleanedJson(text);
  } catch (err) {
    // Try to find the first '{' and last '}'
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return parseCleanedJson(text.slice(firstBrace, lastBrace + 1));
      } catch (_e) {}
    }

    // Try to find the first '[' and last ']'
    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (
      firstBracket !== -1 &&
      lastBracket !== -1 &&
      lastBracket > firstBracket
    ) {
      try {
        return parseCleanedJson(text.slice(firstBracket, lastBracket + 1));
      } catch (_e) {}
    }

    throw err;
  }
}

function parseCleanedJson(str: string): unknown {
  let cleaned = str.trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Remove trailing commas in objects/arrays, single-line/multi-line comments
    cleaned = cleaned
      .replace(/,\s*([\]}])/g, "$1")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");

    try {
      return JSON.parse(cleaned);
    } catch (_e) {
      throw err;
    }
  }
}
