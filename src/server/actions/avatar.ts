"use server";

import crypto from "node:crypto";
import { auth } from "@/lib/auth";
import { CLOUDINARY_CONFIG } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB

export async function getCloudinarySignature(): Promise<
  | {
      ok: true;
      signature: string;
      timestamp: number;
      apiKey: string;
      cloudName: string;
      folder: string;
    }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  if (
    !CLOUDINARY_CONFIG.apiKey ||
    !CLOUDINARY_CONFIG.apiSecret ||
    !CLOUDINARY_CONFIG.cloudName
  ) {
    return { ok: false, error: "Cloudinary belum dikonfigurasi." };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `spark-ai/avatars/${session.user.id}`;

  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_CONFIG.apiSecret}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign)
    .digest("hex");

  return {
    ok: true,
    signature,
    timestamp,
    apiKey: CLOUDINARY_CONFIG.apiKey,
    cloudName: CLOUDINARY_CONFIG.cloudName,
    folder,
  };
}

export async function updateAvatarAction(
  imageUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  if (!imageUrl || !imageUrl.startsWith("https://res.cloudinary.com/")) {
    return { ok: false, error: "URL gambar tidak valid." };
  }

  const { prisma } = await import("@/lib/prisma");
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: imageUrl },
  });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { ok: true };
}
