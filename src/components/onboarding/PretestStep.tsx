import { BookOpen, CircleDashed } from "lucide-react";
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

  const grouped = questions.reduce<Record<string, PretestQuestion[]>>(
    (acc, q) => {
      if (!acc[q.subjectName]) acc[q.subjectName] = [];
      acc[q.subjectName]?.push(q);
      return acc;
    },
    {},
  );

  const answered = questions.filter((q) => Boolean(answers[q.id])).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--teal)]/25 bg-[var(--teal)]/8 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white">
            <CircleDashed size={13} strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-heading text-[12.5px] font-bold text-foreground">
              {questions.length} soal dari {Object.keys(grouped).length} mapel
            </p>
            <p className="text-[10.5px] text-muted-foreground">
              Jawaban kamu ngebantu Spark ngerti level awalmu
            </p>
          </div>
        </div>
        <span className="rounded-full bg-background/60 px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--teal)]">
          {answered}/{questions.length}
        </span>
      </div>

      {Object.entries(grouped).map(([subject, qs], gi) => (
        <div key={subject} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-[10px] font-bold text-white">
              {gi + 1}
            </span>
            <h3 className="font-heading text-[13px] font-bold text-foreground">
              {subject}
            </h3>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {qs.length} soal
            </span>
          </div>
          {qs.map((q) => {
            const opts = q.options ?? [];
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-border/40 bg-card/60 p-3.5"
              >
                <p className="text-[12.5px] font-semibold leading-snug text-foreground">
                  {q.questionText}
                </p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  {q.conceptName}
                </p>
                <div className="mt-2.5 grid gap-1.5">
                  {opts.map((opt, i) => {
                    const letter = String.fromCharCode(65 + i);
                    const active = answers[q.id] === letter;
                    return (
                      <button
                        key={`${q.id}-${letter}`}
                        type="button"
                        onClick={() => onAnswer(q.id, letter)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors",
                          active
                            ? "border-[var(--coral)]/50 bg-[var(--coral)]/8"
                            : "border-border/40 bg-background/30 hover:border-border/70",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-md text-[10px] font-bold transition-colors",
                            active
                              ? "bg-[var(--coral)] text-white"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {active ? (
                            <Check size={10} strokeWidth={3} />
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
      ))}
    </div>
  );
}

function PretestEmptyState({ selectedCount }: { selectedCount: number }) {
  if (selectedCount === 0) {
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
          <BookOpen size={22} strokeWidth={2.5} />
        </span>
        <p className="font-heading text-[15px] font-bold text-foreground">
          Pilih mapel dulu, yuk
        </p>
        <p className="mx-auto mt-1.5 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
          Balik ke step sebelumnya dan pilih minimal 1 mapel fokus. Nanti soal
          pretest-nya muncul sesuai mapel yang kamu pilih.
        </p>
      </div>
    );
  }

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
        <CircleDashed size={22} strokeWidth={2.5} />
      </span>
      <p className="font-heading text-[15px] font-bold text-foreground">
        Belum ada soal pretest
      </p>
      <p className="mx-auto mt-1.5 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
        Mapel yang kamu pilih belum punya bank soal. Bisa langsung lanjut —
        Spark bakal nyesuaiin level dari aktivitas kamu berikutnya.
      </p>
    </div>
  );
}

function Check({ size = 10, strokeWidth = 3 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
