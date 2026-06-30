"use client";

import type { UIMessage } from "@tanstack/ai-client";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { QuotaExhaustedModal } from "@/components/student/quota-exhausted-modal";
import { SparkCharacter } from "@/components/student/spark-character";
import { Button } from "@/components/ui/button";
import { deleteChatSession } from "@/server/actions/chat";

type ServerMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
};

type Subject = { id: string; name: string; slug: string } | null;
type Topic = { id: string; name: string } | null;

function toUIMessages(messages: ServerMessage[]): UIMessage[] {
  return messages
    .filter((m) => m.role === "USER" || m.role === "ASSISTANT")
    .map((m) => ({
      id: m.id,
      role: m.role.toLowerCase() as "user" | "assistant",
      parts: [{ type: "text" as const, content: m.content }],
      createdAt: new Date(m.createdAt),
    }));
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; content: string } => p.type === "text")
    .map((p) => p.content)
    .join("");
}

export function ChatConversationView({
  sessionId,
  initialMessages,
  subject,
  topic,
  title,
}: {
  sessionId: string;
  initialMessages: ServerMessage[];
  subject: Subject;
  topic: Topic;
  title: string;
}) {
  const router = useRouter();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [quotaModalOpen, setQuotaModalOpen] = React.useState(false);
  const [input, setInput] = React.useState("");

  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents(`/api/chat/${sessionId}/stream`),
    initialMessages: toUIMessages(initialMessages),
    onError: (err) => {
      console.error("[chat] useChat onError:", err.message);
      const msg = err.message || "";
      if (
        msg.includes("kuota") ||
        msg.includes("Kuota") ||
        msg.includes("429")
      ) {
        setQuotaModalOpen(true);
      }
    },
    onFinish: (message) => {
      console.log("[chat] useChat onFinish:", {
        id: message.id,
        role: message.role,
        parts: message.parts.length,
        textLen: getTextContent(message).length,
      });
      router.refresh();
    },
    onChunk: (chunk) => {
      console.log("[chat] useChat onChunk:", chunk.type);
    },
  });

  console.log("[chat] render:", {
    messageCount: messages.length,
    isLoading,
    hasError: !!error,
    roles: messages.map((m) => m.role),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Auto-trigger AI response for the first user message.
  // useChat with initialMessages does NOT auto-send to the stream endpoint,
  // so we need to manually send when there's only a user message (no assistant reply yet).
  const hasAutoSentRef = React.useRef(false);
  React.useEffect(() => {
    if (hasAutoSentRef.current) return;
    if (isLoading) return;
    if (messages.length !== 1) return;
    const first = messages[0];
    if (first.role !== "user") return;
    const text = getTextContent(first);
    if (!text) return;
    hasAutoSentRef.current = true;
    sendMessage(text);
  }, [messages, isLoading, sendMessage]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    console.log("[chat] sending message", {
      sessionId,
      length: trimmed.length,
    });
    await sendMessage(trimmed);
  };

  const onDelete = async () => {
    if (!window.confirm("Hapus chat ini? Riwayatnya bakal ilang permanen.")) {
      return;
    }
    try {
      await deleteChatSession(sessionId);
      router.push("/chat");
    } catch {
      // deleteChatSession calls redirect() internally, which throws NEXT_REDIRECT
    }
  };

  return (
    <div className="flex h-[calc(100svh-7rem)] flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/70 shadow-[0_8px_24px_rgba(80,20,50,0.08)] backdrop-blur-md sm:h-[calc(100svh-8rem)]">
      <ChatHeader
        title={title}
        subject={subject}
        topic={topic}
        onBack={() => router.push("/chat")}
        onDelete={onDelete}
      />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6"
      >
        {messages.length === 0 ? (
          <EmptyChat />
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-3.5">
            {messages
              .filter((m) => !(m.role === "assistant" && !getTextContent(m)))
              .map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            {isLoading && <TypingIndicator />}
          </div>
        )}
      </div>

      {error && !quotaModalOpen && (
        <div role="alert" className="mx-auto max-w-2xl px-4 pb-3">
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive">
            <span className="shrink-0">⚠️</span>
            <span>{error.message}</span>
          </div>
        </div>
      )}

      <form
        onSubmit={onSend}
        className="border-t border-border/40 bg-background/60 p-3 backdrop-blur-md sm:p-4"
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <div className="group/field relative flex flex-1 items-end rounded-2xl border border-transparent bg-input/40 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend(e as unknown as React.FormEvent);
                }
              }}
              rows={1}
              placeholder="Tulis pertanyaan atau pemikiran kamu..."
              className="max-h-32 min-h-[40px] w-full resize-none rounded-2xl bg-transparent px-3.5 py-2.5 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="size-11 shrink-0 rounded-2xl bg-[var(--coral)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90"
            aria-label="Kirim"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
        <p className="mx-auto mt-1.5 max-w-2xl text-center text-[10px] font-semibold text-muted-foreground">
          <Sparkles size={9} className="mr-1 inline text-[var(--coral)]" />
          Spark bisa salah — selalu konfirmasi ke guru untuk hal penting
        </p>
      </form>

      <QuotaExhaustedModal
        open={quotaModalOpen}
        onClose={() => setQuotaModalOpen(false)}
        quotaType="chat"
      />
    </div>
  );
}

