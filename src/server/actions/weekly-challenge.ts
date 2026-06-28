"use server";

import { revalidatePath } from "next/cache";
import { acquireDbLock, releaseDbLock } from "@/lib/db-lock";
import { prisma } from "@/lib/prisma";
import {
  generateReflectionPrompt,
  generateWeeklyDeepMaterial,
  generateWeeklyPerSubjectAI,
  generateWeeklyTitleAI,
} from "@/server/ai/challenge";
import { decrementAiQuota, incrementAiQuota } from "@/server/ai-quota";

const MAX_RETRIES = 3;

import {
  computeGrowthTrend,
  computeMasteryAverage,
  distributeChallengeSubjects,
  MAX_CHALLENGE_SUBJECTS,
} from "@/server/learning/strength";
import {
  computeWeeklyItemCounts,
  type WeeklyItemCounts,
} from "@/server/learning/weekly";
import type { SubjectSlug } from "../../../generated/prisma/client";

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff),
  );
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export type WeeklySubjectInput = {
  subjectId: string;
  subjectName: string;
  subjectSlug: SubjectSlug;
  avgMastery: number;
  growthTrend: number;
  hasAttempts: boolean;
};

function classifyStrength(avgMastery: number): "weak" | "balanced" | "strong" {
  if (avgMastery < 0.4) return "weak";
  if (avgMastery <= 0.7) return "balanced";
  return "strong";
}

async function buildWeeklySubjectInput(
  userId: string,
  subjectId: string,
  now: Date,
): Promise<WeeklySubjectInput | null> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true, name: true, slug: true, isActive: true },
  });
  if (!subject || !subject.isActive) return null;

  const [recentProfiles, prevProfiles] = await Promise.all([
    prisma.studentKnowledgeProfile.findMany({
      where: {
        userId,
        updatedAt: { gte: new Date(now.getTime() - 7 * 86_400_000) },
        concept: { topic: { subjectId } },
      },
      select: { masteryScore: true },
    }),
    prisma.studentKnowledgeProfile.findMany({
      where: {
        userId,
        updatedAt: {
          gte: new Date(now.getTime() - 14 * 86_400_000),
          lt: new Date(now.getTime() - 7 * 86_400_000),
        },
        concept: { topic: { subjectId } },
      },
      select: { masteryScore: true },
    }),
  ]);

  const recent = recentProfiles.map((p) => p.masteryScore);
  const prev = prevProfiles.map((p) => p.masteryScore);
  const all = [...recent, ...prev];

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    subjectSlug: subject.slug as SubjectSlug,
    avgMastery: computeMasteryAverage(all),
    growthTrend: computeGrowthTrend(recent, prev),
    hasAttempts: all.length > 0,
  };
}

const BLOOMS = ["ANALYZE", "EVALUATE", "CREATE"] as const;

