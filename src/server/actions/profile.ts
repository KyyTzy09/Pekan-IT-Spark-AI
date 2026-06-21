"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80),
  school: z.string().min(2).max(80),
  grade: z.number().int().min(10).max(12),
  learningStyle: z.enum(["VISUAL", "TEXTUAL", "EXAMPLE_HEAVY", "SOCRATIC"]),
});

export async function updateProfileAction(input: unknown) {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    return { ok: false, error: "Akses ditolak" };
  }
  const userId = session.id;

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  const { name, school, grade, learningStyle } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { name },
      });

      await tx.studentProfile.update({
        where: { userId },
        data: { school, grade, learningStyle },
      });
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (_err) {
    return { ok: false, error: "Gagal menyimpan perubahan." };
  }
}
