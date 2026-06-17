"use client";

import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shareDocumentToChatSession } from "@/server/actions/documents";

type Chat = { id: string; title: string; subjectName: string | null };

export function UploadShareView({
  document,
  initialChats,
}: {
  document: { id: string; originalName: string };
  initialChats: Chat[];
}) {
  const router = useRouter();
  const [chats] = React.useState<Chat[]>(initialChats);
  const [confirming, setConfirming] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [doneId, setDoneId] = React.useState<string | null>(null);

  const handleConfirm = async (chatSessionId: string) => {
    setConfirming(chatSessionId);
    setError(null);
    try {
      const result = await shareDocumentToChatSession(
        document.id,
        chatSessionId,
      );
      if (!result.ok) {
        setError(result.error);
        setConfirming(null);
        return;
      }
      setDoneId(chatSessionId);
      window.setTimeout(() => {
        router.push(`/chat/${chatSessionId}`);
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal.");
      setConfirming(null);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.15 0 / 0.4), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3">
            <nav className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Link
                href="/upload"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <ArrowLeft size={11} />
                Upload
              </Link>
              <ChevronRight size={11} />
              <Link
                href={`/upload/${document.id}`}
                className="truncate transition-colors hover:text-foreground"
              >
                {document.originalName}
              </Link>
              <ChevronRight size={11} />
              <span className="text-foreground">Share ke chat</span>
            </nav>
            <div className="flex items-start gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--coral)]/10 text-[var(--coral)]">
                <Share2 size={18} />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                  <Share2 size={10} strokeWidth={2.5} />
                  Share ke chat
                </span>
                <h1 className="mt-1 font-heading text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
                  {document.originalName}
                </h1>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Spark bakal jawab berdasarkan dokumen ini di chat yang kamu
                  pilih.
                </p>
              </div>
            </div>
          </div>
        </header>
      </Reveal>

      {error && (
        <div className="rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      {doneId && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/50 bg-emerald-50/80 px-4 py-3 text-[13px] text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
          <Loader2 size={14} className="animate-spin" />
          Berhasil ke-attach! Lanjut diskusi di chat...
        </div>
      )}

      <Reveal delay={60}>
        <div className="rounded-2xl border border-border/40 bg-card/85 p-3 shadow-[0_6px_18px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-5">
          {chats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-[13px] text-muted-foreground">
              Belum ada chat. Mulai chat baru dulu dari menu{" "}
              <Link href="/chat" className="text-[var(--coral)] underline">
                Tanya Spark
              </Link>
              , nanti balik ke sini buat share dokumen.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {chats.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handleConfirm(c.id)}
                    disabled={confirming !== null || doneId !== null}
                    className={cn(
                      "group/chat flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-background/60 p-3.5 text-left transition-all hover:border-border/70 hover:bg-background disabled:opacity-50",
                    )}
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--coral)]/10 text-[var(--coral)]">
                      <MessageCircle size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">
                        {c.title}
                      </p>
                      {c.subjectName && (
                        <p className="text-[10.5px] text-muted-foreground">
                          {c.subjectName}
                        </p>
                      )}
                    </div>
                    {confirming === c.id ? (
                      <Loader2
                        size={14}
                        className="animate-spin text-[var(--coral)]"
                      />
                    ) : doneId === c.id ? (
                      <Loader2
                        size={14}
                        className="animate-spin text-emerald-600"
                      />
                    ) : (
                      <ChevronRight
                        size={14}
                        className="text-muted-foreground/50 transition-colors group-hover/chat:text-[var(--coral)]"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex justify-end border-t border-border/40 pt-4">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/upload/${document.id}`}>Batal</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}