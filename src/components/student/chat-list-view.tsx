"use client";

import {
  ArrowRight,
  BookOpen,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatSessionSummary } from "@/server/actions/chat";
import { deleteChatSession, startNewChat } from "@/server/actions/chat";

type SubjectOption = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

export function ChatListView({
  sessions,
  subjects,
  userName,
}: {
  sessions: ChatSessionSummary[];
  subjects: SubjectOption[];
  userName: string;
}) {
  const router = useRouter();
  const [message, setMessage] = React.useState("");
  const [subjectSlug, setSubjectSlug] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await startNewChat({
        firstMessage: trimmed,
        subjectSlug: subjectSlug || undefined,
      });
      router.push(`/chat/${result.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mulai chat.");
      setSubmitting(false);
    }
  };

  const onDelete = async (sessionId: string) => {
    if (!window.confirm("Hapus chat ini? Riwayatnya bakal ilang permanen.")) {
      return;
    }
    await deleteChatSession(sessionId);
    router.refresh();
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <NewChatCard
        userName={userName}
        message={message}
        setMessage={setMessage}
        subjectSlug={subjectSlug}
        setSubjectSlug={setSubjectSlug}
        subjects={subjects}
        submitting={submitting}
        error={error}
        onStart={onStart}
      />

      <SessionsList sessions={sessions} onDelete={onDelete} />
    </div>
  );
}

function NewChatCard({
  userName,
  message,
  setMessage,
  subjectSlug,
  setSubjectSlug,
  subjects,
  submitting,
  error,
  onStart,
}: {
  userName: string;
  message: string;
  setMessage: (v: string) => void;
  subjectSlug: string;
  setSubjectSlug: (v: string) => void;
  subjects: SubjectOption[];
  submitting: boolean;
  error: string | null;
  onStart: (e: React.FormEvent) => void;
}) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-16 size-36 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.72 0.18 280 / 0.5), transparent 70%)",
        }}
      />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
          <MessageCircle size={10} strokeWidth={2.5} />
          Tanya Spark
        </span>
        <h1 className="mt-2 font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[30px]">
          Halo, <span className="text-gradient-warm">{userName}</span> 👋
        </h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
          Tulis apa yang lagi bikin bingung. Spark bakal nge-bimbing kamu lewat
          pertanyaan Socratic — bukan kasih jawaban langsung.
        </p>

        <form onSubmit={onStart} className="relative mt-5 space-y-3">
          {subjects.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
                Mapel (opsional)
              </p>
              <div className="flex flex-wrap gap-1.5">
                <SubjectChip
                  slug=""
                  name="Umum"
                  icon="✨"
                  color="var(--purple)"
                  active={subjectSlug === ""}
                  onClick={() => setSubjectSlug("")}
                />
                {subjects.map((s) => (
                  <SubjectChip
                    key={s.id}
                    slug={s.slug}
                    name={s.name}
                    icon={s.icon ?? "📚"}
                    color={s.color ?? "var(--coral)"}
                    active={subjectSlug === s.slug}
                    onClick={() => setSubjectSlug(s.slug)}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="chat-input" className="sr-only">
              Pesan untuk Spark
            </label>
            <div className="group/field relative flex items-end rounded-2xl border border-transparent bg-input/40 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25">
              <textarea
                id="chat-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onStart(e as unknown as React.FormEvent);
                  }
                }}
                rows={3}
                placeholder="Contoh: Kenapa sih persamaan linear bisa diselesaikan dengan substitusi? Aku belum ngerti..."
                className="min-h-[88px] w-full resize-none rounded-2xl bg-transparent px-3.5 py-3 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
                disabled={submitting}
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive"
            >
              <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-destructive" />
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10.5px] font-semibold text-muted-foreground">
              <Sparkles size={10} className="mr-1 inline text-[var(--coral)]" />
              Enter buat kirim · Shift+Enter buat baris baru
            </p>
            <Button
              type="submit"
              disabled={!message.trim() || submitting}
              className="rounded-2xl bg-[var(--coral)] text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Nyiapin...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Mulai Chat
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </header>
  );
}

function SubjectChip({
  slug: _slug,
  name,
  icon,
  color,
  active,
  onClick,
}: {
  slug: string;
  name: string;
  icon: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-all",
        active
          ? "border-transparent bg-[var(--coral)]/10 text-[var(--coral)] shadow-[inset_0_0_0_1.5px_rgba(225,29,72,0.3)]"
          : "border-border/40 bg-background/40 text-foreground/70 hover:border-border/70",
      )}
      style={
        active
          ? { background: `color-mix(in oklch, ${color} 10%, transparent)` }
          : undefined
      }
    >
      <span className="text-[12px]">{icon}</span>
      {name}
    </button>
  );
}

function SessionsList({
  sessions,
  onDelete,
}: {
  sessions: ChatSessionSummary[];
  onDelete: (id: string) => void;
}) {
  if (sessions.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white">
          <BookOpen size={20} strokeWidth={2.5} />
        </span>
        <h2 className="font-heading text-[16px] font-bold text-foreground">
          Belum ada chat
        </h2>
        <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-muted-foreground">
          Mulai chat pertama kamu di atas. Spark bakal nyimpen riwayatnya di
          sini biar bisa dilanjut nanti.
        </p>
      </section>
    );
  }

  return (
    <section>
      <header className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
            Riwayat
          </p>
          <h2 className="mt-1 font-heading text-[18px] font-bold leading-tight text-foreground">
            {sessions.length} chat sebelumnya
          </h2>
        </div>
        <span className="rounded-full border border-border/40 bg-background/60 px-2.5 py-1 text-[10.5px] font-bold text-muted-foreground">
          Paling baru di atas
        </span>
      </header>
      <div className="space-y-2">
        {sessions.map((s) => (
          <SessionRow key={s.id} session={s} onDelete={onDelete} />
        ))}
      </div>
    </section>
  );
}

function SessionRow({
  session,
  onDelete,
}: {
  session: ChatSessionSummary;
  onDelete: (id: string) => void;
}) {
  const formatted = session.lastMessageAt
    ? new Date(session.lastMessageAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Link
      href={`/chat/${session.id}`}
      className="group/sess relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-3.5 transition-all hover:-translate-y-0.5 hover:border-border/70 hover:shadow-[0_8px_24px_rgba(80,20,50,0.1)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover/sess:opacity-40"
        style={{
          background: session.subjectName
            ? `color-mix(in oklch, var(--coral) 30%, transparent)`
            : "color-mix(in oklch, var(--purple) 30%, transparent)",
        }}
      />
      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-heading text-[13.5px] font-bold text-foreground">
            {session.title}
          </h3>
          {session.subjectName && (
            <span className="shrink-0 rounded-full bg-foreground/5 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-foreground/60">
              {session.subjectName}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10.5px] text-muted-foreground">
          {session.messageCount} pesan · {formatted}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(session.id);
        }}
        aria-label="Hapus chat"
        className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground/40 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover/sess:opacity-100"
      >
        <Trash2 size={13} />
      </button>
      <ArrowRight
        size={14}
        className="shrink-0 text-muted-foreground/50 transition-colors group-hover/sess:text-[var(--coral)]"
      />
    </Link>
  );
}

void Plus;
