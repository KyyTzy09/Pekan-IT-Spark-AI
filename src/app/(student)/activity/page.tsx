import { redirect } from "next/navigation";
import { ActivityView } from "@/components/student/activity/activity-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getStudentActivity } from "@/server/actions/activity";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "STUDENT") redirect("/dashboard");

  const userId = session.id;

  const [activity, profile] = await Promise.all([
    getStudentActivity(userId, 180), // Reduced from 365 to 180 days
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { totalXp: true, level: true },
    }),
  ]);

  return (
    <ActivityView
      activity={activity}
      studentName={session.name ?? "Teman"}
      currentLevel={profile?.level ?? 1}
      totalXp={profile?.totalXp ?? 0}
    />
  );
}
