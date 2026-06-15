"use client";

import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { SparkCharacter } from "@/components/student/spark-character";
import { Button } from "@/components/ui/button";
import { deleteChatSession, sendMessage } from "@/server/actions/chat";

type Message = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
};

type Subject = { id: string; name: string; slug: string } | null;
type Topic = { id: string; name: string } | null;

export function ChatConversationView({
  sessionId,
  initialMessages,
  subject,
  topic,
  title,
}: {
  sessionId: string;
  initialMessages: Message[];
  subject: Subject;
  topic: Topic;
  title: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync local state from server data on server refresh
  React.useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll only on length/pending change
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, pending]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || pending) return;
    setInput("");
    setError(null);
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setPending(true);
    try {
      await sendMessage({
        sessionId,
        content: trimmed,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal kirim pesan.");
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(trimmed);
    } finally {
      setPending(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("Hapus chat ini? Riwayatnya bakal ilang permanen.")) {
      return;
    }
    await deleteChatSession(sessionId);
  };

  return (
    <div className="flex h-[calc(100svh-7rem)] flex-col overflow-hidden rounded-3xl border border-border/40 bg-card/70 shadow-[0_8px_24px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:h-[calc(100svh-8rem)]">
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
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {pending && <TypingIndicator />}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mx-auto max-w-2xl px-4 pb-2 text-[12px] font-medium text-destructive"
        >
          {error}
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
              disabled={pending}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || pending}
            className="size-11 shrink-0 rounded-2xl bg-[var(--coral)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90"
            aria-label="Kirim"
          >
            {pending ? (
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

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "USER") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md border border-border/30 bg-foreground/5 px-4 py-2.5 text-[13.5px] leading-relaxed text-foreground">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
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
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
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

void ArrowRight;
