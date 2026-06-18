import { CircleDashed, Sparkles } from "lucide-react";
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--purple)]/25 bg-[var(--purple)]/8 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white">
            <Sparkles size={13} strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-heading text-[12.5px] font-bold text-foreground">
              {questions.length} soal pretest — {subjectName}
            </p>
            <p className="text-[10.5px] text-muted-foreground">
              Soal ini dibuat khusus buat kamu oleh Spark AI ✨
            </p>
          </div>
        </div>
        <span className="rounded-full bg-background/60 px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--purple)]">
          {answered}/{questions.length}
        </span>
      </div>

      {questions.map((q, qi) => {
        const opts = q.options ?? [];
        return (
          <div
            key={qi}
            className="rounded-2xl border border-border/40 bg-card/60 p-3.5"
          >
            <div className="flex items-start gap-2.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-[10px] font-bold text-white">
                {qi + 1}
              </span>
              <div className="flex-1">
                <p className="text-[12.5px] font-semibold leading-snug text-foreground">
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

            <div className="mt-2.5 grid gap-1.5">
              {opts.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const active = answers[qi] === letter;
                return (
                  <button
                    key={`${qi}-${letter}`}
                    type="button"
                    onClick={() => onAnswer(qi, letter)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors",
                      active
                        ? "border-[var(--coral)]/50 bg-[var(--coral)]/8"
                        : "border-border/40 bg-background/30 hover:border-border/70",
                    )}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold transition-colors"
                      style={
                        active
                          ? {
                              background: "var(--coral)",
                              color: "white",
                            }
                          : undefined
                      }
                    >
                      {active ? (
                        <svg
                          width={10}
                          height={10}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        letter
                      )}
                    </span>
                    <span className="flex-1 leading-snug">{opt}</span>
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
