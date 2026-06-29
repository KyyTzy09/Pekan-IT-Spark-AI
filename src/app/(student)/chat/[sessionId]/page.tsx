import { notFound, redirect } from "next/navigation";
import { ChatConversationView } from "@/components/student/chat-conversation-view";
import { getSession } from "@/lib/session";
import { getChatMessages, getChatSession } from "@/server/actions/chat";

export const dynamic = "force-dynamic";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const { sessionId } = await params;

  let chatSession: Awaited<ReturnType<typeof getChatSession>>;
  let messages: Awaited<ReturnType<typeof getChatMessages>>;

  try {
    chatSession = await getChatSession(sessionId);
  } catch (err) {
    console.error("[chat-page] failed to load session", {
      sessionId,
      error: err instanceof Error ? err.message : String(err),
    });
    notFound();
  }

  if (!chatSession || chatSession.userId !== session.id) {
    notFound();
  }

  try {
    messages = await getChatMessages(sessionId);
  } catch (err) {
    console.error("[chat-page] failed to load messages", {
      sessionId,
      error: err instanceof Error ? err.message : String(err),
    });
    messages = [];
  }

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
