import { ArrowLeft, Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/shared/reveal";
import { QuizPlayer } from "@/components/student/quiz-player";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startQuizSession } from "@/server/actions/practice";

export const metadata: Metadata = {
  title: "Quiz adaptif — Spark Ai",
  description: "Mini-exam dengan timer & auto-submit.",
};

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicId: string }>;
  searchParams: Promise<{ n?: string; time?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    notFound();
  }

  const { topicId } = await params;
  const { n, time } = await searchParams;
  const numQ = n === "8" ? 8 : n === "10" ? 10 : 5;
  const timeLimitSec = time
    ? Number.parseInt(time, 10) || undefined
    : undefined;

  const topic = await prisma.topic.findFirst({
    where: { id: topicId },
    select: {
      id: true,
      name: true,
      subject: { select: { name: true, slug: true } },
    },
  });
  if (!topic) notFound();

  const result = await startQuizSession({
    topicId,
    numQuestions: numQ,
    timeLimitSec,
  });

  if (!result.ok) {
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
              {result.error}
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

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Quiz mini-exam · {topic.subject.name}
              </p>
              <h1 className="mt-1 font-heading text-[20px] font-bold leading-tight">
                {topic.name}
              </h1>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href={`/topics/${topic.id}`}>
                <ArrowLeft size={13} />
                Topik
              </Link>
            </Button>
          </div>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            {result.session.totalQuestions} soal · Timer{" "}
            {Math.floor(result.session.timeLimitSec / 60)} menit · Auto-submit
            kalau waktu habis. Fokus ya 💪
          </p>
        </header>
      </Reveal>
      <Reveal delay={80}>
        <QuizPlayer initialSession={result.session} />
      </Reveal>
    </div>
  );
}
