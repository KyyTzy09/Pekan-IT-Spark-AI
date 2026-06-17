import { redirect } from "next/navigation";
import { UploadQuizGeneratorView } from "@/components/student/upload/upload-quiz-generator-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewQuizPage({
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
    select: { id: true, originalName: true },
  });
  if (!doc) {
    redirect("/upload");
  }

  return (
    <UploadQuizGeneratorView
      document={{ id: doc.id, originalName: doc.originalName }}
    />
  );
}