"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Timer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Reveal } from "@/components/shared/reveal";
import { QuizPlayer } from "@/components/student/quiz-player";
import { Button } from "@/components/ui/button";
import type { QuizSession } from "@/server/actions/practice";

export const dynamic = "force-dynamic";

type QuizApiResponse =
  | { ok: true; session: QuizSession }
  | { ok: false; error: string };

export default function QuizPage() {
  const { topicId } = useParams<{ topicId: string }>();

  const mutation = useMutation<QuizApiResponse>({
    mutationFn: async () => {
      const res = await fetch("/api/practice/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });
      if (!res.ok) throw new Error("Gagal memulai quiz");
      return res.json();
    },
  });

  useEffect(() => {
    mutation.mutate();
  }, [mutation]);

  if (mutation.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mutation.isError || !mutation.data?.ok) {
    return (
      <div className="space-y-5 sm:space-y-7">
        <Reveal>
          <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
              }}
            />
            <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
              <Timer size={10} strokeWidth={2.5} />
              Quiz adaptif
            </span>
            <h1 className="relative mt-2 font-heading text-[24px] font-bold leading-tight">
              Belum bisa mulai quiz
            </h1>
            <p className="relative mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
              {mutation.data && "error" in mutation.data
                ? mutation.data.error
                : (mutation.error?.message ?? "Terjadi kesalahan")}
            </p>
            <div className="relative mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-full">
                <Link href="/practice">
                  <ArrowLeft size={13} />
                  Kembali ke latihan
                </Link>
              </Button>
            </div>
          </header>
        </Reveal>
      </div>
    );
  }

  const { session } = mutation.data;

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Quiz mini-exam · {session.subjectName}
              </p>
              <h1 className="mt-1 font-heading text-[20px] font-bold leading-tight">
                {session.topicName}
              </h1>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href={`/topics/${session.topicId}`}>
                <ArrowLeft size={13} />
                Topik
              </Link>
            </Button>
          </div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            {session.totalQuestions} soal · Timer{" "}
            {Math.floor(session.timeLimitSec / 60)} menit · Auto-submit kalau
            waktu habis. Fokus ya 💪
          </p>
        </header>
      </Reveal>
      <Reveal delay={80}>
        <QuizPlayer initialSession={session} />
      </Reveal>
    </div>
  );
}
