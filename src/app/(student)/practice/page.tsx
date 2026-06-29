import { redirect } from "next/navigation";
import { PracticeLanding } from "@/components/student/practice/practice-landing";
import { PracticeEmptyState } from "@/components/student/practice-empty-state";
import { PracticePlayer } from "@/components/student/practice-player";
import { Reveal } from "@/components/shared/reveal";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  getNextPracticeQuestion,
  getPracticeStats,
} from "@/server/actions/practice";

export const dynamic = "force-dynamic";

const FALLBACK_STATS = {
  accuracyPct: 0,
  recentTotal: 0,
  masteredCount: 0,
  strugglingCount: 0,
  currentDifficulty: "EASY" as const,
  recommendedDifficulty: "EASY" as const,
  longestStreak: 0,
};

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ topicId?: string; subject?: string; mode?: string }>;
}) {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const sp = await searchParams;
  const topicId = sp.topicId ?? undefined;
  const subjectSlug = sp.subject ?? undefined;
  const mode = sp.mode ?? undefined;

  // If no topicId and mode is not adaptive, show landing page
  if (!topicId && mode !== "adaptive") {
    return <PracticeLanding subjectSlug={subjectSlug} />;
  }

  // Look up subjectId for auto-generation in empty state
  let subjectIdForEmpty: string | undefined;
  if (topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { subjectId: true },
    });
    subjectIdForEmpty = topic?.subjectId;
  } else if (!subjectSlug) {
    // Adaptive mode: use first focused subject for auto-generation
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.id },
      select: { focusedSubjects: true },
    });
    subjectIdForEmpty = profile?.focusedSubjects?.[0];
  }

  // Otherwise, get the next practice question
  const [nextResult, stats] = await Promise.all([
    getNextPracticeQuestion({ topicId, subjectSlug }),
    getPracticeStats(),
  ]);

  return (
    <div className="space-y-5 sm:space-y-7">
      {!nextResult.ok ? (
        <Reveal>
          <PracticeEmptyState
            error={nextResult.error}
            subjects={[]}
            subjectId={subjectIdForEmpty}
          />
        </Reveal>
      ) : (
        <Reveal>
          <PracticePlayer
            initialSession={nextResult.session}
            initialStats={stats ?? FALLBACK_STATS}
            subjectSlug={subjectSlug}
            topicId={topicId}
          />
        </Reveal>
      )}
    </div>
  );
}
