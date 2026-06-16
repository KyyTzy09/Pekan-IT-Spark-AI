import { notFound, redirect } from "next/navigation";
import { ChatConversationView } from "@/components/student/chat-conversation-view";
import { auth } from "@/lib/auth";
import { getChatMessages, getChatSession } from "@/server/actions/chat";

export const dynamic = "force-dynamic";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const { sessionId } = await params;
  const chatSession = await getChatSession(sessionId);
  if (!chatSession || chatSession.userId !== session.user.id) {
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