function ChatHeader({
  title,
  subject,
  topic,
  onBack,
  onDelete,
}: {
  title: string;
  subject: Subject;
  topic: Topic;
  onBack: () => void;
  onDelete: () => void;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-border/40 bg-background/60 px-4 py-3 backdrop-blur-md sm:px-5 sm:py-3.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="size-9 rounded-full"
        aria-label="Balik ke daftar chat"
      >
        <ArrowLeft size={16} />
      </Button>
      <SparkCharacter size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-bold text-foreground">
          {title}
        </p>
        <p className="flex items-center gap-1.5 text-[10.5px] font-semibold text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-[var(--teal)]" />
          Spark online
          {subject && (
            <>
              <span className="text-muted-foreground/40">·</span>
              {subject.name}
            </>
          )}
          {topic && (
            <>
              <span className="text-muted-foreground/40">·</span>
              {topic.name}
            </>
          )}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="size-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Hapus chat"
      >
        <Trash2 size={14} />
      </Button>
    </header>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const content = getTextContent(message);
  if (!content) return null;

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md border border-border/30 bg-foreground/5 px-4 py-2.5 text-[13.5px] leading-relaxed text-foreground">
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_12px_rgba(225,29,72,0.35)]">
        <Sparkles size={13} strokeWidth={2.5} />
      </div>
      <div className="relative max-w-[80%] overflow-hidden rounded-2xl rounded-tl-md border border-[var(--coral)]/20 bg-gradient-to-br from-[var(--coral)]/8 to-[var(--orange)]/5 px-4 py-2.5 text-[13.5px] leading-relaxed text-foreground shadow-[0_2px_10px_rgba(225,29,72,0.06)]">
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_12px_rgba(225,29,72,0.35)]">
        <Sparkles size={13} strokeWidth={2.5} />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-[var(--coral)]/20 bg-[var(--coral)]/5 px-4 py-3">
        <span className="inline-block size-1.5 animate-pulse-soft rounded-full bg-[var(--coral)]" />
        <span
          className="inline-block size-1.5 animate-pulse-soft rounded-full bg-[var(--coral)]"
          style={{ animationDelay: "0.2s" }}
        />
        <span
          className="inline-block size-1.5 animate-pulse-soft rounded-full bg-[var(--coral)]"
          style={{ animationDelay: "0.4s" }}
        />
        <span className="ml-1.5 text-[10.5px] font-semibold text-muted-foreground">
          Spark lagi mikir...
        </span>
      </div>
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center">
      <span className="mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)]">
        <MessageCircle size={28} strokeWidth={2.2} />
      </span>
      <h2 className="font-heading text-[18px] font-bold text-foreground">
        Mulai ngobrol sama Spark
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        Tulis apa yang bikin bingung di bawah. Spark bakal nge-bimbing lewat
        pertanyaan, bukan langsung kasih jawaban.
      </p>
    </div>
  );
}
