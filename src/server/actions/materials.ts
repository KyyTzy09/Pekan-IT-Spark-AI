"use server";

import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateAdaptiveMaterial } from "@/server/ai/generate-adaptive-material";

const DAILY_MATERIAL_LIMIT = 7;

const generateMaterialSchema = z.object({
  subjectId: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
});

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfNextDay(): Date {
  const d = startOfToday();
  return new Date(d.getTime() + 86_400_000);
}

export async function generateOnDemandMaterial(input: {
  subjectId: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
}): Promise<{ ok: boolean; materialId?: string; error?: string }> {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  const parsed = generateMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const userId = session.id;
  const { subjectId, difficulty } = parsed.data;
  const today = startOfToday();
  const tomorrow = startOfNextDay();

  // Daily limit check
  const todayCount = await prisma.material.count({
    where: {
      userId,
      source: "ON_DEMAND",
      createdAt: { gte: today, lt: tomorrow },
    },
  });
  if (todayCount >= DAILY_MATERIAL_LIMIT) {
    return {
      ok: false,
      error: `Batas generate materi hari ini sudah tercapai (${DAILY_MATERIAL_LIMIT}x). Coba lagi besok ya!`,
    };
  }

  // Validate subject
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, isActive: true },
    select: { id: true, name: true },
  });
  if (!subject) {
    return { ok: false, error: "Mapel tidak ditemukan." };
  }

  // Get learning style + mastery
  const [profile, knowledgeProfile] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { learningStyle: true },
    }),
    prisma.studentKnowledgeProfile.findFirst({
      where: {
        userId,
        concept: { topic: { subjectId } },
      },
      select: { masteryScore: true },
      orderBy: { masteryScore: "asc" },
    }),
  ]);

  const learningStyle = profile?.learningStyle ?? "VISUAL";
  const masteryScore = knowledgeProfile?.masteryScore ?? 0.3;

  try {
    console.log("[MATERIAL] Generating on-demand material", {
      userId,
      subjectId,
      subjectName: subject.name,
      difficulty,
      learningStyle,
    });

    const material = await generateAdaptiveMaterial({
      conceptName: subject.name,
      conceptDescription: `Materi belajar untuk mata pelajaran ${subject.name}`,
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
        source: "ON_DEMAND",
        subjectId,
        userId,
      },
    });

    console.log("[MATERIAL] ✓ Generated", {
      materialId: created.id,
      title: created.title,
    });

    return { ok: true, materialId: created.id };
  } catch (err) {
    console.error("[MATERIAL] ✗ Failed to generate", err);
    return { ok: false, error: "Gagal generate materi. Coba lagi." };
  }
}
