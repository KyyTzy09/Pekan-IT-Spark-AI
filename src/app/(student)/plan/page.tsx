import { redirect } from "next/navigation";
import { LearningPlanView } from "@/components/student/learning-plan-view";
import { auth } from "@/lib/auth";
import { getOrGenerateWeeklyPlan } from "@/server/learning-plan";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const plan = await getOrGenerateWeeklyPlan(session.user.id);

  return <LearningPlanView initialPlan={plan} />;
}
