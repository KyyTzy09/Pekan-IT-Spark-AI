"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import { ChatConversationView } from "@/components/student/chat-conversation-view";

export const dynamic = "force-dynamic";

type ApiData = {
  chatSession: {
    id: string;
    title: string;
    subjectId: string | null;
    createdAt: string;
    subject?: { id: string; name: string; slug: string } | null;
    topic?: { id: string; name: string } | null;
  } | null;
  messages: Array<{
    id: string;
    content: string;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    createdAt: string;
  }>;
};

function ChatLoadingSkeleton() {
  return (
    <div className="flex h-[calc(100svh-7rem)] flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/70 shadow-[0_8px_24px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:h-[calc(100svh-8rem)]">
      <div className="flex items-center gap-3 border-b border-border/40 bg-background/60 px-4 py-3 backdrop-blur-md sm:px-5 sm:py-3.5">
        <div className="size-9 animate-pulse rounded-full bg-muted" />
        <div className="size-8 animate-pulse rounded-full bg-muted" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-2.5 w-28 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3.5">
          {["sk1", "sk2", "sk3", "sk4"].map((key, i) => (
            <div
              key={key}
              className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`h-10 animate-pulse rounded-2xl bg-muted ${
                  i % 2 === 0
                    ? "w-[55%] rounded-br-md"
                    : "w-[60%] rounded-bl-md"
                }`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/40 bg-background/60 p-3 backdrop-blur-md sm:p-4">
        <div className="mx-auto max-w-2xl">
          <div className="h-11 w-full animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function ChatSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  const { data, isLoading, isError } = useQuery<ApiData>({
    queryKey: ["chat", sessionId],
    queryFn: () =>
      fetch(`/api/chat/${sessionId}`).then((r) => {
        if (!r.ok) throw new Error("Gagal memuat chat");
        return r.json();
      }),
    enabled: !!sessionId,
  });

  if (isLoading) {
    return <ChatLoadingSkeleton />;
  }

  if (isError || !data?.chatSession) {
    notFound();
  }

  const { chatSession, messages } = data;

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
