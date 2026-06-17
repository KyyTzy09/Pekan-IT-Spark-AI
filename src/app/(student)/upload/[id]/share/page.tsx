import { redirect } from "next/navigation";
import { UploadShareView } from "@/components/student/upload/upload-share-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listOwnedChats } from "@/server/actions/documents";

export const dynamic = "force-dynamic";

export default async function UploadSharePage({
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

  const chatsResult = await listOwnedChats(20);
  const chats = chatsResult.ok ? chatsResult.sessions : [];

  return (
    <UploadShareView
      document={{ id: doc.id, originalName: doc.originalName }}
      initialChats={chats}
    />
  );
}