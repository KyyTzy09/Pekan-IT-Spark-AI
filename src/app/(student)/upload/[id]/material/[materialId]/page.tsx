import { redirect } from "next/navigation";
import { UploadMaterialReaderView } from "@/components/student/upload/upload-material-reader-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMaterialDetail } from "@/server/actions/challenges";

export const dynamic = "force-dynamic";

export default async function UploadMaterialPage({
  params,
}: {
  params: Promise<{ id: string; materialId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { id: documentId, materialId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: session.user.id },
    select: { id: true, originalName: true },
  });
  if (!doc) {
    redirect("/upload");
  }

  const material = await getMaterialDetail(materialId);
  if (!material) {
    redirect(`/upload/${documentId}?tab=materials`);
  }

  return (
    <UploadMaterialReaderView
      document={{ id: doc.id, originalName: doc.originalName }}
      material={{
        id: material.id,
        title: material.title,
        content: material.content,
        keyPoints: material.keyPoints,
        estimatedMinutes: material.estimatedMinutes,
        difficulty: material.difficulty,
      }}
    />
  );
}
