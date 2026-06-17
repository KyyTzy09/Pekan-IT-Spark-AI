"use client";

import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DocumentMarkdownText } from "@/components/shared/document-markdown";
import { Reveal } from "@/components/shared/reveal";
import { useBadgeCelebration } from "@/components/student/badge-unlock-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  appendQuestionsToDocumentQuizAction,
  submitDocumentQuizAttemptAction,
} from "@/server/actions/documents";

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
  explanation: string;
};

type Attempt = {
  answers: number[];
  score: number;
  completedAt: string;
};

type Quiz = {
  id: string;
  title: string;
  questions: Question[];
  attempts: Attempt[];
};

export function UploadQuizPlayerView({
  document,
  quiz: initialQuiz,
}: {
  document: { id: string; originalName: string };
  quiz: Quiz;
}) {
  const router = useRouter();
  const { showBadges } = useBadgeCelebration();
  const [quiz, setQuiz] = React.useState<Quiz>(initialQuiz);
  const [selectedAnswers, setSelectedAnswers] = React.useState<
    Record<number, number>
  >({});
  const [showExplanations, setShowExplanations] = React.useState<
    Record<number, boolean>
  >({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [isAppending, setIsAppending] = React.useState(false);
  const [appendCount, setAppendCount] = React.useState(5);
  const [error, setError] = React.useState<string | null>(null);

  const handleSelectOption = (qi: number, oi: number) => {
    if (selectedAnswers[qi] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [qi]: oi }));
  };

  const handleToggleExplanation = (qi: number) => {
    setShowExplanations((prev) => ({ ...prev, [qi]: !prev[qi] }));
  };

  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered =
    totalQuestions > 0 && answeredCount === totalQuestions;
  const correctCount = quiz.questions.filter(
    (q, idx) => selectedAnswers[idx] === q.correctIndex,
  ).length;
  const calculatedScore =
    totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

  const handleSave = async () => {
    if (isSubmitting || hasSubmitted) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const answers = quiz.questions.map(
        (_, idx) => selectedAnswers[idx] ?? -1,
      );
      const res = await submitDocumentQuizAttemptAction(
        quiz.id,
        answers,
        calculatedScore,
      );
      if (!res.ok) {
        setError(res.error);
      } else {
        setQuiz((prev) => ({ ...prev, attempts: res.attempts }));
        setHasSubmitted(true);
        if (res.unlockedBadges?.length) {
          showBadges(res.unlockedBadges);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setShowExplanations({});
    setHasSubmitted(false);
  };

  const handleAppend = async (count: number) => {
    setIsAppending(true);
    setError(null);
    try {
      const res = await appendQuestionsToDocumentQuizAction(quiz.id, count);
      if (!res.ok) {
        setError(res.error);
      } else {
        setQuiz(res.quiz);
        setSelectedAnswers({});
        setShowExplanations({});
        setHasSubmitted(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal.");
    } finally {
      setIsAppending(false);
    }
  };

  const bestScore =
    quiz.attempts.length > 0
      ? Math.max(...quiz.attempts.map((a) => a.score))
      : null;

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.15 175 / 0.5), transparent 70%)",
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
              <span className="text-foreground">Latihan</span>
            </nav>
            <div className="flex items-start gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--coral)]/10 text-[var(--coral)]">
                <GraduationCap size={18} />
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                  <GraduationCap size={10} strokeWidth={2.5} />
                  Latihan Interaktif
                </span>
                <h1 className="mt-1 font-heading text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
                  {document.originalName}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                  <span>{quiz.questions.length} Soal Pilihan Ganda</span>
                  {quiz.attempts.length > 0 && (
                    <>
                      <span className="inline-block size-1 rounded-full bg-border" />
                      <span>
                        Riwayat: {quiz.attempts.length}x dikerjakan
                      </span>
                      <span className="inline-block size-1 rounded-full bg-border" />
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        Nilai tertinggi: {bestScore}/100
                      </span>
                    </>
                  )}
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

      <Reveal delay={60}>
        <div className="space-y-6">
          <ol className="space-y-5">
            {quiz.questions.map((q, i) => {
              const selected = selectedAnswers[i];
              const isAnswered = selected !== undefined;
              const isCorrect =
                isAnswered && selected === q.correctIndex;
              const explanationOpen = showExplanations[i] || false;

              return (
                <li
                  key={`${i}-${q.question.slice(0, 15)}`}
                  className="rounded-2xl border border-border/40 bg-card/85 p-5 shadow-[0_6px_18px_rgba(80,20,50,0.05)] backdrop-blur-md"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--coral)]/15 text-[11.5px] font-bold text-[var(--coral)]">
                      {i + 1}
                    </span>
                    <div className="flex-1 text-[13.5px] font-semibold leading-snug text-foreground">
                      <DocumentMarkdownText text={q.question} />
                    </div>
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 self-start">
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 pl-9">
                    {q.options.map((opt, j) => {
                      const isSelectedOpt = selected === j;
                      const isCorrectOpt = q.correctIndex === j;
                      let btnStyle =
                        "border-border/60 bg-card hover:bg-accent/40 text-foreground/80";
                      if (isAnswered) {
                        if (isSelectedOpt) {
                          btnStyle = isCorrect
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                            : "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium";
                        } else if (isCorrectOpt) {
                          btnStyle =
                            "border-emerald-500/50 bg-emerald-500/5 text-emerald-800/80 dark:text-emerald-400/80 font-medium";
                        } else {
                          btnStyle =
                            "border-border/30 bg-muted/20 text-muted-foreground/60 opacity-60";
                        }
                      }
                      return (
                        <button
                          key={`${i}-${j}-${opt.slice(0, 10)}`}
                          type="button"
                          onClick={() => handleSelectOption(i, j)}
                          disabled={isAnswered}
                          className={cn(
                            "flex items-center justify-between text-left rounded-xl border px-3.5 py-2 text-[12.5px] transition-all",
                            btnStyle,
                          )}
                        >
                          <span>
                            <span className="mr-2 font-bold opacity-60">
                              {String.fromCharCode(65 + j)}.
                            </span>
                            {opt}
                          </span>
                          {isAnswered && isCorrectOpt && (
                            <CheckCircle2
                              size={12}
                              className="text-emerald-600 shrink-0 ml-2"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isAnswered && (
                    <div className="mt-3 pl-9">
                      <button
                        type="button"
                        onClick={() => handleToggleExplanation(i)}
                        className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--teal)] hover:underline"
                      >
                        <span>
                          💡{" "}
                          {isCorrect
                            ? "Lihat penjelasan"
                            : explanationOpen
                              ? "Sembunyikan penjelasan"
                              : "Jelaskan kenapa ini salah"}
                        </span>
                      </button>

                      {explanationOpen && (
                        <div className="mt-3 rounded-xl border border-teal-200/50 bg-teal-50/20 p-3.5 text-[12.5px] text-foreground/90 dark:border-teal-500/10 dark:bg-teal-500/5">
                          <div className="flex items-center gap-1.5 font-bold text-[var(--teal)] mb-2">
                            <CircleHelp size={13} />
                            <span>Penjelasan Spark:</span>
                          </div>
                          <DocumentMarkdownText text={q.explanation} />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {isAllAnswered && (
            <div className="rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-5 dark:border-teal-500/15 dark:from-teal-500/5 dark:to-emerald-500/5 space-y-4">
              <div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  Hasil Latihan Kamu
                </h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Kamu menjawab benar <strong>{correctCount}</strong> dari{" "}
                  <strong>{totalQuestions}</strong> soal.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-3xl font-extrabold text-[var(--teal)]">
                  {calculatedScore}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    / 100
                  </span>
                </div>
                {!hasSubmitted ? (
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    size="sm"
                    className="rounded-full bg-[var(--teal)] text-white hover:bg-[var(--teal)]/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          size={13}
                          className="mr-1.5 animate-spin"
                        />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Riwayat Nilai"
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={14} />
                    Nilai Tersimpan!
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  size="sm"
                  className="rounded-full text-[12px]"
                >
                  Coba Lagi
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-muted/40 p-4 border border-border/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-foreground">
                  Kurang puas dengan soal yang ada?
                </h4>
                <p className="text-[11.5px] text-muted-foreground">
                  Tambahkan soal baru secara dinamis untuk memperbanyak
                  variasi soal latihanmu.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={appendCount}
                  onChange={(e) => setAppendCount(Number(e.target.value))}
                  disabled={isAppending}
                  className="rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                >
                  <option value={3}>+3 Soal</option>
                  <option value={5}>+5 Soal</option>
                  <option value={7}>+7 Soal</option>
                  <option value={10}>+10 Soal</option>
                </select>
                <Button
                  onClick={() => handleAppend(appendCount)}
                  disabled={isAppending}
                  size="sm"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium text-[12px]"
                >
                  {isAppending ? (
                    <>
                      <Loader2 size={12} className="mr-1.5 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    "Tambah Soal"
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={`/upload/${document.id}?tab=quizzes`}>
                Kembali ke daftar latihan
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}