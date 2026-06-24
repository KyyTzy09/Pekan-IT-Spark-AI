/**
 * 🪵 Human-friendly logger for AI operations
 *
 * Format: [emoji] Pesan manusiawi | detail teknis (opsional)
 *
 * Contoh:
 *   🤖 Memulai generateText (llama-3.3-70b) ...
 *   ✅ generateText selesai (245 karakter)
 *   ⚠️ Groq rate limit di key[0], coba key berikutnya...
 *   ❌ Semua provider AI gagal! | Error: timeout setelah 30s
 */

const isDev = process.env.NODE_ENV !== "production";

// ── Core logger ──────────────────────────────────────────────────────────────

export const aiLog = {
  /** Info ringan — cuma muncul di dev */
  info: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },

  /** Warning — selalu muncul, tapi bukan error fatal */
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  /** Error — selalu muncul, butuh perhatian */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};

// ── Helper untuk masking API key ─────────────────────────────────────────────

export function maskKey(key: string | undefined): string {
  if (!key) return "???";
  return key.slice(0, 8) + "...";
}

// ── Format error message yang readable ───────────────────────────────────────

export function formatErr(err: unknown): string {
  if (err instanceof Error) {
    // OpenAI SDK errors punya status dan code
    const errObj = err as unknown as Record<string, unknown>;
    const status = errObj.status;
    const code = errObj.code;
    if (status || code) {
      return `${err.message} (HTTP ${status ?? "?"}, code: ${code ?? "?"})`;
    }
    return err.message;
  }
  return String(err);
}

// ── Emoji helpers ────────────────────────────────────────────────────────────

export const EMOJI = {
  start: "🚀",
  ok: "✅",
  warn: "⚠️",
  error: "❌",
  retry: "🔄",
  fallback: "🔀",
  key: "🔑",
  model: "🤖",
  stream: "📡",
  embed: "📐",
  quota: "📊",
  time: "⏱️",
  search: "🔍",
} as const;
