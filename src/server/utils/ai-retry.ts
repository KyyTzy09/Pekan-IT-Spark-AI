import "server-only";

import { z } from "zod";

export async function retryOnZodError<T>(
  fn: () => Promise<T>,
  maxRetries: number = 1,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (err instanceof z.ZodError) {
        console.warn(
          `[AI_RETRY] Zod validation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`,
          err.issues,
        );
        continue;
      }
      if (
        err instanceof Error &&
        err.message.startsWith("Failed to parse generated material")
      ) {
        console.warn(
          `[AI_RETRY] Material parse failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`,
        );
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
