"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const onboardingSchema = z.object({
  educationLevel: z.enum(["SMA", "SMK"]),
  grade: z.number().int().min(10).max(12),
  school: z.string().min(2).max(80),
  learningStyle: z.enum(["VISUAL", "TEXTUAL", "EXAMPLE_HEAVY", "SOCRATIC"]),
  subjectIds: z.array(z.string()).min(1).max(8),
});

export async function completeOnboarding(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, message: "Kamu belum masuk." };
  }

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      message:
        parsed.error.issues[0]?.message ?? "Data onboarding belum lengkap.",
    };
  }

  const data = parsed.data;

  const validSubjects = await prisma.subject.findMany({
    where: { id: { in: data.subjectIds } },
    select: { id: true },
  });
  if (validSubjects.length !== data.subjectIds.length) {
    return {
      ok: false as const,
      message: "Ada mata pelajaran yang nggak valid.",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.studentProfile.update({
      where: { userId: session.user.id },
      data: {
        educationLevel: data.educationLevel,
        grade: data.grade,
        school: data.school,
        learningStyle: data.learningStyle,
        responseDepth: "MENENGAH",
      },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: { isOnboarded: true },
    });

    const concepts = await tx.concept.findMany({
      where: { topic: { subjectId: { in: data.subjectIds } } },
      select: { id: true },
    });

    if (concepts.length > 0) {
      await tx.studentKnowledgeProfile.createMany({
        data: concepts.map((c) => ({
          userId: session.user.id,
          conceptId: c.id,
          masteryScore: 0,
          status: "NOT_STARTED" as const,
        })),
        skipDuplicates: true,
      });
    }
  });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
