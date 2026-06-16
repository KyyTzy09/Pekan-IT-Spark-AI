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
  maxRetries?: number;
}) {
  const isHeavy = model === "heavy";
  const client = isHeavy ? openaiHeavy : openaiDefault;
  const modelName = isHeavy
    ? (process.env.HEAVY_MODEL_NAME ?? "deepseek-3.2")
    : "deepseek-v4-flash";

  const messages: ChatMessageParam[] = [];
  if (system) {
    messages.push({ role: "system", content: system });
  }
  if (prompt) {
    messages.push({ role: "user", content: prompt });
  }

  try {
    const response = await client.chat.completions.create({
      model: modelName,
      messages,
      temperature,
    });

    return {
      text: response.choices[0]?.message?.content || "",
    };
  } catch (err) {
    if (isHeavy) {
      console.warn(
        `Heavy reasoning model (${modelName}) failed. Falling back to alternative heavy model glm-5. Error:`,
        err,
      );
      try {
        const response = await openaiHeavy.chat.completions.create({
          model: "glm-5",
          messages,
          temperature,
        });
        return {
          text: response.choices[0]?.message?.content || "",
        };
      } catch (fallbackHeavyErr) {
        console.warn(
          `Alternative heavy model (glm-5) also failed. Falling back to default provider deepseek-v4-flash. Error:`,
          fallbackHeavyErr,
        );
        try {
          const response = await openaiDefault.chat.completions.create({
            model: "deepseek-v4-flash",
            messages,
            temperature,
          });
          return {
            text: response.choices[0]?.message?.content || "",
          };
        } catch (fallbackErr) {
          console.error("AI Fallback generateText failed:", fallbackErr);
          throw err;
        }
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
  maxRetries?: number;
}) {
  const isHeavy = model === "heavy";
  const client = isHeavy ? openaiHeavy : openaiDefault;
  const modelName = isHeavy
    ? (process.env.HEAVY_MODEL_NAME ?? "deepseek-3.2")
    : "deepseek-v4-flash";

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

  try {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: apiMessages,
      temperature,
    });

    const text = response.choices[0]?.message?.content || "";

    return {
      text: Promise.resolve(text),
    };
  } catch (err) {
    if (isHeavy) {
      console.warn(
        `Heavy streaming model (${modelName}) failed. Falling back to alternative heavy model glm-5. Error:`,
        err,
      );
      try {
        const response = await openaiHeavy.chat.completions.create({
          model: "glm-5",
          messages: apiMessages,
          temperature,
        });
        const text = response.choices[0]?.message?.content || "";
        return {
          text: Promise.resolve(text),
        };
      } catch (fallbackHeavyErr) {
        console.warn(
          `Alternative heavy model (glm-5) also failed. Falling back to default provider deepseek-v4-flash. Error:`,
          fallbackHeavyErr,
        );
        try {
          const response = await openaiDefault.chat.completions.create({
            model: "deepseek-v4-flash",
            messages: apiMessages,
            temperature,
          });
          const text = response.choices[0]?.message?.content || "";
          return {
            text: Promise.resolve(text),
          };
        } catch (fallbackErr) {
          console.error("AI Fallback streamText failed:", fallbackErr);
          throw err;
        }
      }
    }
    throw err;
  }
}

export async function embed({
  model: _model,
  value,
}: {
  model: "heavy" | "fast" | "embedding";
  value: string;
  maxRetries?: number;
}) {
  const response = await openaiDefault.embeddings.create({
    model: "text-embedding-3-small",
    input: value,
  });
  return {
    embedding: response.data[0]?.embedding || [],
  };
}

export async function embedMany({
  model: _model,
  values,
}: {
  model: "heavy" | "fast" | "embedding";
  values: string[];
  maxRetries?: number;
}) {
  const response = await openaiDefault.embeddings.create({
    model: "text-embedding-3-small",
    input: values,
  });
  return {
    embeddings: response.data.map((item) => item.embedding),
  };
}
