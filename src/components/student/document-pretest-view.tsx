"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PretestQuestion = {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  conceptName: string;
};

export function DocumentPretestView({
  questions,
  onSubmit,
}: {
  questions: PretestQuestion[];
  onSubmit: (
    answers: Array<{
      questionIndex: number;
      answer: string;
      isCorrect: boolean;
      conceptName: string;
    }>,
  ) => Promise<void>;
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [result, setResult] = React.useState<{
    total: number;
    correct: number;
  } | null>(null);

  const current = questions[currentIndex];
  const selectedAnswer = answers[currentIndex];

  const handleSelect = (option: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentIndex]: option }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    const submittedAnswers = Object.entries(answers).map(([idx, answer]) => {
      const q = questions[Number(idx)];
      return {
        questionIndex: Number(idx),
        answer,
        isCorrect: answer === q.correctAnswer,
        conceptName: q.conceptName,
      };
    });

    const correct = submittedAnswers.filter((a) => a.isCorrect).length;
    setResult({ total: questions.length, correct });
    setSubmitted(true);
    await onSubmit(submittedAnswers);
  };

  if (result) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/80 p-6 text-center">
        <CheckCircle2 size={32} className="mx-auto text-[var(--teal)]" />
        <h3 className="mt-3 font-heading text-[18px] font-bold">
          Pretest Selesai!
        </h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {result.correct} dari {result.total} benar (
          {Math.round((result.correct / result.total) * 100)}%)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
        <span>
          Soal {currentIndex + 1} / {questions.length}
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
            current.difficulty === "EASY" && "bg-emerald-100 text-emerald-700",
            current.difficulty === "MEDIUM" && "bg-amber-100 text-amber-700",
            current.difficulty === "HARD" && "bg-rose-100 text-rose-700",
          )}
        >
          {current.difficulty}
        </span>
      </div>

      <p className="text-[13px] font-medium text-foreground">
        {current.questionText}
      </p>

      <div className="space-y-2">
        {current.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleSelect(option)}
            className={cn(
              "w-full rounded-xl border p-3 text-left text-[12px] font-medium transition-all",
              selectedAnswer === option
                ? "border-[var(--purple)]/40 bg-[var(--purple)]/8"
                : "border-border/30 hover:border-border/60",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      {submitted && selectedAnswer && (
        <div
          className={cn(
            "rounded-xl border p-3 text-[11px]",
            selectedAnswer === current.correctAnswer
              ? "border-[var(--teal)]/30 bg-[var(--teal)]/5 text-[var(--teal)]"
              : "border-destructive/30 bg-destructive/5 text-destructive",
          )}
        >
          {selectedAnswer === current.correctAnswer ? "Benar!" : "Salah"}
          <p className="mt-1 text-muted-foreground">{current.explanation}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="rounded-xl"
        >
          Sebelumnya
        </Button>
        {currentIndex === questions.length - 1 ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="rounded-xl bg-[var(--purple)] text-white"
          >
            Selesai
            <ArrowRight size={12} />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="rounded-xl"
          >
            Selanjutnya
            <ArrowRight size={12} />
          </Button>
        )}
      </div>
    </div>
  );
}
