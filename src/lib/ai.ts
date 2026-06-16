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
    `
=========================================
[AI_SERVICE] ERROR OCCURRED
-----------------------------------------
* Method:        ${method}
* Target Model:  ${modelName}
* Endpoint:      ${baseURL}
* Error Message: ${err instanceof Error ? err.message : String(err)}
* Full Stack / Error Object:
`,
    err,
    `
=========================================
`,
  );
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
  maxRetries?: number;
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
    console.log(
      `[AI_SERVICE] generateText attempting model: ${modelName} on client: ${isHeavy ? "openaiHeavy" : "openaiDefault"}`,
    );
    const response = await client.chat.completions.create({
      model: modelName,
      messages,
      temperature,
    });

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
    if (isHeavy) {
      console.warn(
        `[AI_SERVICE] Heavy model generateText failed. Attempting glm-5 fallback...`,
      );
      try {
        console.log(`
=========================================
[AI_SERVICE] generateText FALLBACK REQUEST (glm-5)
-----------------------------------------
* Fallback Model: glm-5
* Endpoint:       ${openaiHeavy.baseURL}
* System:
${system ? system : "(none)"}
* Prompt:
${prompt ? prompt : "(none)"}
=========================================
`);
        const response = await openaiHeavy.chat.completions.create({
          model: "glm-5",
          messages,
          temperature,
        });
        const textResult = response.choices[0]?.message?.content || "";
        console.log(`
=========================================
[AI_SERVICE] generateText FALLBACK RESPONSE (glm-5)
-----------------------------------------
* Model Used: ${response.model || "glm-5"}
* Output Text:
${textResult}
=========================================
`);
        return {
          text: textResult,
        };
      } catch (fallbackHeavyErr) {
        logAIError(
          "generateText (Fallback 1: glm-5)",
          "glm-5",
          openaiHeavy.baseURL,
          fallbackHeavyErr,
        );
        try {
          console.log(`
=========================================
[AI_SERVICE] generateText FALLBACK REQUEST 2 (deepseek-v4-flash)
-----------------------------------------
* Fallback Model: deepseek-v4-flash
* Endpoint:       ${openaiDefault.baseURL}
* System:
${system ? system : "(none)"}
* Prompt:
${prompt ? prompt : "(none)"}
=========================================
`);
          const response = await openaiDefault.chat.completions.create({
            model: "deepseek-v4-flash",
            messages,
            temperature,
          });
          const textResult = response.choices[0]?.message?.content || "";
          console.log(`
=========================================
[AI_SERVICE] generateText FALLBACK RESPONSE 2 (deepseek-v4-flash)
-----------------------------------------
* Model Used: ${response.model || "deepseek-v4-flash"}
* Output Text:
${textResult}
=========================================
`);
          return {
            text: textResult,
          };
        } catch (fallbackErr) {
          logAIError(
            "generateText (Fallback 2: deepseek-v4-flash)",
            "deepseek-v4-flash",
            openaiDefault.baseURL,
            fallbackErr,
          );
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
    // Socratic tutor AI chat: try Sumopod (openaiDefault) first, fall back to Groq (openaiHeavy)
    const sumopodModel = "deepseek-v4-flash";
    const sumopodBaseURL = openaiDefault.baseURL;
    console.log(`
=========================================
[AI_SERVICE] streamText REQUEST (Primary: Sumopod)
-----------------------------------------
* Model Type: ${model}
* Model Name: ${sumopodModel}
* Endpoint:   ${sumopodBaseURL}
* Temp:       ${temperature}
* System:
${system ? system : "(none)"}
* Messages:
${messages.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n")}
=========================================
`);
    try {
      const response = await openaiDefault.chat.completions.create({
        model: sumopodModel,
        messages: apiMessages,
        temperature,
      });

      const text = response.choices[0]?.message?.content || "";
      console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE (Sumopod)
-----------------------------------------
* Model Used: ${response.model || sumopodModel}
* Output Text:
${text}
=========================================
`);
      return {
        text: Promise.resolve(text),
      };
    } catch (sumopodErr) {
      logAIError(
        "streamText (Primary: Sumopod)",
        sumopodModel,
        sumopodBaseURL,
        sumopodErr,
      );
      const heavyModelName =
        process.env.HEAVY_MODEL_NAME ?? "llama-3.3-70b-versatile";
      const groqBaseURL = openaiHeavy.baseURL;
      console.warn(
        `[AI_SERVICE] Sumopod streamText failed. Trying Groq (${heavyModelName}) at ${groqBaseURL}...`,
      );
      try {
        console.log(`
=========================================
[AI_SERVICE] streamText REQUEST (Fallback 1: Groq)
-----------------------------------------
* Model Name: ${heavyModelName}
* Endpoint:   ${groqBaseURL}
* Messages:
${messages.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n")}
=========================================
`);
        const response = await openaiHeavy.chat.completions.create({
          model: heavyModelName,
          messages: apiMessages,
          temperature,
        });

        const text = response.choices[0]?.message?.content || "";
        console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE (Groq)
-----------------------------------------
* Model Used: ${response.model || heavyModelName}
* Output Text:
${text}
=========================================
`);
        return {
          text: Promise.resolve(text),
        };
      } catch (groqErr) {
        logAIError(
          "streamText (Fallback 1: Groq)",
          heavyModelName,
          groqBaseURL,
          groqErr,
        );
        try {
          console.log(`
=========================================
[AI_SERVICE] streamText REQUEST (Fallback 2: glm-5)
-----------------------------------------
* Model Name: glm-5
* Endpoint:   ${openaiHeavy.baseURL}
=========================================
`);
          const response = await openaiHeavy.chat.completions.create({
            model: "glm-5",
            messages: apiMessages,
            temperature,
          });

          const text = response.choices[0]?.message?.content || "";
          console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE (glm-5)
-----------------------------------------
* Model Used: ${response.model || "glm-5"}
* Output Text:
${text}
=========================================
`);
          return {
            text: Promise.resolve(text),
          };
        } catch (fallbackHeavyErr) {
          logAIError(
            "streamText (Fallback 2: glm-5)",
            "glm-5",
            openaiHeavy.baseURL,
            fallbackHeavyErr,
          );
          try {
            console.log(`
=========================================
[AI_SERVICE] streamText REQUEST (Fallback 3: deepseek-v4-flash)
-----------------------------------------
* Model Name: deepseek-v4-flash
* Endpoint:   ${openaiDefault.baseURL}
=========================================
`);
            const response = await openaiDefault.chat.completions.create({
              model: "deepseek-v4-flash",
              messages: apiMessages,
              temperature,
            });

            const text = response.choices[0]?.message?.content || "";
            console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE (Fallback 3: deepseek-v4-flash)
-----------------------------------------
* Model Used: ${response.model || "deepseek-v4-flash"}
* Output Text:
${text}
=========================================
`);
            return {
              text: Promise.resolve(text),
            };
          } catch (fallbackErr) {
            logAIError(
              "streamText (Fallback 3: deepseek-v4-flash)",
              "deepseek-v4-flash",
              openaiDefault.baseURL,
              fallbackErr,
            );
            throw sumopodErr;
          }
        }
      }
    }
  } else {
    // Non-heavy model path (standard OpenAI client)
    const modelName = "deepseek-v4-flash";
    const baseURL = openaiDefault.baseURL;
    console.log(`
=========================================
[AI_SERVICE] streamText REQUEST (openaiDefault)
-----------------------------------------
* Model Type: ${model}
* Model Name: ${modelName}
* Endpoint:   ${baseURL}
* Messages:
${messages.map((m) => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n")}
=========================================
`);
    try {
      const response = await openaiDefault.chat.completions.create({
        model: modelName,
        messages: apiMessages,
        temperature,
      });

      const text = response.choices[0]?.message?.content || "";
      console.log(`
=========================================
[AI_SERVICE] streamText RESPONSE
-----------------------------------------
* Model Used: ${response.model || modelName}
* Output Text:
${text}
=========================================
`);
      return {
        text: Promise.resolve(text),
      };
    } catch (err) {
      logAIError("streamText (openaiDefault)", modelName, baseURL, err);
      throw err;
    }
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
    const response = await openaiDefault.embeddings.create({
      model: modelName,
      input: value,
    });
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
  maxRetries?: number;
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
    const response = await openaiDefault.embeddings.create({
      model: modelName,
      input: values,
    });
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
