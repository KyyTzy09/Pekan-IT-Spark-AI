import { redirect } from "next/navigation";
import { UploadMaterialGeneratorView } from "@/components/student/upload/upload-material-generator-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.id) {
    redirect("/auth/login");
  }
  if (session.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { id: documentId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: session.id },
    select: { id: true, originalName: true },
  });
  if (!doc) {
    redirect("/upload");
  }

  return (
    <UploadMaterialGeneratorView
      document={{ id: doc.id, originalName: doc.originalName }}
    />
  );
}
