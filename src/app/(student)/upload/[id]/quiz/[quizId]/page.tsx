import { redirect } from "next/navigation";
import { UploadQuizPlayerView } from "@/components/student/upload/upload-quiz-player-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDocumentQuizAction } from "@/server/actions/documents";

export const dynamic = "force-dynamic";

export default async function UploadQuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { id: documentId, quizId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: session.user.id },
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