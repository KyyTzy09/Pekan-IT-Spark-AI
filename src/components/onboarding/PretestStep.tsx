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
    <div className="space-y-4">
      {/* Progress bar - game-like */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)]">
              <Trophy size={14} strokeWidth={2.5} />
            </span>
            <div>
              <p className="font-heading text-[13px] font-bold text-foreground">
                {questions.length} soal
              </p>
              <p className="text-[10px] text-muted-foreground">
                Jawab sebisanya, ga wajib semua
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-[16px] font-bold text-[var(--teal)]">
              {answered}
              <span className="text-[10px] text-muted-foreground">
                /{questions.length}
              </span>
            </p>
          </div>
        </div>
        {/* Progress track */}
        <div className="h-2 overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--teal)] to-[var(--blue)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      {questions.map((q, qi) => {
        const opts = q.options ?? [];
        const isAnswered = Boolean(answers[q.id]);
        return (
          <div
            key={q.id}
            className={cn(
              "rounded-2xl border p-4 transition-all duration-300",
              isAnswered
                ? "border-[var(--teal)]/30 bg-[var(--teal)]/5"
                : "border-border/40 bg-card/60",
            )}
          >
            {/* Question header */}
            <div className="flex items-start gap-2 mb-3">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white",
                  isAnswered
                    ? "bg-[var(--teal)]"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {qi + 1}
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold leading-snug text-foreground">
                  {q.questionText}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {q.subjectName} · {q.conceptName}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="grid gap-1.5">
              {opts.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const active = answers[q.id] === letter;
                return (
                  <button
                    key={`${q.id}-${letter}`}
                    type="button"
                    onClick={() => onAnswer(q.id, letter)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[12px] transition-all duration-200 active:scale-[0.98]",
                      active
                        ? "border-[var(--coral)]/50 bg-gradient-to-r from-[var(--coral)]/8 to-[var(--orange)]/5 shadow-[0_4px_12px_rgba(225,29,72,0.1)] ring-1 ring-[var(--coral)]/30"
                        : "border-border/40 bg-background/30 hover:border-border/60 hover:bg-card/60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold transition-all",
                        active
                          ? "bg-[var(--coral)] text-white shadow-[0_2px_6px_rgba(225,29,72,0.3)]"
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

function PretestEmptyState({ selectedCount }: { selectedCount: number }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.82 0.15 25 / 0.4), transparent 70%)",
        }}
      />
      <span className="relative mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white shadow-[0_8px_20px_rgba(20,184,166,0.35)]">
        {selectedCount === 0 ? (
          <BookOpen size={22} strokeWidth={2.5} />
        ) : (
          <CircleDashed size={22} strokeWidth={2.5} />
        )}
      </span>
      <p className="font-heading text-[15px] font-bold text-foreground">
        {selectedCount === 0
          ? "Pilih mapel dulu, yuk"
          : "Belum ada soal pretest"}
      </p>
      <p className="mx-auto mt-1.5 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
        {selectedCount === 0
          ? "Balik ke step sebelumnya dan pilih minimal 1 mapel fokus."
          : "Mapel yang kamu pilih belum punya bank soal. Langsung lanjut aja — Spark bakal nyesuaiin dari aktivitas berikutnya."}
      </p>
    </div>
  );
}
