/**
 * Sanitize user input before interpolation into AI system prompts.
 * Prevents prompt injection attacks by:
 * 1. Stripping common injection patterns
 * 2. Limiting length
 * 3. Neutralizing control tokens
 */

const INJECTION_PATTERNS = [
  // Instruction override patterns (English)
  /\bignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|prompts?|constraints?)\b/gi,
  /\byou\s+are\s+now\b/gi,
  /\bforget\s+(everything|all|your)\b/gi,
  /\bnew\s+instructions?\s*:/gi,
  /\boverride\s+(all|previous|system)\b/gi,
  /\bdisregard\s+(all|previous|above)\b/gi,
  /\bact\s+as\s+if\b/gi,
  /\bpretend\s+(you|to)\s+(are|be)\b/gi,
  /\bsystem\s*prompt\s*[:=]/gi,
  /\brole\s*[:=]\s*/gi,

  // Instruction override patterns (Indonesian)
  /\babaikan\s+(semua|seluruh|instruksi|perintah|aturan)\b/gi,
  /\blupakan\s+(semua|seluruh|instruksi)\b/gi,
  /\bkamu\s+sekarang\s+adalah\b/gi,
  /\bganti\s+(peran|role|instruksi)\b/gi,
  /\bperintah\s+baru\s*[:=]/gi,

  // Prompt delimiter / token injection
  /\[\/INST\]/gi,
  /\[INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<\|system\|>/gi,
  /<\|user\|>/gi,
  /<\|assistant\|>/gi,
  /\{system\}/gi,
  /\{user\}/gi,
  /\{assistant\}/gi,

  // Prompt leaking attempts
  /\b(output|print|show|reveal|repeat|display)\s+(the\s+)?(system\s+)?(prompt|instructions?|rules?)\b/gi,
  /\bberitahu\s+(system\s+)?(prompt|instruksi|perintah)\b/gi,
  /\btunjukkan\s+(system\s+)?(prompt|instruksi)\b/gi,
  /\bkeluarkan\s+(semua\s+)?(system\s+)?(prompt|instruksi)\b/gi,
];

const MAX_NAME_LENGTH = 60;
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Sanitize a user-provided string for safe interpolation into an AI system prompt.
 * Strips injection patterns, control characters, and limits length.
 */
export function sanitizeForPrompt(input: string | undefined | null): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input;

  // Remove null bytes, control characters (except newlines/tabs), and carriage returns
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional for security sanitization
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0D\x0E-\x1F\x7F]/g, "");

  // Strip Unicode zero-width and invisible characters (homoglyph injection vector)
  sanitized = sanitized.replace(
    /[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g,
    "",
  );

  // Apply injection pattern removal
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[FILTERED]");
  }

  // Collapse multiple spaces/newlines
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{4,}/g, "   ");

  return sanitized.trim();
}

/**
 * Sanitize a user's display name for AI prompts.
 * More restrictive: alphanumeric, spaces, common punctuation only.
 */
export function sanitizeNameForPrompt(name: string | undefined | null): string {
  if (!name || typeof name !== "string") return "";

  let sanitized = name;

  // Remove all control characters
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional for security sanitization
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");

  // Remove prompt delimiters and injection tokens
  sanitized = sanitized
    .replace(/\[\/?INST\]/gi, "")
    .replace(/<\|[^|]+\|>/g, "")
    .replace(/\{(system|user|assistant)\}/gi, "");

  // Apply general injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Limit length
  if (sanitized.length > MAX_NAME_LENGTH) {
    sanitized = sanitized.slice(0, MAX_NAME_LENGTH);
  }

  return sanitized.trim();
}

/**
 * Sanitize a user chat message for AI prompts.
 * Less aggressive than system prompt sanitization — preserves message intent.
 */
export function sanitizeMessageForPrompt(message: string): string {
  if (!message || typeof message !== "string") return "";

  let sanitized = message;

  // Remove null bytes only
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional for security sanitization
  sanitized = sanitized.replace(/\x00/g, "");

  // Remove prompt delimiter tokens (these are never legitimate user content)
  sanitized = sanitized
    .replace(/\[\/?INST\]/gi, "")
    .replace(/<\|[^|]+\|>/g, "")
    .replace(/\{(system|user|assistant)\}/gi, "");

  // Limit length
  if (sanitized.length > MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.slice(0, MAX_MESSAGE_LENGTH);
  }

  return sanitized.trim();
}

/**
 * BUG-8 FIX: Sanitize AI-generated Markdown before storage/rendering.
 * Removes potentially dangerous constructs while preserving safe Markdown.
 */
export function sanitizeAiMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== "string") return "";

  let sanitized = markdown;

  // Remove HTML tags that could be XSS vectors
  // Allow safe tags: <br>, <hr>, <sup>, <sub>, <details>, <summary>
  sanitized = sanitized.replace(
    /<(?!\/?(br|hr|sup|sub|details|summary|mark|kbd|abbr)\b)[^>]+>/gi,
    "",
  );

  // Remove javascript: and data: URLs in links and images
  sanitized = sanitized.replace(
    /(\[.*?\]\()?(javascript|data|vbscript):[^)]*\)?/gi,
    "",
  );

  // Remove on* event handlers from any remaining HTML
  sanitized = sanitized.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove SVG elements entirely (can contain scripts)
  sanitized = sanitized.replace(/<svg[\s\S]*?<\/svg>/gi, "");

  // Remove iframe, object, embed, form elements
  sanitized = sanitized.replace(
    /<(iframe|object|embed|form|input|button|textarea|select)[\s\S]*?<\/\1>/gi,
    "",
  );
  sanitized = sanitized.replace(
    /<(iframe|object|embed|form|input|button|textarea|select)[\s\S]*?\/?>/gi,
    "",
  );

  return sanitized;
}
