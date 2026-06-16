import { ArrowLeft, Clock, Sparkles, Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { QuizResultView } from "@/components/student/quiz-result-view";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Hasil quiz — Spark Ai",
  description: "Breakdown nilai per konsep.",
};

type Breakdown = {
  conceptId: string;
  conceptName: string;
  correct: number;
  wrong: number;
  total: number;
  status: "MASTERED" | "LEARNING" | "STRUGGLING" | "NOT_STARTED";
};

function parseBreakdown(raw: string | undefined): Breakdown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Breakdown[];
  } catch {
    // ignore
  }
  return [];
}

export default async function QuizResultPage({
  searchParams,
}: {
  searchParams: Promise<{
    sessionId?: string;
    total?: string;
    correct?: string;
    pct?: string;
    time?: string;
    topic?: string;
    subject?: string;
    breakdown?: string;
    timedOut?: string;
    topicId?: string;
  }>;
}) {
  const sp = await searchParams;
  const total = Number.parseInt(sp.total ?? "0", 10) || 0;
  const correct = Number.parseInt(sp.correct ?? "0", 10) || 0;
  const pct = Number.parseInt(sp.pct ?? "0", 10) || 0;
  const timeSec = Number.parseInt(sp.time ?? "0", 10) || 0;
  const topicName = sp.topic ?? "Topik";
  const subjectName = sp.subject ?? "";
  const timedOut = sp.timedOut === "1";
  const breakdown = parseBreakdown(sp.breakdown);

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                <Sparkles size={10} strokeWidth={2.5} />
                Hasil quiz
              </span>
              <h1 className="mt-2 font-heading text-[20px] font-bold leading-tight">
                {topicName}{" "}
                <span className="text-muted-foreground">· {subjectName}</span>
              </h1>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/practice">
                <ArrowLeft size={13} />
                Latihan
              </Link>
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
            <Clock size={12} />
            <span>
              {total} soal · {timeSec}s
            </span>
            {timedOut && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                <Timer size={10} className="mr-1 inline" />
                Auto-submit
              </span>
            )}
          </div>
        </header>
      </Reveal>
      <Reveal delay={80}>
        <QuizResultView
          topicId={sp.topicId ?? ""}
          topicName={topicName}
          subjectName={subjectName}
          total={total}
          correct={correct}
          pct={pct}
          timeSec={timeSec}
          breakdown={breakdown}
          timedOut={timedOut}
        />
      </Reveal>
    </div>
  );
}
