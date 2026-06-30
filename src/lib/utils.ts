import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the user's avatar URL, falling back to a DiceBear pixel-art avatar
 * seeded by the user's name or id if no image is set.
 */
export function getAvatarUrl(
  image: string | null | undefined,
  seed: string | null | undefined,
): string {
  if (image) return image;
  const s = (seed || "spark").trim().toLowerCase();
  return `https://api.dicebear.com/9.x/pixel-art/png?seed=${encodeURIComponent(s)}`;
}
