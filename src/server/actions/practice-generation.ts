"use server";

import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { incrementAiQuota, decrementAiQuota } from "@/server/ai-quota";
import { chatModel, generateText } from "@/lib/ai";

const generateTopicSchema = z.object({
  subjectId: z.string().min(1),
});

const generatePracticeSchema = z.object({
  conceptIds: z.array(z.string()).min(1).max(10),
  numQuestions: z.number().min(1).max(15).default(5),
});

const generateFreeformSchema = z.object({
  topic: z.string().min(3).max(200),
  numQuestions: z.number().min(1).max(15).default(5),
});

/**
 * Generate a new topic with concepts for a subject
 */
export async function generateTopic(input: {
  subjectId: string;
}): Promise<{ ok: boolean; topicId?: string; error?: string }> {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  const parsed = generateTopicSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const userId = session.id;
  const { subjectId } = parsed.data;

  // Check quota
  const quota = await incrementAiQuota(userId, "topicGen", 1);
  if (!quota.allowed) {
    return {
      ok: false,
      error: `Batas generate topik hari ini sudah tercapai (${quota.limit}x). Coba lagi besok ya!`,
    };
  }

  // Validate subject
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, isActive: true },
    select: { id: true, name: true, slug: true },
  });
  if (!subject) {
    await decrementAiQuota(userId, "topicGen", 1);
    return { ok: false, error: "Mapel tidak ditemukan." };
  }

  // Get existing topics to avoid duplicates
  const existingTopics = await prisma.topic.findMany({
    where: { subjectId },
    select: { name: true, slug: true },
  });
  const existingNames = existingTopics.map((t) => t.name.toLowerCase());

  try {
    const { text } = await generateText({
      model: chatModel,
      prompt: `Kamu adalah expert pendidikan untuk siswa SMA/SMK Indonesia.

Buatkan 1 topik baru untuk mata pelajaran ${subject.name} yang BELUM ADA di daftar berikut:
${existingNames.length > 0 ? existingNames.map((n) => `- ${n}`).join("\n") : "- (belum ada topik)"}

Topik harus:
1. Relevan dengan kurikulum SMA/SMK Indonesia
2. Berbeda dari topik yang sudah ada
3. Bisa dibagi menjadi 3-5 konsep
4. Berguna untuk siswa

Output HANYA JSON valid (tanpa code block):
{
  "name": "Nama Topik",
  "description": "Deskripsi singkat topik",
  "slug": "slug-topik",
  "concepts": [
    { "name": "Nama Konsep 1", "description": "Deskripsi konsep", "slug": "slug-konsep-1" },
    { "name": "Nama Konsep 2", "description": "Deskripsi konsep", "slug": "slug-konsep-2" }
  ]
}`,
      temperature: 0.7,
    });

    let json: unknown;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        json = JSON.parse(jsonMatch[0]);
      } else {
        json = JSON.parse(text);
      }
    } catch {
      await decrementAiQuota(userId, "topicGen", 1);
      return { ok: false, error: "AI mengembalikan format tidak valid. Coba lagi." };
    }

    const topicData = json as {
      name: string;
      description: string;
      slug: string;
      concepts: Array<{
        name: string;
        description: string;
        slug: string;
      }>;
    };

    // Validate the response
    if (!topicData.name || !topicData.concepts || topicData.concepts.length === 0) {
      await decrementAiQuota(userId, "topicGen", 1);
      return { ok: false, error: "AI mengembalikan data tidak lengkap. Coba lagi." };
    }

    // Check if topic already exists
    if (existingNames.includes(topicData.name.toLowerCase())) {
      await decrementAiQuota(userId, "topicGen", 1);
      return { ok: false, error: "Topik dengan nama itu sudah ada. Coba generate lagi." };
    }

    // Create topic with concepts
    const topic = await prisma.topic.create({
      data: {
        subjectId,
        name: topicData.name,
        description: topicData.description,
        slug: topicData.slug || topicData.name.toLowerCase().replace(/\s+/g, "-"),
        isCustom: true,
        concepts: {
          create: topicData.concepts.map((c, idx) => ({
            name: c.name,
            description: c.description,
            slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
            order: idx,
            isCustom: true,
          })),
        },
      },
      include: { concepts: true },
    });

    console.log("[GENERATE_TOPIC] ✅ Topik berhasil dibuat:", {
      topicId: topic.id,
      topicName: topic.name,
      conceptCount: topic.concepts.length,
    });

    return { ok: true, topicId: topic.id };
  } catch (err) {
    await decrementAiQuota(userId, "topicGen", 1).catch(() => {});
    console.error("[GENERATE_TOPIC] ❌ Gagal:", err);
    return { ok: false, error: "Gagal generate topik. Coba lagi." };
  }
}

/**
 * Generate practice questions for selected concepts
 */
