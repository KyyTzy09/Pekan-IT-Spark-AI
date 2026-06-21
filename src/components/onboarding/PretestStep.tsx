import { BookOpen, CircleDashed, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

type PretestQuestion = {
  id: string;
  questionText: string;
  options: string[] | null;
  conceptId: string;
  conceptName: string;
  subjectId: string;
  subjectName: string;
};

export function PretestStep({
  questions,
  answers,
  onAnswer,
  selectedCount,
}: {
  questions: PretestQuestion[];
  answers: Record<string, string>;
  onAnswer: (qid: string, letter: string) => void;
  selectedCount: number;
}) {
  if (questions.length === 0) {
    return <PretestEmptyState selectedCount={selectedCount} />;
  }

  const answered = questions.filter((q) => Boolean(answers[q.id])).length;
  const progress =
    questions.length > 0 ? (answered / questions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="rounded-xl border border-border/60 bg-card/80 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)]">
              <Trophy size={18} strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-heading text-[15px] font-bold text-foreground">
                {questions.length} soal pretest
              </p>
              <p className="text-[11px] text-muted-foreground">
                Jawab sebisanya, ga wajib semua
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-[20px] font-bold text-[var(--teal)]">
              {answered}
              <span className="text-[12px] text-muted-foreground">
                /{questions.length}
              </span>
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2 overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => {
          const opts = q.options ?? [];
          const isAnswered = Boolean(answers[q.id]);
          return (
            <div
              key={q.id}
              className={cn(
                "rounded-xl border-2 p-5 transition-all duration-200",
                isAnswered
                  ? "border-[var(--teal)]/40 bg-[var(--teal)]/5"
                  : "border-border/60 bg-card/80",
              )}
            >
              {/* Question header */}
              <div className="mb-4 flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg text-[12px] font-bold text-white",
                    isAnswered
                      ? "bg-gradient-to-br from-[var(--teal)] to-[var(--blue)]"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {qi + 1}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold leading-snug text-foreground">
                    {q.questionText}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {q.subjectName} · {q.conceptName}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {opts.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const active = answers[q.id] === letter;
                  return (
                    <button
                      key={`${q.id}-${letter}`}
                      type="button"
                      onClick={() => onAnswer(q.id, letter)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 active:scale-[0.98]",
                        active
                          ? "border-[var(--coral)] bg-[var(--coral)]/8 shadow-[0_4px_12px_rgba(225,29,72,0.1)] ring-4 ring-[var(--coral)]/10"
                          : "border-border/60 bg-card/50 hover:border-border hover:bg-card",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-md text-[12px] font-bold transition-all",
                          active
                            ? "bg-[var(--coral)] text-white shadow-[0_2px_6px_rgba(225,29,72,0.3)]"
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

function PretestEmptyState({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card/80 p-8 text-center">
      <span className="mb-4 grid size-16 place-items-center rounded-xl bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white shadow-[0_8px_24px_rgba(20,184,166,0.3)]">
        {selectedCount === 0 ? (
          <BookOpen size={28} strokeWidth={2.5} />
        ) : (
          <CircleDashed size={28} strokeWidth={2.5} />
        )}
      </span>
      <p className="font-heading text-[17px] font-bold text-foreground">
        {selectedCount === 0
          ? "Pilih mapel dulu, yuk"
          : "Belum ada soal pretest"}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        {selectedCount === 0
          ? "Balik ke step sebelumnya dan pilih minimal 1 mapel fokus."
          : "Mapel yang kamu pilih belum punya bank soal. Langsung lanjut aja — Spark bakal nyesuaiin dari aktivitas berikutnya."}
      </p>
    </div>
  );
}
