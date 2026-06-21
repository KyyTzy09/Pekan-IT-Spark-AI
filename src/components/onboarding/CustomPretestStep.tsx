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
    <div className="space-y-6">
      {/* Progress header */}
      <div className="rounded-xl border border-[var(--purple)]/30 bg-gradient-to-br from-[var(--purple)]/5 to-[var(--pink)]/5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
              <Sparkles size={18} strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-heading text-[15px] font-bold text-foreground">
                {questions.length} soal AI — {subjectName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Dibuat khusus buat kamu oleh Spark AI ✨
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-[20px] font-bold text-[var(--purple)]">
              {answered}
              <span className="text-[12px] text-muted-foreground">
                /{questions.length}
              </span>
            </p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--purple)] to-[var(--pink)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => {
          const opts = q.options ?? [];
          const isAnswered = Boolean(answers[qi]);
          return (
            <div
              key={qi}
              className={cn(
                "rounded-xl border-2 p-5 transition-all duration-200",
                isAnswered
                  ? "border-[var(--purple)]/40 bg-[var(--purple)]/5"
                  : "border-border/60 bg-card/80",
              )}
            >
              {/* Question header */}
              <div className="mb-4 flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg text-[12px] font-bold text-white",
                    isAnswered
                      ? "bg-gradient-to-br from-[var(--purple)] to-[var(--pink)]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {qi + 1}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold leading-snug text-foreground">
                    {q.questionText}
                  </p>
                  <span
                    className={cn(
                      "mt-1.5 inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      q.difficulty === "EASY"
                        ? "bg-[var(--teal)]/15 text-[var(--teal)]"
                        : q.difficulty === "MEDIUM"
                          ? "bg-[var(--yellow)]/15 text-[var(--yellow)]"
                          : "bg-[var(--coral)]/15 text-[var(--coral)]",
                    )}
                  >
                    {q.difficulty}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {opts.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const active = answers[qi] === letter;
                  return (
                    <button
                      key={`${qi}-${letter}`}
                      type="button"
                      onClick={() => onAnswer(qi, letter)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 active:scale-[0.98]",
                        active
                          ? "border-[var(--purple)] bg-[var(--purple)]/8 shadow-[0_4px_12px_rgba(139,92,246,0.1)] ring-4 ring-[var(--purple)]/10"
                          : "border-border/60 bg-card/50 hover:border-border hover:bg-card",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-md text-[12px] font-bold transition-all",
                          active
                            ? "bg-[var(--purple)] text-white shadow-[0_2px_6px_rgba(139,92,246,0.3)]"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {active ? "✓" : letter}
                      </span>
                      <span className="flex-1 text-[13px] leading-snug text-foreground">
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
    </div>
  );
}
