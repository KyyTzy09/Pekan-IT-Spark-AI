"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  completeActivity as completeActivityData,
  getOrGenerateWeeklyPlan,
  regenerateWeeklyPlan,
  uncompleteActivity as uncompleteActivityData,
  type WeeklyPlan,
} from "@/server/learning-plan";

async function requireStudent() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  if (session.user.role !== "STUDENT") {
    throw new Error("FORBIDDEN");
  }
  return session.user.id;
}

export async function getOrCreateCurrentPlan(): Promise<WeeklyPlan> {
  const userId = await requireStudent();
  return getOrGenerateWeeklyPlan(userId);
}

export async function regenerateCurrentPlan(): Promise<WeeklyPlan> {
  const userId = await requireStudent();
  const plan = await regenerateWeeklyPlan(userId);
  revalidatePath("/plan");
  return plan;
}

export async function markActivityComplete(
  activityId: string,
): Promise<WeeklyPlan | null> {
  const userId = await requireStudent();
  const plan = await completeActivityData(userId, activityId);
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  return plan;
}

export async function markActivityIncomplete(
  activityId: string,
): Promise<WeeklyPlan | null> {
  const userId = await requireStudent();
  const plan = await uncompleteActivityData(userId, activityId);
  revalidatePath("/plan");
  return plan;
}
