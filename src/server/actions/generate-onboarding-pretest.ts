"use server";

import { z } from "zod";
import { getSession } from "@/lib/session";
import { generateCurriculumOutline } from "@/server/ai/curriculum";

const generateSchema = z.object({
  name: z.string().min(2).max(60).trim(),
  context: z.string().max(280).trim().optional().or(z.literal("")),
  educationLevel: z.enum(["SMA", "SMK"]).default("SMA"),
  grade: z.number().int().min(10).max(12).default(10),
});

export type GeneratePretestInput = z.infer<typeof generateSchema>;

export type GeneratePretestResult =
  | {
      ok: true;
      questions: Array<{
        topicIndex: number;
        questionText: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        difficulty: string;
      }>;
      subjectData: {
        name: string;
        icon: string;
        color: string;
        description: string;
        topics: Array<{
          name: string;
          description: string;
          concepts: Array<{ name: string; description: string }>;
        }>;
      };
    }
  | { ok: false; error: string };

export async function generateCustomSubjectPretest(
  input: GeneratePretestInput,
): Promise<GeneratePretestResult> {
  console.log("[ONBOARDING_SERVICE] generateCustomSubjectPretest start", {
    name: input.name,
  });

  const session = await getSession();
  if (!session?.id) {
    return { ok: false, error: "Kamu harus login dulu." };
  }

  const parsed = generateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  try {
    const outline = await generateCurriculumOutline({
      subjectName: parsed.data.name,
      context: parsed.data.context || undefined,
      gradeLevel: parsed.data.grade || undefined,
      educationLevel: parsed.data.educationLevel,
    });

    console.log("[ONBOARDING_SERVICE] generateCustomSubjectPretest success", {
      name: parsed.data.name,
      questionCount: outline.pretestQuestions.length,
    });

    return {
      ok: true,
      questions: outline.pretestQuestions,
      subjectData: {
        name: parsed.data.name,
        icon: outline.icon,
        color: outline.color,
        description: outline.description,
        topics: outline.topics,
      },
    };
  } catch (err) {
    console.error("[ONBOARDING_SERVICE] generateCustomSubjectPretest error", {
      name: parsed.data.name,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      error: "Spark gagal generate mapel. Coba lagi atau ganti nama mapel.",
    };
  }
}
