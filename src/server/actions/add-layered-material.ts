"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAdaptiveMaterial } from "@/server/ai/generate-adaptive-material";

const addMaterialSchema = z.object({
  conceptId: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

export type AddLayeredMaterialInput = z.infer<typeof addMaterialSchema>;

export async function addAdvancedMaterial(
  input: AddLayeredMaterialInput,
): Promise<{ ok: boolean; materialId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  const parsed = addMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const { conceptId, difficulty } = parsed.data;

  const existingMaterial = await prisma.material.findFirst({
    where: { conceptId, difficulty, source: "ADAPTIVE" },
  });
  if (existingMaterial) {
    return { ok: false, error: `Materi ${difficulty} sudah ada.` };
  }

  const concept = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: {
      id: true,
      name: true,
      description: true,
      topic: { select: { subjectId: true } },
    },
  });
  if (!concept) {
    return { ok: false, error: "Konsep tidak ditemukan." };
  }

  const profile = await prisma.studentKnowledgeProfile.findUnique({
    where: { userId_conceptId: { userId: session.user.id, conceptId } },
    select: { masteryScore: true },
  });
  const masteryScore = profile?.masteryScore ?? 0;

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { learningStyle: true },
  });
  const learningStyle = studentProfile?.learningStyle ?? "VISUAL";

  try {
    const material = await generateAdaptiveMaterial({
      conceptName: concept.name,
      conceptDescription: concept.description || "",
      difficulty,
      learningStyle,
      masteryScore,
    });

    const created = await prisma.material.create({
      data: {
        title: material.title,
        content: material.contentMd,
        keyPoints: material.keyPoints,
        difficulty,
        estimatedMinutes: material.estimatedMinutes,
        source: "ADAPTIVE",
        conceptId,
        subjectId: concept.topic.subjectId,
        userId: session.user.id,
      },
    });

    return { ok: true, materialId: created.id };
  } catch (err) {
    console.error("Failed to generate adaptive material:", err);
    return { ok: false, error: "Gagal generate materi. Coba lagi." };
  }
}
