import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddSubjectDialog } from "@/components/student/add-subject-dialog";
import {
  type SubjectListItem,
  SubjectsListView,
} from "@/components/student/subjects-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mata pelajaran — Spark Ai",
  description:
    "Pilih mata pelajaran buat lihat skill tree dan konstelasi konsep.",
};

export default async function SubjectsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  const userId = session.user.id;

  const [profile, subjects, conceptsInSubjects, profiles] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { focusedSubjects: true },
    }),
    prisma.subject.findMany({
      where: {
        OR: [{ createdById: null }, { createdById: userId }],
      },
      orderBy: [{ isCustom: "asc" }, { order: "asc" }, { name: "asc" }],
    }),
    prisma.concept.findMany({
      select: { id: true, topic: { select: { subjectId: true } } },
    }),
    prisma.studentKnowledgeProfile.findMany({
      where: { userId },
      select: { conceptId: true, status: true, masteryScore: true },
    }),
  ]);

  const focusedIds = profile?.focusedSubjects ?? [];
  const profileByConcept = new Map(profiles.map((p) => [p.conceptId, p]));

  const summaries: SubjectListItem[] = subjects.map((s) => {
    const subjectConceptIds = conceptsInSubjects
      .filter((c) => c.topic.subjectId === s.id)
      .map((c) => c.id);
    const subjectProfiles = subjectConceptIds
      .map((id) => profileByConcept.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
    const totalScore = subjectProfiles.reduce(
      (acc, p) => acc + p.masteryScore,
      0,
    );
    const average =
      subjectProfiles.length > 0
        ? Math.round((totalScore / subjectProfiles.length) * 100)
        : 0;
    const mastered = subjectProfiles.filter(
      (p) => p.status === "MASTERED",
    ).length;
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      icon: s.icon,
      color: s.color,
      description: s.description,
      totalConcepts: subjectConceptIds.length,
      averageMastery: average,
      mastered,
      isCustom: s.isCustom,
      source: s.source,
    };
  });

  return (
    <div className="space-y-5 sm:space-y-7">
      <SubjectsListView
        subjects={summaries}
        focusedIds={focusedIds}
        addAction={<AddSubjectDialog />}
      />
    </div>
  );
}
