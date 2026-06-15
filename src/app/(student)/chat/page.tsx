import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChatListView } from "@/components/student/chat-list-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listChatSessions } from "@/server/actions/chat";

export const metadata: Metadata = {
  title: "Tanya Spark — Spark Ai",
  description: "Chat Socratic bareng Spark, sabar dan suportif.",
};

export default async function ChatListPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/");
  }
  if (!session.user.isOnboarded) {
    redirect("/onboarding");
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
      userName={session.user.name ?? "Teman"}
      subjects={subjects}
      sessions={sessions}
    />
  );
}
