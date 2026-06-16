import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatConversationView } from "@/components/student/chat-conversation-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChatMessages, getChatSession } from "@/server/actions/chat";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<Metadata> {
  const { sessionId } = await params;
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId: "" },
    select: { title: true },
  });
  return {
    title: session?.title ? `${session.title} — Spark Ai` : "Chat — Spark Ai",
  };
}

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  const { sessionId } = await params;
  const chatSession = await getChatSession(sessionId);
  if (!chatSession || chatSession.userId !== session?.user?.id) {
    notFound();
  }

  const messages = await getChatMessages(sessionId);

  const subject = chatSession.subject
    ? {
        id: chatSession.subject.id,
        name: chatSession.subject.name,
        slug: chatSession.subject.slug,
      }
    : null;
  const topic = chatSession.topic
    ? { id: chatSession.topic.id, name: chatSession.topic.name }
    : null;

  return (
    <ChatConversationView
      sessionId={sessionId}
      initialMessages={messages}
      subject={subject}
      topic={topic}
      title={chatSession.title}
    />
  );
}
