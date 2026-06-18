import { redirect } from "next/navigation";
import { UploadWorkspaceView } from "@/components/student/upload/upload-workspace-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function UploadWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { id: documentId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: session.user.id },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      size: true,
      pageCount: true,
      createdAt: true,
      summary: true,
    },
  });

  if (!doc) {
    redirect("/upload");
  }

  const [materials, quizzes, chunkCount] = await Promise.all([
    prisma.material.findMany({
      where: { documentId, userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        difficulty: true,
        estimatedMinutes: true,
        createdAt: true,
      },
    }),
    prisma.documentQuiz.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        questions: true,
        attempts: true,
        createdAt: true,
      },
    }),
    prisma.documentEmbedding.count({
      where: { documentId },
    }),
  ]);

  type ParsedSummary = {
    title: string;
    summary: string;
    keyPoints: string[];
    hasHomework: boolean;
    homeworkTopic?: string;
  };

  let parsedSummary: ParsedSummary | null = null;
  if (doc.summary) {
    try {
      parsedSummary = JSON.parse(doc.summary) as ParsedSummary;
    } catch {
      parsedSummary = null;
    }
  }

  return (
    <UploadWorkspaceView
      document={{
        id: doc.id,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        pageCount: doc.pageCount,
        chunkCount,
        createdAt: doc.createdAt.toISOString(),
      }}
      summary={parsedSummary}
      materials={materials.map((m) => ({
        id: m.id,
        title: m.title,
        difficulty: m.difficulty,
        estimatedMinutes: m.estimatedMinutes,
        createdAt: m.createdAt.toISOString(),
      }))}
      quizzes={quizzes.map((q) => {
        const questionsList = Array.isArray(q.questions)
          ? (q.questions as any[])
          : [];
        const attemptsList = Array.isArray(q.attempts)
          ? (q.attempts as any[])
          : [];
        const lastAttempt = attemptsList[attemptsList.length - 1];
        return {
          id: q.id,
          title: q.title,
          questionsCount: questionsList.length,
          attemptsCount: attemptsList.length,
          lastScore: lastAttempt ? (lastAttempt.score as number) : null,
          createdAt: q.createdAt.toISOString(),
        };
      })}
    />
  );
}
