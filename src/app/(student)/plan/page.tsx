import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LearningPlanView } from "@/components/student/learning-plan-view";
import { auth } from "@/lib/auth";
import { getOrGenerateWeeklyPlan } from "@/server/learning-plan";

export const metadata: Metadata = {
  title: "Rencana Belajar — Spark Ai",
  description:
    "Rencana belajar mingguan yang dipersonalisasi berdasarkan knowledge profile kamu.",
};

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  const plan = await getOrGenerateWeeklyPlan(session.user.id);
  return <LearningPlanView initialPlan={plan} />;
}
