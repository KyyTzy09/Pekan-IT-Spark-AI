"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ListChecks,
  RefreshCcw,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Breakdown = {
  conceptId: string;
  conceptName: string;
  correct: number;
  wrong: number;
  total: number;
  status: "MASTERED" | "LEARNING" | "STRUGGLING" | "NOT_STARTED";
};

const STATUS_LABEL: Record<Breakdown["status"], string> = {
  MASTERED: "Mastered",
  LEARNING: "Dipelajari",
  STRUGGLING: "Butuh bantuan",
  NOT_STARTED: "Belum mulai",
};

const STATUS_CHIP: Record<Breakdown["status"], string> = {
  MASTERED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  LEARNING: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  STRUGGLING:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  NOT_STARTED:
    "bg-slate-200 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function QuizResultView({
  topicId,
  topicName,
  subjectName,
  total,
  correct,
  pct,
  timeSec,
  breakdown,
  timedOut,
}: {
  topicId: string;
  topicName: string;
  subjectName: string;
  total: number;
  correct: number;
  pct: number;
  timeSec: number;
  breakdown: Breakdown[];
  timedOut: boolean;
}) {
  const router = useRouter();
  const wrong = total - correct;
  const passed = pct >= 70;

  return (
    <div className="space-y-5 sm:space-y-7">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7"
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-20 -top-20 size-60 rounded-full opacity-30 blur-3xl",
          )}
          style={{
            background: passed
              ? "radial-gradient(circle, oklch(0.78 0.18 145 / 0.5), transparent 70%)"
              : "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
          }}
        />
        <div className="relative grid gap-4 sm:grid-cols-[auto,1fr] sm:items-center sm:gap-6">
          <ScoreRing pct={pct} passed={passed} />
          <div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                passed
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
              )}
            >
              {passed ? "Lulus" : "Belum lulus"} · {pct}%
            </span>
            <h1 className="mt-2 font-heading text-[24px] font-bold leading-tight sm:text-[28px]">
              {topicName}{" "}
              <span className="text-muted-foreground">· {subjectName}</span>
            </h1>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
              {timedOut
                ? "Waktu habis — quiz ke-auto submit. Yuk review konsep yang masih lemah di bawah."
                : passed
                  ? "Mantap! Konsep udah dikuasai. Lanjut topik berikutnya atau push lebih susah dengan quiz baru."
                  : "Beberapa konsep masih perlu diulang. Cek breakdown di bawah, terus remedial via Tanya Spark."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/60 px-3 py-1.5 text-[12px] font-bold">
                <CheckCircle2 size={12} className="text-emerald-600" />
                {correct} benar
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/60 px-3 py-1.5 text-[12px] font-bold">
                <XCircle size={12} className="text-rose-600" />
                {wrong} salah
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-background/60 px-3 py-1.5 text-[12px] font-bold tabular-nums">
                <Clock size={12} className="text-muted-foreground" />
                {formatTime(timeSec)}
              </div>
            </div>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Button
            onClick={() => router.push(`/practice/quiz/${topicId}`)}
            className="rounded-full bg-[var(--coral)] px-5 text-white shadow-[0_8px_22px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90"
          >
            <RefreshCcw size={14} className="mr-1.5" />
            Quiz ulang
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={`/practice?topicId=${topicId}`}>
              <TrendingUp size={13} />
              Latihan topik
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href="/practice">
              <Target size={13} />
              Latihan umum
            </Link>
          </Button>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7"
      >
        <header className="mb-3 flex items-center gap-2">
          <ListChecks size={14} className="text-[var(--teal)]" />
          <h2 className="font-heading text-[16px] font-bold">
            Breakdown per konsep
          </h2>
        </header>
        {breakdown.length === 0 ? (
          <p className="text-[12.5px] text-muted-foreground">
            Belum ada breakdown. Coba quiz ulang.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {breakdown.map((b) => {
              const acc =
                b.total === 0 ? 0 : Math.round((b.correct / b.total) * 100);
              return (
                <li
                  key={b.conceptId}
                  className="rounded-2xl border border-border/40 bg-background/60 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="flex-1 text-[13.5px] font-bold">
                      {b.conceptName}
                    </h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest",
                        STATUS_CHIP[b.status],
                      )}
                    >
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                    <span>
                      {b.correct}/{b.total} benar · {acc}%
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className={cn(
                          "h-full transition-all",
                          acc === 100
                            ? "bg-emerald-500"
                            : acc >= 70
                              ? "bg-blue-500"
                              : acc >= 40
                                ? "bg-amber-500"
                                : "bg-rose-500",
                        )}
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                  {b.wrong > 0 && (
                    <div className="mt-2">
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-7 rounded-full px-2.5 text-[11px]"
                      >
                        <Link
                          href={`/chat?rem=${encodeURIComponent(b.conceptName)}`}
                        >
                          <Sparkles size={11} className="mr-1" />
                          Diskusiin "{b.conceptName}" sama Spark
                          <ArrowRight size={11} className="ml-1" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </motion.section>
    </div>
  );
}

function ScoreRing({ pct, passed }: { pct: number; passed: boolean }) {
  return (
    <div className="relative grid h-28 w-28 shrink-0 place-items-center sm:h-32 sm:w-32">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="var(--border)"
          strokeWidth="8"
          fill="none"
          opacity="0.4"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          stroke={passed ? "var(--green)" : "var(--coral)"}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: "0 276" }}
          animate={{ strokeDasharray: `${(pct / 100) * 276} 276` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center">
        <p className="font-heading text-[28px] font-bold leading-none sm:text-[32px]">
          {pct}
          <span className="text-[14px] font-medium text-muted-foreground">
            %
          </span>
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {passed ? "Pass" : "Remedial"}
        </p>
      </div>
    </div>
  );
}
