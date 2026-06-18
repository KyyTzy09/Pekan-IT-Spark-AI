export function sanitizeInternalPath(
  input: string | undefined | null,
): string | null {
  if (!input || typeof input !== "string") return null;
  if (input.length > 512) return null;
  if (!input.startsWith("/")) return null;
  if (input.startsWith("//") || input.startsWith("/\\")) return null;
  if (input.includes("\n") || input.includes("\r")) return null;
  if (input.includes("\\")) return null;
  return input;
}
