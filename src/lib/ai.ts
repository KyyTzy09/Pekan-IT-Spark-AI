import OpenAI from "openai";

const openaiDefault = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

const heavyModelBaseUrl =
  process.env.HEAVY_MODEL_BASE_URL ??
  process.env.OPENAI_BASE_URL ??
  "https://api.openai.com/v1";

const openaiHeavy = new OpenAI({
  baseURL: heavyModelBaseUrl,
  apiKey: process.env.HEAVY_MODEL_API_KEY ?? process.env.OPENAI_API_KEY,
});

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
  const client = isHeavy ? openaiHeavy : openaiDefault;
  const modelName = isHeavy
    ? (process.env.HEAVY_MODEL_NAME ?? "deepseek-3.2")
    : "deepseek-v4-flash";
  const baseURL = client.baseURL;

  console.log(`
=========================================
[AI_SERVICE] generateText REQUEST
-----------------------------------------
* Model Type: ${model} (Resolved Name: ${modelName})
* Endpoint:   ${baseURL}
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

  try {
    console.log(`[AI_SERVICE] generateText attempting model: ${modelName}`);
    const response = await client.chat.completions.create(
      {
        model: modelName,
        messages: messages,
        temperature,
      },
      { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
    );

    const textResult = response.choices[0]?.message?.content || "";
    console.log(`
=========================================
[AI_SERVICE] generateText RESPONSE
-----------------------------------------
* Model Used: ${response.model || modelName}
* Output Text:
${textResult}
=========================================
`);
    return {
      text: textResult,
    };
  } catch (err) {
    logAIError("generateText (Primary)", modelName, baseURL, err);

    // Handle 429 rate limit: wait retry-after then try again
    if (isRateLimitError(err)) {
      const retryAfter = getRetryAfter(err) || 5;
      console.warn(
        `[AI_SERVICE] Rate limited. Retrying after ${retryAfter}s...`,
      );
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      try {
        const response = await client.chat.completions.create(
          { model: modelName, messages, temperature },
          { timeout: AI_TIMEOUT_MS, maxRetries: 0 },
        );
        const textResult = response.choices[0]?.message?.content || "";
        return { text: textResult };
      } catch (retryErr) {
        logAIError(
          "generateText (Primary retry)",
          modelName,
          baseURL,
          retryErr,
        );
      }
    }

    if (isHeavy) {
      // Fallback 1: try fast model on Sumopod (different endpoint)
      console.warn(
        `[AI_SERVICE] Heavy model failed. Trying deepseek-v4-flash on Sumopod...`,
      );
      try {
        console.log(`
=========================================
[AI_SERVICE] generateText FALLBACK REQUEST (deepseek-v4-flash)
-----------------------------------------
* Fallback Model: deepseek-v4-flash
* Endpoint:       ${openaiDefault.baseURL}
=========================================
`);
        const response = await openaiDefault.chat.completions.create(
          { model: "deepseek-v4-flash", messages, temperature },
          { timeout: AI_TIMEOUT_MS, maxRetries: 0 },
        );
        const textResult = response.choices[0]?.message?.content || "";
        return { text: textResult };
      } catch (fallbackSumopodErr) {
        logAIError(
          "generateText (Fallback 1: deepseek-v4-flash)",
          "deepseek-v4-flash",
          openaiDefault.baseURL,
          fallbackSumopodErr,
        );
      }

      // Fallback 2: last resort - glm-5 on same heavy endpoint
      try {
        console.log(`
=========================================
[AI_SERVICE] generateText FALLBACK REQUEST 2 (glm-5)
-----------------------------------------
* Fallback Model: glm-5
* Endpoint:       ${openaiHeavy.baseURL}
=========================================
`);
        const response = await openaiHeavy.chat.completions.create(
          { model: "glm-5", messages, temperature },
          { timeout: AI_TIMEOUT_MS, maxRetries: 0 },
        );
        const textResult = response.choices[0]?.message?.content || "";
        return { text: textResult };
      } catch (fallbackGlmErr) {
        logAIError(
          "generateText (Fallback 2: glm-5)",
          "glm-5",
          openaiHeavy.baseURL,
          fallbackGlmErr,
        );
        throw err;
      }
    }
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
    // Socratic tutor AI chat: try Groq (openaiHeavy) first, fall back to Sumopod (openaiDefault)
    const heavyModelName =
      process.env.HEAVY_MODEL_NAME ?? "llama-3.3-70b-versatile";
    const groqBaseURL = openaiHeavy.baseURL;
    console.log(`
=========================================
[AI_SERVICE] streamText REQUEST (Primary: Groq)
-----------------------------------------
* Model Type: ${model}
* Model Name: ${heavyModelName}
* Endpoint:   ${groqBaseURL}
* Temp:       ${temperature}
* System:
${system ? system : "(none)"}
* Messages:
${messages.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n")}
=========================================
`);
    try {
      console.log(
        `[AI_SERVICE] streamText attempting model: ${heavyModelName}`,
      );
      const stream = await openaiHeavy.chat.completions.create(
        {
          model: heavyModelName,
          messages: apiMessages,
          temperature,
          stream: true,
        },
        { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
      );

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
          console.log(
            `[AI_SERVICE] streamText streaming completed, chunks: ${chunkCount}`,
          );
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
      logAIError(
        "streamText (Primary: Groq)",
        heavyModelName,
        groqBaseURL,
        groqErr,
      );
      const sumopodModel = "deepseek-v4-flash";
      const sumopodBaseURL = openaiDefault.baseURL;
      console.warn(
        `[AI_SERVICE] Groq streamText failed. Trying Sumopod (${sumopodModel}) at ${sumopodBaseURL}...`,
      );
      try {
        console.log(
          `[AI_SERVICE] streamText attempting model: ${sumopodModel}`,
        );
        const stream = await openaiDefault.chat.completions.create(
          {
            model: sumopodModel,
            messages: apiMessages,
            temperature,
            stream: true,
          },
          { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
        );

        console.log(`[AI_SERVICE] streamText streaming started (Sumopod)`);
        let chunkCount = 0;
        let fullText = "";

        return {
          text: (async () => {
            for await (const chunk of stream) {
              chunkCount++;
              const content = chunk.choices[0]?.delta?.content || "";
              fullText += content;
            }
            console.log(
              `[AI_SERVICE] streamText streaming completed, chunks: ${chunkCount}`,
            );
            console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE (Sumopod)
-----------------------------------------
* Model Used: ${sumopodModel}
* Output Text:
${fullText}
=========================================
`);
            return fullText;
          })(),
        };
      } catch (sumopodErr) {
        logAIError(
          "streamText (Fallback 1: Sumopod)",
          sumopodModel,
          sumopodBaseURL,
          sumopodErr,
        );
        try {
          console.log(`[AI_SERVICE] streamText attempting model: glm-5`);
          const stream = await openaiHeavy.chat.completions.create(
            {
              model: "glm-5",
              messages: apiMessages,
              temperature,
              stream: true,
            },
            { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
          );

          console.log(`[AI_SERVICE] streamText streaming started (glm-5)`);
          let chunkCount = 0;
          let fullText = "";

          return {
            text: (async () => {
              for await (const chunk of stream) {
                chunkCount++;
                const content = chunk.choices[0]?.delta?.content || "";
                fullText += content;
              }
              console.log(
                `[AI_SERVICE] streamText streaming completed, chunks: ${chunkCount}`,
              );
              console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE (glm-5)
-----------------------------------------
* Model Used: glm-5
* Output Text:
${fullText}
=========================================
`);
              return fullText;
            })(),
          };
        } catch (fallbackHeavyErr) {
          logAIError(
            "streamText (Fallback 2: glm-5)",
            "glm-5",
            openaiHeavy.baseURL,
            fallbackHeavyErr,
          );
          throw groqErr;
        }
      }
    }
  } else {
    // Non-heavy model path (standard OpenAI client)
    const modelName = "deepseek-v4-flash";
    const _baseURL = openaiDefault.baseURL;
    console.log(`[AI_SERVICE] streamText attempting model: ${modelName}`);
    const stream = await openaiDefault.chat.completions.create(
      {
        model: modelName,
        messages: apiMessages,
        temperature,
        stream: true,
      },
      { timeout: AI_TIMEOUT_STREAM_MS, maxRetries: 0 },
    );

    console.log(`[AI_SERVICE] streamText streaming started (${modelName})`);
    let chunkCount = 0;
    let fullText = "";

    return {
      text: (async () => {
        for await (const chunk of stream) {
          chunkCount++;
          const content = chunk.choices[0]?.delta?.content || "";
          fullText += content;
        }
        console.log(
          `[AI_SERVICE] streamText streaming completed, chunks: ${chunkCount}`,
        );
        console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE
-----------------------------------------
* Model Used: ${modelName}
* Output Text:
${fullText}
=========================================
`);
        return fullText;
      })(),
    };
  }
}

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
