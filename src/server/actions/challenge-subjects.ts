"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateAndStoreDailyChallenges } from "@/server/actions/challenges";
import { regenerateWeeklyChallenge } from "@/server/actions/weekly-challenge";
import { MAX_CHALLENGE_SUBJECTS } from "@/server/learning/strength";

const subjectIdsSchema = z
  .array(z.string().min(1).max(64))
  .min(1, "Pilih minimal 1 mapel")
  .max(MAX_CHALLENGE_SUBJECTS, `Maksimal ${MAX_CHALLENGE_SUBJECTS} mapel`);

async function requireStudent() {
  const session = await getSession();
  if (!session?.id) throw new Error("UNAUTHORIZED");
  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });
  if (!user || user.role !== "STUDENT") throw new Error("FORBIDDEN");
  return user.id;
}

async function validateSubjectIds(ids: string[]): Promise<string[]> {
  const subjects = await prisma.subject.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true },
  });
  return subjects.map((s) => s.id);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfNextDay(): Date {
  const d = startOfToday();
  return new Date(d.getTime() + 86_400_000);
}

export async function setChallengeSubjects(input: {
  subjectIds: string[];
}): Promise<{
  ok: boolean;
  appliedToday: boolean;
  error?: string;
}> {
  const userId = await requireStudent();
  const parsed = subjectIdsSchema.safeParse(input.subjectIds);
  if (!parsed.success) {
    return {
      ok: false,
      appliedToday: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const validIds = await validateSubjectIds(parsed.data);
  if (validIds.length !== parsed.data.length) {
    return {
      ok: false,
      appliedToday: false,
      error: "Beberapa mapel tidak valid atau sudah tidak aktif",
    };
  }

  const today = startOfToday();
  const tomorrow = startOfNextDay();
  const todaysCount = await prisma.challenge.count({
    where: {
      userId,
      type: "DAILY",
      scheduledFor: { gte: today, lt: tomorrow },
    },
  });

  await prisma.studentProfile.update({
    where: { userId },
    data: { challengeSubjectIds: validIds },
  });

  const appliedToday = todaysCount === 0;
  if (appliedToday) {
    try {
      await generateAndStoreDailyChallenges(userId, today);
    } catch (err) {
      console.error(
        "setChallengeSubjects: failed to generate immediately",
        err,
      );
    }
  }

  revalidatePath("/challenge", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, appliedToday };
}

export async function setWeeklyChallengeSubjects(input: {
  subjectIds: string[];
}): Promise<{
  ok: boolean;
  appliedThisWeek: boolean;
  error?: string;
}> {
  const userId = await requireStudent();
  const parsed = subjectIdsSchema.safeParse(input.subjectIds);
  if (!parsed.success) {
    return {
      ok: false,
      appliedThisWeek: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const validIds = await validateSubjectIds(parsed.data);
  if (validIds.length !== parsed.data.length) {
    return {
      ok: false,
      appliedThisWeek: false,
      error: "Beberapa mapel tidak valid atau sudah tidak aktif",
    };
  }

  const monday = startOfWeek(new Date());
  const existingWeekly = await prisma.weeklyChallenge.findUnique({
    where: { userId_weekStart: { userId, weekStart: monday } },
  });

  await prisma.studentProfile.update({
    where: { userId },
    data: { weeklyChallengeSubjectIds: validIds },
  });

  const appliedThisWeek = !existingWeekly;
  if (appliedThisWeek) {
    try {
      await regenerateWeeklyChallenge(userId);
    } catch (err) {
      console.error("setWeeklyChallengeSubjects: failed to regenerate", err);
    }
  }

  revalidatePath("/challenge", "layout");
  revalidatePath("/dashboard", "layout");
  return { ok: true, appliedThisWeek };
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
