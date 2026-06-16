import { redirect } from "next/navigation";
import { ActivityView } from "@/components/student/activity/activity-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStudentActivity } from "@/server/actions/activity";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const userId = session.user.id;

  const [activity, profile] = await Promise.all([
    getStudentActivity(userId, 365),
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { totalXp: true, level: true },
    }),
  ]);

  return (
    <ActivityView
      activity={activity}
      studentName={session.user.name ?? "Teman"}
      currentLevel={profile?.level ?? 1}
      totalXp={profile?.totalXp ?? 0}
    />
  );
}
