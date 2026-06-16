/**
 * Cloudinary — image/video CDN.
 *
 * Setup: env vars di .env (lihat .env.example):
 *   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: dipakai otomatis oleh next-cloudinary untuk client components
 *   - CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET: server-side only (signed uploads, admin API)
 *
 * Client usage (RSC + client components):
 *   import { CldImage } from 'next-cloudinary';
 *   <CldImage src="public_id" width={300} height={200} alt="..." />
 *
 * Server usage (signed uploads):
 *   import { v2 as cloudinary } from 'cloudinary';
 *   const result = await cloudinary.uploader.upload(buffer, { folder: 'spark-ai' });
 *
 * Catatan: untuk server-side upload perlu install package `cloudinary` (server-only SDK)
 * terpisah dari `next-cloudinary` (yang fokus ke React components).
 */

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
  apiKey: process.env.CLOUDINARY_API_KEY ?? "",
  apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
} as const;

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUDINARY_CONFIG.cloudName);
}

/**
 * Build a Cloudinary delivery URL for a public_id.
 * Returns the URL or null if cloud name is missing.
 *
 * @example
 *   cloudinaryUrl("samples/landscapes/nature-mountains", { width: 800, crop: "fill" })
 *   // → https://res.cloudinary.com/ddftfycmv/image/upload/w_800,c_fill/samples/landscapes/nature-mountains
 */
export function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: "fill" | "fit" | "scale" | "thumb";
    quality?: "auto" | number;
    format?: "auto" | "jpg" | "png" | "webp";
  } = {},
): string | null {
  if (!CLOUDINARY_CONFIG.cloudName) return null;

  const transforms: string[] = [];
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.quality) transforms.push(`q_${options.quality}`);
  if (options.format) transforms.push(`f_${options.format}`);

  const transformStr = transforms.length > 0 ? `${transforms.join(",")}/` : "";
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformStr}${publicId}`;
}