export async function generatePracticeQuestions(input: {
  conceptIds: string[];
  numQuestions?: number;
}): Promise<{ ok: boolean; topicId?: string; error?: string }> {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  const parsed = generatePracticeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const userId = session.id;
  const { conceptIds, numQuestions } = parsed.data;

  // Check quota
  const quota = await incrementAiQuota(userId, "practiceGen", 1);
  if (!quota.allowed) {
    return {
      ok: false,
      error: `Batas generate soal hari ini sudah tercapai (${quota.limit}x). Coba lagi besok ya!`,
    };
  }

  // Validate concepts
  const concepts = await prisma.concept.findMany({
    where: { id: { in: conceptIds } },
    select: {
      id: true,
      name: true,
      description: true,
      topicId: true,
      topic: { select: { id: true, name: true, subjectId: true } },
    },
  });

  if (concepts.length === 0) {
    await decrementAiQuota(userId, "practiceGen", 1);
    return { ok: false, error: "Konsep tidak ditemukan." };
  }

  // Use the first concept's topic
  const topicId = concepts[0].topicId;

  try {
    const conceptDescriptions = concepts
      .map((c) => `- ${c.name}: ${c.description ?? "Tanpa deskripsi"}`)
      .join("\n");

    const { text } = await generateText({
      model: chatModel,
      prompt: `Kamu adalah expert pendidikan untuk siswa SMA/SMK Indonesia.

Buatkan ${numQuestions} soal pilihan ganda untuk konsep berikut:
${conceptDescriptions}

Aturan:
1. Soal dalam bahasa Indonesia
2. Pilihan ganda 4 opsi (A, B, C, D)
3. Tingkat kesulitan bervariasi (mudah, sedang, sulit)
4. Sertakan penjelasan untuk jawaban benar
5. Soal harus relevan dengan kurikulum SMA/SMK

Output HANYA JSON valid (tanpa code block):
{
  "questions": [
    {
      "questionText": "Teks soal",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctAnswer": "A",
      "explanation": "Penjelasan jawaban benar",
      "difficulty": "EASY|MEDIUM|HARD",
      "conceptId": "id konsep terkait"
    }
  ]
}`,
      temperature: 0.5,
    });

    let json: unknown;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        json = JSON.parse(jsonMatch[0]);
      } else {
        json = JSON.parse(text);
      }
    } catch {
      await decrementAiQuota(userId, "practiceGen", 1);
      return { ok: false, error: "AI mengembalikan format tidak valid. Coba lagi." };
    }

    const data = json as {
      questions: Array<{
        questionText: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        difficulty: string;
        conceptId: string;
      }>;
    };

    if (!data.questions || data.questions.length === 0) {
      await decrementAiQuota(userId, "practiceGen", 1);
      return { ok: false, error: "AI tidak mengembalikan soal. Coba lagi." };
    }

    // Create questions in database
    const createdQuestions = await Promise.all(
      data.questions.map(async (q) => {
        // Use the specified conceptId if valid, otherwise use first concept
        const conceptId = concepts.find((c) => c.id === q.conceptId)?.id ?? concepts[0].id;
        
        return prisma.question.create({
          data: {
            conceptId,
            type: "MULTIPLE_CHOICE",
            difficulty: (q.difficulty as any) ?? "MEDIUM",
            bloomTaxonomy: "UNDERSTAND",
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            tags: ["ai-generated", "practice-custom"],
            isActive: true,
          },
        });
      }),
    );

    console.log("[GENERATE_PRACTICE] ✅ Soal berhasil dibuat:", {
      questionCount: createdQuestions.length,
      topicId,
    });

    return { ok: true, topicId };
  } catch (err) {
    await decrementAiQuota(userId, "practiceGen", 1).catch(() => {});
    console.error("[GENERATE_PRACTICE] ❌ Gagal:", err);
    return { ok: false, error: "Gagal generate soal. Coba lagi." };
  }
}

/**
 * Generate practice from freeform text - creates topic + concepts + questions
 */
