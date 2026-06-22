export function sanitizeInternalPath(
  input: string | undefined | null,
): string | null {
  if (!input || typeof input !== "string") return null;
  if (input.length > 512) return null;
  if (!input.startsWith("/")) return null;
  // Block path traversal: //, /\, and URL-encoded variants
  if (input.startsWith("//") || input.startsWith("/\\")) return null;
  if (input.includes("\n") || input.includes("\r")) return null;
  if (input.includes("\\")) return null;
  // Block URL-encoded path traversal characters
  const decoded = decodeURIComponent(input);
  if (decoded !== input) return null;
  return input;
}
