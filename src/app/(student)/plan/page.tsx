import { redirect } from "next/navigation";
import { LearningPlanView } from "@/components/student/learning-plan-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { WeeklyPlan } from "@/server/learning-plan";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const userId = session.user.id;
  const now = new Date();
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  const weekStartDateTime = date;

  // Check if plan already exists in database (very fast query)
  const existing = await prisma.learningPlan.findUnique({
    where: {
      userId_weekStart: {
        userId,
        weekStart: weekStartDateTime,
      },
    },
  });

  const plan = existing ? (existing.plan as unknown as WeeklyPlan) : null;

  return <LearningPlanView initialPlan={plan} />;
}
