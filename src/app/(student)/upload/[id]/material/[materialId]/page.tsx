import { redirect } from "next/navigation";
import { UploadMaterialReaderView } from "@/components/student/upload/upload-material-reader-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getMaterialDetail } from "@/server/actions/challenges";

export const dynamic = "force-dynamic";

export default async function UploadMaterialPage({
  params,
}: {
  params: Promise<{ id: string; materialId: string }>;
}) {
  const session = await getSession();
  if (!session?.id) {
    redirect("/auth/login");
  }
  if (session.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { id: documentId, materialId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: session.id },
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
