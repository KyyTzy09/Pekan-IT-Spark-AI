import { redirect } from "next/navigation";
import { GeneratePracticeView } from "@/components/student/practice/generate-practice-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AI_QUOTA_LIMITS } from "@/server/ai-quota";

export const dynamic = "force-dynamic";

export default async function GeneratePracticePage() {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const userId = session.id;

  // Fetch quota
  const quota = await prisma.dailyAiQuota.findUnique({
    where: { userId },
    select: { practiceGenCount: true, topicGenCount: true },
  });

  const remainingQuota = {
    practiceGen: Math.max(
      0,
      AI_QUOTA_LIMITS.practiceGen - (quota?.practiceGenCount ?? 0),
    ),
    topicGen: Math.max(
      0,
      AI_QUOTA_LIMITS.topicGen - (quota?.topicGenCount ?? 0),
    ),
  };

  // Fetch subjects with topics and concepts
  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
      color: true,
      topics: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          concepts: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return (
    <GeneratePracticeView
      subjects={subjects}
      remainingQuota={remainingQuota}
    />
  );
}
