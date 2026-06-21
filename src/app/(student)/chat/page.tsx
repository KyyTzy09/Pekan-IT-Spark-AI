import { redirect } from "next/navigation";
import { ChatListView } from "@/components/student/chat-list-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listChatSessions } from "@/server/actions/chat";

export const dynamic = "force-dynamic";

export default async function ChatListPage() {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const [subjects, sessions] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true, icon: true, color: true },
    }),
    listChatSessions(),
  ]);

  return (
    <ChatListView
      userName={session.name ?? "Teman"}
      subjects={subjects}
      sessions={sessions}
    />
  );
}