export async function regenerateWeeklyChallenge(userId: string): Promise<{
  ok: boolean;
  weeklyChallengeId?: string;
  error?: string;
}> {
  console.log("[WEEKLY] 🚀 Memulai generate challenge mingguan");

  const monday = startOfWeek(new Date());

  // Cek apakah udah ada weekly challenge buat minggu ini
  const existingWeekly = await prisma.weeklyChallenge.findUnique({
    where: { userId_weekStart: { userId, weekStart: monday } },
  });
  if (existingWeekly) {
    console.log("[WEEKLY] ⏭️  Udah ada challenge minggu ini, skip generate");
    return { ok: true, weeklyChallengeId: existingWeekly.id };
  }

  console.log("[WEEKLY] 📅 Belum ada challenge minggu ini, mulai generate...");

  // Lock: cegah regenerasi dobel
  if (!(await acquireDbLock(userId, "WEEKLY"))) {
    console.log(
      "[WEEKLY] 🔒 Ada proses generate lain yang lagi jalan, skip duplikat",
    );
    return { ok: false, error: "Regenerasi sedang berjalan" };
  }

  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        grade: true,
        learningStyle: true,
        weeklyChallengeSubjectIds: true,
        user: { select: { name: true } },
      },
    });

    if (!profile) {
      console.log("[WEEKLY] ❌ Profil ga ketemu, batal generate");
      return { ok: false, error: "Profil tidak ditemukan" };
    }

    console.log("[WEEKLY] 👤 Profil loaded", {
      nama: profile.user?.name ?? "(unknown)",
      kelas: profile.grade,
      gayaBelajar: profile.learningStyle ?? "VISUAL",
      jumlahSubjectDipilih: profile.weeklyChallengeSubjectIds.length,
    });

    // RULE: WAJIB ada weeklyChallengeSubjectIds. Tidak ada fallback ke focusedSubjects.
    const subjectIds = profile.weeklyChallengeSubjectIds.slice(
      0,
      MAX_CHALLENGE_SUBJECTS,
    );

    if (subjectIds.length === 0) {
      console.log(
        "[WEEKLY] ⚠️  Belum pilih mapel untuk weekly challenge, skip generate",
      );
      return {
        ok: false,
        error: "Pilih mapel dulu di Settings untuk tantangan mingguan.",
      };
    }

    // Ambil nama subject untuk logging
    const subjectRows = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true },
    });
    const subjectNameMap = new Map(subjectRows.map((s) => [s.id, s.name]));

    console.log(
      "[WEEKLY] 📚 Mapel yang dipilih:",
      subjectIds.map((id) => subjectNameMap.get(id) ?? id).join(", "),
    );

    const subjectInputs: WeeklySubjectInput[] = [];
    for (const id of subjectIds) {
      const subjectName = subjectNameMap.get(id) ?? id;
      console.log(`[WEEKLY] ⏳ Analisis performa untuk ${subjectName}...`);
      const input = await buildWeeklySubjectInput(userId, id, new Date());
      if (input) {
        const strengthLabel = classifyStrength(input.avgMastery);
        console.log(
          `[WEEKLY] ✅ ${subjectName}: rata-rata mastery ${(input.avgMastery * 100).toFixed(0)}% (${strengthLabel})`,
        );
        subjectInputs.push(input);
      } else {
        console.log(
          `[WEEKLY] ⚠️  ${subjectName}: ga ketemu atau nonaktif, skip`,
        );
      }
    }

    if (subjectInputs.length === 0) {
      console.log("[WEEKLY] ❌ Semua mapel ga valid, batal generate");
      return { ok: false, error: "Mapel tidak valid" };
    }

    const aiTitle = await generateWeeklyTitleAI({
      userName: profile.user?.name ?? undefined,
      grade: profile.grade,
      subjectNames: subjectInputs.map((s) => s.subjectName),
    }).catch(() => ({
      title: `Misi Mingguan: ${subjectInputs[0]?.subjectName ?? "Pemburu Ilmu"}`,
      description:
        "Selesaikan semua item tantangan mingguan untuk klaim reward 100 XP!",
    }));

    console.log("[WEEKLY] 🎯 Judul challenge: " + aiTitle.title);

    let totalGoal = 0;
    const allContent: Array<{
      subjectInput: WeeklySubjectInput;
      counts: WeeklyItemCounts;
      questions: Array<{
        questionText: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        hint: string;
        bloomTaxonomy: string;
      }>;
      materials: Array<{
        title: string;
        content: string;
        keyPoints: string[];
        estimatedMinutes: number;
      }>;
      reflections: Array<{
        prompt: string;
        context: string;
      }>;
    }> = [];

    type RawWeeklyQuestion = {
      questionText: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      hint: string;
    };

    for (let idx = 0; idx < MAX_CHALLENGE_SUBJECTS; idx++) {
      const input = subjectInputs[idx % subjectInputs.length];
      const strength = classifyStrength(input.avgMastery);
      const counts = computeWeeklyItemCounts(strength);

      console.log(
        `[WEEKLY] 📝 Paket ${idx + 1}/${MAX_CHALLENGE_SUBJECTS} untuk ${input.subjectName}: ${counts.questions} soal, ${counts.materials} materi, ${counts.reflections} refleksi`,
      );

      totalGoal += counts.questions + counts.materials + counts.reflections;

      const aiQuota = await incrementAiQuota(
        userId,
        "questions",
        counts.questions,
      );
      if (!aiQuota.allowed) {
        console.warn("[WEEKLY] ⚠️  Kuota AI habis, skip paket ini");
        continue;
      }

      console.log(
        `[WEEKLY] 🤖 Generating soal & materi untuk ${input.subjectName}...`,
      );

      const aiContent = await generateWeeklyPerSubjectAI({
        subjectName: input.subjectName,
        subjectSlug: input.subjectSlug,
        learningStyle: profile.learningStyle ?? undefined,
        strength,
        questionsCount: counts.questions,
        materialsCount: counts.materials,
      }).catch((err) => {
        console.error("generateWeeklyPerSubjectAI failed:", err);
        decrementAiQuota(userId, "questions", counts.questions).catch(() => {});
        return {
          questions: [] as RawWeeklyQuestion[],
          materials: [] as Array<{
            title: string;
            content: string;
            keyPoints: string[];
            estimatedMinutes: number;
          }>,
        };
      });

      const validQuestions = (aiContent.questions as RawWeeklyQuestion[])
        .filter(
          (q) =>
            q.questionText &&
            q.correctAnswer &&
            Array.isArray(q.options) &&
            q.options.includes(q.correctAnswer),
        )
        .slice(0, counts.questions);

      const validMaterials = aiContent.materials
        .filter((m) => m.title && m.content)
        .slice(0, counts.materials);

      let retries = 0;
      while (
        validQuestions.length < counts.questions &&
        retries < MAX_RETRIES
      ) {
        retries++;
        const quota = await incrementAiQuota(userId, "questions", 1);
        if (!quota.allowed) break;
        const fallback = await generateWeeklyPerSubjectAI({
          subjectName: input.subjectName,
          subjectSlug: input.subjectSlug,
          learningStyle: profile.learningStyle ?? undefined,
          strength,
          questionsCount: 1,
          materialsCount: 0,
        }).catch(() => ({
          questions: [] as RawWeeklyQuestion[],
          materials: [] as Array<{
            title: string;
            content: string;
            keyPoints: string[];
            estimatedMinutes: number;
          }>,
        }));
        const q = fallback.questions[0];
        if (q && q.options?.includes(q.correctAnswer)) {
          validQuestions.push(q);
        } else {
          await decrementAiQuota(userId, "questions", 1);
          continue;
        }
      }

      retries = 0;
      while (
        validMaterials.length < counts.materials &&
        retries < MAX_RETRIES
      ) {
        retries++;
        const quota = await incrementAiQuota(userId, "materials", 1);
        if (!quota.allowed) break;
        const conceptSeeds = [
          input.subjectName,
          ...validMaterials.map((m) => m.title),
        ];
        const conceptSeed =
          conceptSeeds[retries % conceptSeeds.length] ?? input.subjectName;
        const material = await generateWeeklyDeepMaterial({
          subjectName: input.subjectName,
          conceptName: conceptSeed,
          learningStyle: profile.learningStyle ?? undefined,
          masteryScore: input.avgMastery,
        }).catch(() => null);
        if (material) {
          validMaterials.push({
            title: material.title,
            content: material.content,
            keyPoints: material.keyPoints,
            estimatedMinutes: material.estimatedMinutes,
          });
        } else {
          await decrementAiQuota(userId, "materials", 1);
          continue;
        }
      }

      // Generate reflections
      const reflections: Array<{ prompt: string; context: string }> = [];
      for (let rIdx = 0; rIdx < counts.reflections; rIdx++) {
        const materialTitle = validMaterials[rIdx]?.title;
        const reflection = await generateReflectionPrompt({
          userName: profile.user?.name ?? undefined,
          subjectName: input.subjectName,
          materialTitle,
        }).catch(() => ({
          prompt: `Bagaimana pemahamanmu tentang konsep ${input.subjectName} setelah belajar minggu ini?`,
          context: `Refleksi tentang ${input.subjectName}`,
        }));
        reflections.push(reflection);
      }

      allContent.push({
        subjectInput: input,
        counts,
        questions: validQuestions.map((q) => ({
          ...q,
          bloomTaxonomy: "ANALYZE",
        })),
        materials: validMaterials,
        reflections,
      });

      console.log(
        `[WEEKLY] ✅ ${input.subjectName}: ${validQuestions.length} soal, ${validMaterials.length} materi, ${reflections.length} refleksi siap`,
      );
    }

    console.log(
      `[WEEKLY] 📦 Total konten: ${allContent.length} paket, ${totalGoal} item`,
    );

    const challengesCreated: string[] = [];
    let weeklyId: string | null = null;
    await prisma.$transaction(async (tx) => {
      for (let blockIdx = 0; blockIdx < allContent.length; blockIdx++) {
        const block = allContent[blockIdx];
        const subjectId = block.subjectInput.subjectId;
        const subjectName = block.subjectInput.subjectName;
        const firstQ = block.questions[0];
        const title = firstQ
          ? `Misi Mingguan ${subjectName}: ${firstQ.questionText.slice(0, 60)}`
          : `Misi Mingguan ${subjectName}: Deep Dive`;

        const challenge = await tx.challenge.create({
          data: {
            userId,
            subjectId,
            title,
            description: `Paket tantangan mingguan untuk ${subjectName}. Selesaikan semua item untuk klaim reward mingguan.`,
            type: "WEEKLY",
            status: "ACTIVE",
            source: "AUTO_WEEKLY",
            scheduledFor: monday,
            mixConfig: {
              questions: block.questions.length,
              materials: block.materials.length,
              reflections: block.reflections.length,
            },
          },
        });
        challengesCreated.push(challenge.id);

        let order = 0;

        for (let qIdx = 0; qIdx < block.questions.length; qIdx++) {
          const q = block.questions[qIdx];
          const concepts = await tx.concept.findMany({
            where: { topic: { subjectId } },
            select: { id: true },
          });
          const concept = concepts[qIdx % concepts.length] ?? concepts[0];
          if (!concept) continue;

          const bloom = BLOOMS[(blockIdx + qIdx) % BLOOMS.length] ?? "ANALYZE";

          const questionRecord = await tx.question.create({
            data: {
              conceptId: concept.id,
              type: "MULTIPLE_CHOICE",
              difficulty: "HARD",
              bloomTaxonomy: bloom,
              questionText: q.questionText,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              hint: q.hint,
              tags: ["weekly-challenge", "ai-generated", "deep-dive"],
              isActive: true,
            },
          });

          await tx.challengeItem.create({
            data: {
              challengeId: challenge.id,
              order: order++,
              kind: "QUESTION",
              questionId: questionRecord.id,
              points: 20,
            },
          });
        }

        for (const m of block.materials) {
          const materialRecord = await tx.material.create({
            data: {
              userId,
              subjectId,
              title: m.title,
              content: m.content,
              keyPoints: m.keyPoints,
              difficulty: "HARD",
              estimatedMinutes: m.estimatedMinutes,
              source: "CHALLENGE",
            },
          });

          await tx.challengeItem.create({
            data: {
              challengeId: challenge.id,
              order: order++,
              kind: "MATERIAL",
              materialId: materialRecord.id,
              points: 15,
            },
          });
        }

        for (const r of block.reflections) {
          await tx.challengeItem.create({
            data: {
              challengeId: challenge.id,
              order: order++,
              kind: "REFLECTION",
              prompt: `${r.prompt}\n\nKonteks: ${r.context}`,
              points: 15,
            },
          });
        }
      }

      if (challengesCreated.length > 0) {
        const weekly = await tx.weeklyChallenge.create({
          data: {
            userId,
            weekStart: monday,
            title: aiTitle.title,
            description: aiTitle.description,
            goal: totalGoal,
            progress: 0,
            completed: false,
            xpRewarded: false,
            challengeId: challengesCreated[0],
          },
        });
        weeklyId = weekly.id;
      }
    });

    if (challengesCreated.length === 0) {
      console.log("[WEEKLY] ❌ Gagal membuat challenge, 0 challenge tersimpan");
      return { ok: false, error: "Gagal membuat tantangan mingguan" };
    }

    // UX-FIX: Don't call revalidatePath here — callers handle revalidation.
    // Calling revalidatePath during render causes Next.js errors.

    console.log(
      `[WEEKLY] 🎉 Selesai! ${challengesCreated.length} challenge berhasil dibuat`,
    );
    return { ok: true, weeklyChallengeId: weeklyId ?? undefined };
  } finally {
    releaseDbLock(userId, "WEEKLY");
  }
}
