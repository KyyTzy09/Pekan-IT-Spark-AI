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
  // Decode recursively to catch double-encoding (e.g., %252F → %2F → /)
  let decoded = input;
  let prev = "";
  while (decoded !== prev) {
    prev = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch {
      break;
    }
  }
  // After full decoding, re-validate traversal patterns
  if (decoded !== input) {
    // Input contained encoded chars — check if decoded version is safe
    if (decoded.startsWith("//") || decoded.startsWith("/\\")) return null;
    if (decoded.includes("\n") || decoded.includes("\r")) return null;
    if (decoded.includes("\\")) return null;
    // Don't allow encoded null bytes or other control characters
    if (/\x00/.test(decoded)) return null;
  }
  return input;
}
