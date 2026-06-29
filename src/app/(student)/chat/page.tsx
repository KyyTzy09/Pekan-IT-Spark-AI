import { redirect } from "next/navigation";
import { ChatListView } from "@/components/student/chat-list-view";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { listChatSessions } from "@/server/actions/chat";

export const dynamic = "force-dynamic";

export default async function ChatListPage() {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    redirect("/auth/login");
  }

  let subjects: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  }[] = [];
  let sessions: Awaited<ReturnType<typeof listChatSessions>> = [];

  try {
    [subjects, sessions] = await Promise.all([
      prisma.subject.findMany({
        orderBy: { order: "asc" },
        select: { id: true, name: true, slug: true, icon: true, color: true },
      }),
      listChatSessions(),
    ]);
  } catch (err) {
    console.error("[chat-list] failed to load data", {
      userId: session.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return (
    <ChatListView
      userName={session.name ?? "Teman"}
      subjects={subjects}
      sessions={sessions}
    />
  );
}
