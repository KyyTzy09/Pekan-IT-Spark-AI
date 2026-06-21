import { redirect } from "next/navigation";
import { UploadShareView } from "@/components/student/upload/upload-share-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listOwnedChats } from "@/server/actions/documents";

export const dynamic = "force-dynamic";

export default async function UploadSharePage({
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

  const chatsResult = await listOwnedChats(20);
  const chats = chatsResult.ok ? chatsResult.sessions : [];

  return (
    <UploadShareView
      document={{ id: doc.id, originalName: doc.originalName }}
      initialChats={chats}
    />
  );
}