export async function generateFreeformPractice(input: {
  topic: string;
  numQuestions?: number;
}): Promise<{ ok: boolean; topicId?: string; error?: string }> {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  const parsed = generateFreeformSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const userId = session.id;
  const { topic: topicText, numQuestions } = parsed.data;

  // Check quota (uses both topicGen and practiceGen)
  const [topicQuota, practiceQuota] = await Promise.all([
    incrementAiQuota(userId, "topicGen", 1),
    incrementAiQuota(userId, "practiceGen", 1),
  ]);

  if (!topicQuota.allowed) {
    await decrementAiQuota(userId, "practiceGen", 1).catch(() => {});
    return {
      ok: false,
      error: `Batas generate topik hari ini sudah tercapai (${topicQuota.limit}x). Coba lagi besok ya!`,
    };
  }

  if (!practiceQuota.allowed) {
    await decrementAiQuota(userId, "topicGen", 1).catch(() => {});
    return {
      ok: false,
      error: `Batas generate soal hari ini sudah tercapai (${practiceQuota.limit}x). Coba lagi besok ya!`,
    };
  }

  // Find or create a "Custom" subject for freeform topics
  let customSubject = await prisma.subject.findFirst({
    where: { slug: "custom", isActive: true },
    select: { id: true },
  });

  if (!customSubject) {
    customSubject = await prisma.subject.create({
      data: {
        slug: "custom",
        name: "Custom",
        description: "Topik dan soal yang di-generate dari input bebas",
        icon: "✨",
        color: "var(--purple)",
        isCustom: true,
        source: "AI_GENERATED",
        isActive: true,
      },
    });
  }

  try {
    const { text } = await generateText({
      model: chatModel,
      prompt: `Kamu adalah expert pendidikan untuk siswa SMA/SMK Indonesia.

Berdasarkan tema berikut: "${topicText}"

Buatkan:
1. 1 topik yang relevan dengan tema tersebut
2. 3-5 konsep untuk topik tersebut
3. ${numQuestions} soal pilihan ganda

Aturan:
1. Topik harus spesifik dan bisa dipelajari
2. Konsep harus logis dan berurutan
3. Soal pilihan ganda 4 opsi (A, B, C, D)
4. Tingkat kesulitan bervariasi
5. Semua dalam bahasa Indonesia

Output HANYA JSON valid (tanpa code block):
{
  "topic": {
    "name": "Nama Topik",
    "description": "Deskripsi topik",
    "slug": "slug-topik"
  },
  "concepts": [
    { "name": "Konsep 1", "description": "Deskripsi", "slug": "slug-1" },
    { "name": "Konsep 2", "description": "Deskripsi", "slug": "slug-2" }
  ],
  "questions": [
    {
      "questionText": "Teks soal",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Penjelasan",
      "difficulty": "MEDIUM",
      "conceptIndex": 0
    }
  ]
}`,
      temperature: 0.5,
    });

    let json: unknown;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        json = JSON.parse(jsonMatch[0]);
      } else {
        json = JSON.parse(text);
      }
    } catch {
      await decrementAiQuota(userId, "topicGen", 1).catch(() => {});
      await decrementAiQuota(userId, "practiceGen", 1).catch(() => {});
      return { ok: false, error: "AI mengembalikan format tidak valid. Coba lagi." };
    }

    const data = json as {
      topic: { name: string; description: string; slug: string };
      concepts: Array<{ name: string; description: string; slug: string }>;
      questions: Array<{
        questionText: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        difficulty: string;
        conceptIndex: number;
      }>;
    };

    if (!data.topic || !data.concepts || !data.questions) {
      await decrementAiQuota(userId, "topicGen", 1).catch(() => {});
      await decrementAiQuota(userId, "practiceGen", 1).catch(() => {});
      return { ok: false, error: "AI mengembalikan data tidak lengkap. Coba lagi." };
    }

    // Create topic with concepts
    const topic = await prisma.topic.create({
      data: {
        subjectId: customSubject.id,
        name: data.topic.name,
        description: data.topic.description,
        slug: data.topic.slug || data.topic.name.toLowerCase().replace(/\s+/g, "-"),
        isCustom: true,
        concepts: {
          create: data.concepts.map((c, idx) => ({
            name: c.name,
            description: c.description,
            slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
            order: idx,
            isCustom: true,
          })),
        },
      },
      include: { concepts: true },
    });

    // Create questions
    const createdQuestions = await Promise.all(
      data.questions.map(async (q) => {
        const conceptIdx = Math.min(q.conceptIndex ?? 0, topic.concepts.length - 1);
        const conceptId = topic.concepts[conceptIdx].id;

        return prisma.question.create({
          data: {
            conceptId,
            type: "MULTIPLE_CHOICE",
            difficulty: (q.difficulty as any) ?? "MEDIUM",
            bloomTaxonomy: "UNDERSTAND",
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            tags: ["ai-generated", "freeform"],
            isActive: true,
          },
        });
      }),
    );

    console.log("[GENERATE_FREEFORM] ✅ Berhasil:", {
      topicId: topic.id,
      topicName: topic.name,
      conceptCount: topic.concepts.length,
      questionCount: createdQuestions.length,
    });

    return { ok: true, topicId: topic.id };
  } catch (err) {
    await decrementAiQuota(userId, "topicGen", 1).catch(() => {});
    await decrementAiQuota(userId, "practiceGen", 1).catch(() => {});
    console.error("[GENERATE_FREEFORM] ❌ Gagal:", err);
    return { ok: false, error: "Gagal generate. Coba lagi." };
  }
}
