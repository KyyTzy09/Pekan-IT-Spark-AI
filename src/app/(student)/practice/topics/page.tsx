import { redirect } from "next/navigation";
import { TopicPickerView } from "@/components/student/practice/topic-picker-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TopicPickerPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const userId = session.id;
  const sp = await searchParams;
  const subjectSlug = sp.subject;

  // Fetch subjects with topics
  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      icon: true,
      color: true,
    },
  });

  // Fetch topics with mastery data
  const topics = await prisma.topic.findMany({
    where: {
      subject: { isActive: true },
      ...(subjectSlug ? { subject: { slug: subjectSlug } } : {}),
    },
    include: {
      subject: {
        select: { name: true, slug: true, icon: true, color: true },
      },
      concepts: {
        select: {
          id: true,
          knowledgeProfiles: {
            where: { userId },
            select: { masteryScore: true, status: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Build recommendations
  const topicRecommendations = topics.map((topic) => {
    const conceptsWithMastery = topic.concepts.map((c) => {
      const profile = c.knowledgeProfiles[0];
      return {
        id: c.id,
        masteryScore: profile?.masteryScore ?? 0,
        status: profile?.status ?? "NOT_STARTED",
      };
    });

    const totalConcepts = conceptsWithMastery.length;
    const avgMastery =
      totalConcepts > 0
        ? Math.round(
            (conceptsWithMastery.reduce((sum, c) => sum + c.masteryScore, 0) /
              totalConcepts) *
              100,
          )
        : 0;

    const weakConcepts = conceptsWithMastery.filter(
      (c) => c.masteryScore < 0.4,
    ).length;

    let reason = "";
    if (weakConcepts > 0) {
      reason = `Kamu punya ${weakConcepts} konsep yang masih lemah di topik ini`;
    } else if (avgMastery < 40) {
      reason = "Topik ini baru dimulai, yuk lanjutkan!";
    } else if (avgMastery < 70) {
      reason = "Hampir paham, tinggal sedikit lagi!";
    } else {
      reason = "Topik ini sudah kuat, bisa buat review";
    }

    return {
      topicId: topic.id,
      topicName: topic.name,
      topicSlug: topic.slug,
      subjectName: topic.subject.name,
      subjectSlug: topic.subject.slug,
      subjectIcon: topic.subject.icon,
      subjectColor: topic.subject.color,
      masteryPct: avgMastery,
      weakConceptCount: weakConcepts,
      totalConceptCount: totalConcepts,
      recommendationReason: reason,
    };
  });

  return (
    <TopicPickerView
      topics={topicRecommendations}
      subjects={subjects}
      subjectSlug={subjectSlug}
    />
  );
}
