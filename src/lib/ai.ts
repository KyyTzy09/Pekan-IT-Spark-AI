import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { aiLog, maskKey, formatErr, EMOJI } from "./ai-logger";

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
const openaiHeavy =
  groqClients[0] ??
  new OpenAI({
    baseURL: heavyModelBaseUrl,
    apiKey: process.env.HEAVY_MODEL_API_KEY ?? process.env.OPENAI_API_KEY,
  });

// Atomic counter for key rotation — each call gets a unique key
let groqKeyCounter = 0;

function getNextGroqClient(): { client: OpenAI; keyIndex: number } {
  if (groqClients.length === 0) {
    return { client: openaiHeavy, keyIndex: -1 };
  }
  // Atomic increment then modulo — each concurrent request gets a different key
  const index = (groqKeyCounter++ & 0x7fffffff) % groqClients.length;
  return { client: groqClients[index], keyIndex: index };
}

export const chatModel = "heavy" as const;
export const fastModel = "fast" as const;
export const embeddingModel = "embedding" as const;

type ChatMessageParam = {
  role: "system" | "user" | "assistant";
  content: string;
};

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
): Promise<
  { text: string } | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
> {
  const totalKeys = groqClients.length;
  let lastErr: unknown;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const { client, keyIndex } = getNextGroqClient();
    const masked = maskKey(groqKeys[keyIndex]);

    aiLog.info(
      `${EMOJI.key} Groq [key ${keyIndex + 1}/${totalKeys}] ${masked} — percobaan ke-${attempt + 1}`,
    );

    try {
      if (isStream) {
        const stream = await client.chat.completions.create(
          { model: modelName, messages, temperature, stream: true },
          { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
        );
        return stream;
      } else {
        const response = await client.chat.completions.create(
          { model: modelName, messages, temperature },
          { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
        );
        return { text: response.choices[0]?.message?.content || "" };
      }
    } catch (err) {
      lastErr = err;

      // Coba key berikutnya kalau masih ada
      if (attempt < totalKeys - 1) {
        const reason = isRateLimitError(err)
          ? "rate limit (429)"
          : formatErr(err);
        aiLog.warn(
          `${EMOJI.retry} Groq key[${keyIndex}] gagal: ${reason} — coba key berikutnya...`,
        );
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

  aiLog.info(
    `${EMOJI.start} generateText → ${modelName} (temp: ${temperature})`,
  );

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
      const result = await tryGroqCompletion(
        modelName,
        messages,
        temperature,
        false,
      );
      aiLog.info(
        `${EMOJI.ok} generateText selesai (${result.text.length} karakter)`,
      );
      return result;
    } catch (err) {
      aiLog.warn(`${EMOJI.warn} Semua Groq key gagal — coba fallback...`);

      // Fallback 1: Gemini (free)
      if (gemini) {
        aiLog.info(`${EMOJI.fallback} Fallback 1: Gemini gemini-2.0-flash ...`);
        try {
          const geminiModel = gemini.getGenerativeModel({
            model: "gemini-2.0-flash",
          });
          const promptText = system
            ? `${system}\n\n${prompt || ""}`
            : prompt || "";
          const result = await geminiModel.generateContent(promptText);
          const textResult = result.response.text();
          aiLog.info(
            `${EMOJI.ok} Gemini berhasil (${textResult.length} karakter)`,
          );
          return { text: textResult };
        } catch (geminiErr) {
          aiLog.error(`${EMOJI.error} Gemini gagal: ${formatErr(geminiErr)}`);
        }
      }

      // Fallback 2: Sumopod
      aiLog.info(
        `${EMOJI.fallback} Fallback 2: deepseek-v4-flash via Sumopod ...`,
      );
      try {
        const response = await openaiDefault.chat.completions.create(
          { model: "deepseek-v4-flash", messages, temperature },
          { timeout: AI_TIMEOUT_MS, maxRetries: 0 },
        );
        const textResult = response.choices[0]?.message?.content || "";
        aiLog.info(
          `${EMOJI.ok} Sumopod berhasil (${textResult.length} karakter)`,
        );
        return { text: textResult };
      } catch (fallbackSumopodErr) {
        aiLog.error(
          `${EMOJI.error} Sumopod gagal: ${formatErr(fallbackSumopodErr)}`,
        );
      }

      // Fallback 3: glm-5 on Groq
      aiLog.info(`${EMOJI.fallback} Fallback 3: glm-5 via Groq ...`);
      try {
        const response = await openaiHeavy.chat.completions.create(
          { model: "glm-5", messages, temperature },
          { timeout: AI_TIMEOUT_MS, maxRetries: 0 },
        );
        const textResult = response.choices[0]?.message?.content || "";
        aiLog.info(
          `${EMOJI.ok} glm-5 berhasil (${textResult.length} karakter)`,
        );
        return { text: textResult };
      } catch (fallbackGlmErr) {
        aiLog.error(
          `${EMOJI.error} Semua fallback gagal! Terakhir: glm-5 — ${formatErr(fallbackGlmErr)}`,
        );
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
    aiLog.info(
      `${EMOJI.ok} generateText selesai (${textResult.length} karakter)`,
    );
    return { text: textResult };
  } catch (err) {
    aiLog.error(
      `${EMOJI.error} generateText gagal (${modelName}): ${formatErr(err)}`,
    );
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

  // Helper to create result with both text and textStream
  const makeResult = (iterable: AsyncIterable<string>) => {
    return {
      text: collectStreamText(iterable),
      textStream: iterable,
    };
  };

  if (isHeavy) {
    const heavyModelName =
      process.env.HEAVY_MODEL_NAME ?? "llama-3.3-70b-versatile";

    // Try Groq with key rotation
    try {
      const stream = await tryGroqCompletion(
        heavyModelName,
        apiMessages,
        temperature,
        true,
      );

      aiLog.info(`${EMOJI.stream} Streaming dimulai (Groq ${heavyModelName})`);

      // Return a true async iterable that yields chunks as they arrive
      const iterable = (async function* () {
        let chunkCount = 0;
        for await (const chunk of stream) {
          chunkCount++;
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) yield content;
        }
        aiLog.info(
          `${EMOJI.ok} Streaming selesai (Groq) — ${chunkCount} chunk`,
        );
      })();

      return makeResult(iterable);
    } catch (groqErr) {
      aiLog.warn(`${EMOJI.warn} Groq streaming gagal — coba fallback...`);

      // Fallback 1: Gemini (free)
      if (gemini) {
        aiLog.info(`${EMOJI.fallback} Fallback 1: Gemini streaming ...`);
        try {
          const systemMsg = apiMessages.find((m) => m.role === "system");
          const chatMessages = apiMessages.filter((m) => m.role !== "system");

          const contents = chatMessages.map((m) => ({
            role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
            parts: [{ text: m.content }],
          }));

          const geminiModel = gemini.getGenerativeModel({
            model: "gemini-2.0-flash",
            ...(systemMsg ? { systemInstruction: systemMsg.content } : {}),
          });

          const result = await geminiModel.generateContentStream({
            contents,
          });

          const iterable = (async function* () {
            for await (const chunk of result.stream) {
              const content = chunk.text() || "";
              if (content) yield content;
            }
            aiLog.info(`${EMOJI.ok} Streaming selesai (Gemini)`);
          })();

          return makeResult(iterable);
        } catch (geminiErr) {
          aiLog.error(
            `${EMOJI.error} Gemini streaming gagal: ${formatErr(geminiErr)}`,
          );
        }
      }

      // Fallback 2: Sumopod
      const sumopodModel = "deepseek-v4-flash";
      aiLog.info(`${EMOJI.fallback} Fallback 2: Sumopod streaming ...`);
      try {
        const stream = await openaiDefault.chat.completions.create(
          {
            model: sumopodModel,
            messages: apiMessages,
            temperature,
            stream: true,
          },
          { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
        );

        const iterable = (async function* () {
          let chunkCount = 0;
          for await (const chunk of stream) {
            chunkCount++;
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) yield content;
          }
          aiLog.info(
            `${EMOJI.ok} Streaming selesai (Sumopod) — ${chunkCount} chunk`,
          );
        })();

        return makeResult(iterable);
      } catch (sumopodErr) {
        aiLog.error(
          `${EMOJI.error} Sumopod streaming gagal: ${formatErr(sumopodErr)}`,
        );
      }

      // Fallback 3: glm-5 on Groq
      aiLog.info(`${EMOJI.fallback} Fallback 3: glm-5 streaming ...`);
      try {
        const stream = await openaiHeavy.chat.completions.create(
          { model: "glm-5", messages: apiMessages, temperature, stream: true },
          { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
        );

        const iterable = (async function* () {
          let chunkCount = 0;
          for await (const chunk of stream) {
            chunkCount++;
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) yield content;
          }
          aiLog.info(
            `${EMOJI.ok} Streaming selesai (glm-5) — ${chunkCount} chunk`,
          );
        })();

        return makeResult(iterable);
      } catch (glmErr) {
        aiLog.error(
          `${EMOJI.error} Semua streaming fallback gagal! Terakhir: glm-5 — ${formatErr(glmErr)}`,
        );
        throw groqErr;
      }
    }
  } else {
    // Non-heavy: Sumopod direct
    // BUG-18 FIX: Add try/catch for non-heavy streaming path
    const modelName = "deepseek-v4-flash";
    try {
      const stream = await openaiDefault.chat.completions.create(
        { model: modelName, messages: apiMessages, temperature, stream: true },
        { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
      );

      aiLog.info(`${EMOJI.stream} Streaming dimulai (Sumopod ${modelName})`);

      const iterable = (async function* () {
        let chunkCount = 0;
        for await (const chunk of stream) {
          chunkCount++;
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) yield content;
        }
        aiLog.info(`${EMOJI.ok} Streaming selesai — ${chunkCount} chunk`);
      })();

      return makeResult(iterable);
    } catch (err) {
      aiLog.error(
        `${EMOJI.error} Non-heavy streaming gagal (${modelName}): ${formatErr(err)}`,
      );
      throw err;
    }
  }
}

/**
 * Collect an async iterable of string chunks into a single string.
 * Used internally by callers that need the full text (e.g., tutor.ts saves to DB).
 */
export async function collectStreamText(
  stream: AsyncIterable<string>,
): Promise<string> {
  const parts: string[] = [];
  for await (const chunk of stream) {
    parts.push(chunk);
  }
  return parts.join("");
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
  aiLog.info(`${EMOJI.embed} Embedding ${value.length} karakter ...`);
  try {
    const response = await openaiDefault.embeddings.create(
      {
        model: modelName,
        input: value,
      },
      { timeout: AI_TIMEOUT_EMBED_MS, maxRetries: 0 },
    );
    const embedding = response.data[0]?.embedding || [];
    aiLog.info(`${EMOJI.ok} Embedding selesai (${embedding.length} dimensi)`);
    return {
      embedding,
    };
  } catch (err) {
    aiLog.error(`${EMOJI.error} Embedding gagal: ${formatErr(err)}`);
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
  aiLog.info(`${EMOJI.embed} Embedding batch ${values.length} item ...`);
  try {
    const response = await openaiDefault.embeddings.create(
      {
        model: modelName,
        input: values,
      },
      { timeout: AI_TIMEOUT_EMBED_MS, maxRetries: 0 },
    );
    const embeddings = response.data.map((item) => item.embedding);
    aiLog.info(
      `${EMOJI.ok} Batch embedding selesai (${embeddings.length} item, ${embeddings[0]?.length ?? 0} dimensi)`,
    );
    return {
      embeddings,
    };
  } catch (err) {
    aiLog.error(`${EMOJI.error} Batch embedding gagal: ${formatErr(err)}`);
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
    } catch { /* try next block */ }
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
      } catch {}
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
      } catch {}
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
    } catch {
      // Escape literal control characters (newlines, tabs) inside JSON string values.
      // LLMs frequently return raw newlines in markdown content within JSON strings.
      cleaned = escapeJsonStringControls(cleaned);
      try {
        return JSON.parse(cleaned);
      } catch {
        throw err;
      }
    }
  }
}

/**
 * Escape literal control characters (\n, \r, \t) inside JSON string values.
 * LLMs frequently return markdown content with raw newlines inside JSON strings.
 */
function escapeJsonStringControls(json: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\" && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      const code = ch.charCodeAt(0);
      if (code === 0x0a) { result += "\\n"; continue; }
      if (code === 0x0d) { result += "\\r"; continue; }
      if (code === 0x09) { result += "\\t"; continue; }
      if (code < 0x20) { result += "\\u" + code.toString(16).padStart(4, "0"); continue; }
    }

    result += ch;
  }

  return result;
}
