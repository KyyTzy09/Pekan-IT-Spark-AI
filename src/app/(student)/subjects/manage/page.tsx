import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SubjectsManageView } from "@/components/student/subjects-manage-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kelola Favorit — Spark Ai",
  description: "Pilih mata pelajaran favorit kamu.",
};

export default async function SubjectsManagePage() {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "STUDENT") redirect("/");

  const userId = session.id;

  const [profile, subjects, knowledgeProfiles] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { focusedSubjects: true },
    }),
    prisma.subject.findMany({
      where: {
        OR: [{ createdById: null }, { createdById: userId }],
      },
      orderBy: [{ isCustom: "asc" }, { order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        description: true,
        isCustom: true,
        source: true,
      },
    }),
    prisma.studentKnowledgeProfile.findMany({
      where: { userId },
      select: {
        conceptId: true,
        masteryScore: true,
        status: true,
      },
    }),
  ]);

  const focusedIds = profile?.focusedSubjects ?? [];

  // Compute stats for each subject
  const subjectItems = await Promise.all(
    subjects.map(async (s) => {
      const concepts = await prisma.concept.findMany({
        where: { topic: { subjectId: s.id } },
        select: { id: true },
      });
      const totalConcepts = concepts.length;
      const conceptIds = new Set(concepts.map((c) => c.id));
      const relevantProfiles = knowledgeProfiles.filter((p) =>
        conceptIds.has(p.conceptId),
      );
      const averageMastery =
        relevantProfiles.length > 0
          ? Math.round(
              (relevantProfiles.reduce((a, p) => a + p.masteryScore, 0) /
                relevantProfiles.length) *
                100,
            )
          : 0;
      const mastered = relevantProfiles.filter(
        (p) => p.status === "MASTERED",
      ).length;

      return {
        ...s,
        totalConcepts,
        averageMastery,
        mastered,
        isFavorite: focusedIds.includes(s.id),
      };
    }),
  );

  return <SubjectsManageView subjects={subjectItems} focusedIds={focusedIds} />;
}
