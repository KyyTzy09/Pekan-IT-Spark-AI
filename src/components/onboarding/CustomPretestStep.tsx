import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type CustomQuestion = {
  topicIndex: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
};

export function CustomPretestStep({
  questions,
  answers,
  onAnswer,
  subjectName,
}: {
  questions: CustomQuestion[];
  answers: Record<number, string>;
  onAnswer: (qIndex: number, letter: string) => void;
  subjectName: string;
}) {
  const answered = Object.keys(answers).length;
  const progress =
    questions.length > 0 ? (answered / questions.length) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar - game-like */}
      <div className="rounded-2xl border border-[var(--purple)]/25 bg-gradient-to-br from-[var(--purple)]/5 to-[var(--pink)]/3 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
              <Sparkles size={14} strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-heading text-[13px] font-bold text-foreground">
                {questions.length} soal AI — {subjectName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Dibuat khusus buat kamu oleh Spark AI ✨
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-[16px] font-bold text-[var(--purple)]">
              {answered}
              <span className="text-[10px] text-muted-foreground">
                /{questions.length}
              </span>
            </p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--pink)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => {
        const opts = q.options ?? [];
        const isAnswered = Boolean(answers[qi]);
        return (
          <div
            key={qi}
            className={cn(
              "rounded-2xl border p-4 transition-all duration-300",
              isAnswered
                ? "border-[var(--purple)]/30 bg-[var(--purple)]/5"
                : "border-border/40 bg-card/60",
            )}
          >
            {/* Question header */}
            <div className="flex items-start gap-2 mb-3">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white",
                  isAnswered
                    ? "bg-[var(--purple)]"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {qi + 1}
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold leading-snug text-foreground">
                  {q.questionText}
                </p>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider",
                    q.difficulty === "EASY"
                      ? "bg-[var(--teal)]/10 text-[var(--teal)]"
                      : q.difficulty === "MEDIUM"
                        ? "bg-[var(--yellow)]/10 text-[var(--yellow)]"
                        : "bg-[var(--coral)]/10 text-[var(--coral)]",
                  )}
                >
                  {q.difficulty}
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="grid gap-1.5">
              {opts.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const active = answers[qi] === letter;
                return (
                  <button
                    key={`${qi}-${letter}`}
                    type="button"
                    onClick={() => onAnswer(qi, letter)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[12px] transition-all duration-200 active:scale-[0.98]",
                      active
                        ? "border-[var(--purple)]/50 bg-gradient-to-r from-[var(--purple)]/8 to-[var(--pink)]/5 shadow-[0_4px_12px_rgba(139,92,246,0.1)] ring-1 ring-[var(--purple)]/30"
                        : "border-border/40 bg-background/30 hover:border-border/60 hover:bg-card/60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold transition-all",
                        active
                          ? "bg-[var(--purple)] text-white shadow-[0_2px_6px_rgba(139,92,246,0.3)]"
                          : "bg-muted text-muted-foreground/80",
                      )}
                    >
                      {active ? "✓" : letter}
                    </span>
                    <span className="flex-1 leading-snug text-foreground/90">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
