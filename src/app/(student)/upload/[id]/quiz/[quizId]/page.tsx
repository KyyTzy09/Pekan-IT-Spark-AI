import { redirect } from "next/navigation";
import { UploadQuizPlayerView } from "@/components/student/upload/upload-quiz-player-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDocumentQuizAction } from "@/server/actions/documents";

export const dynamic = "force-dynamic";

export default async function UploadQuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const session = await getSession();
  if (!session?.id) {
    redirect("/auth/login");
  }
  if (session.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { id: documentId, quizId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: session.id },
    select: { id: true, originalName: true },
  });
  if (!doc) {
    redirect("/upload");
  }

  const quiz = await getDocumentQuizAction(quizId);
  if (!quiz.ok) {
    redirect(`/upload/${documentId}?tab=quizzes`);
  }

  return (
    <UploadQuizPlayerView
      document={{ id: doc.id, originalName: doc.originalName }}
      quiz={quiz.quiz}
    />
  );
}
