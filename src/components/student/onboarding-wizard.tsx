"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BellOff,
  BookOpen,
  Check,
  ChevronRight,
  CircleDashed,
  Heart,
  Loader2,
  MessageSquareQuote,
  School,
  Sparkles,
  Sprout,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { SparkCharacter } from "@/components/student/spark-character";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type CompleteOnboardingResult,
  completeOnboarding,
} from "@/server/actions/complete-onboarding";

type Subject = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

type PretestQuestion = {
  id: string;
  questionText: string;
  options: string[] | null;
  conceptId: string;
  conceptName: string;
  subjectName: string;
};

type EducationLevel = "SMA" | "SMK";
type LearningStyle = "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC";

const STEPS = [
  { key: "welcome", label: "Welcome" },
  { key: "profile", label: "Profil" },
  { key: "subjects", label: "Mapel" },
  { key: "style", label: "Gaya" },
  { key: "pretest", label: "Pretest" },
] as const;

const LEARNING_STYLES: Array<{
  value: LearningStyle;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  accent: string;
}> = [
  {
    value: "VISUAL",
    label: "Visual",
    description: "Gambar & diagram",
    icon: Sparkles,
    accent: "from-[var(--coral)] to-[var(--orange)]",
  },
  {
    value: "TEXTUAL",
    label: "Teks",
    description: "Bacaan tertulis",
    icon: BookOpen,
    accent: "from-[var(--blue)] to-[var(--teal)]",
  },
  {
    value: "EXAMPLE_HEAVY",
    label: "Contoh",
    description: "Contoh soal",
    icon: Target,
    accent: "from-[var(--purple)] to-[var(--pink)]",
  },
  {
    value: "SOCRATIC",
    label: "Socratic",
    description: "Dipandu pertanyaan",
    icon: MessageSquareQuote,
    accent: "from-[var(--yellow)] to-[var(--orange)]",
  },
];

const PRESET_TIMES = [
  { label: "Pagi", value: "07:00", emoji: "🌅" },
  { label: "Siang", value: "12:30", emoji: "☀️" },
  { label: "Sore", value: "16:30", emoji: "🌇" },
  { label: "Malam", value: "19:30", emoji: "🌙" },
];

export function OnboardingWizard({
  userName,
  subjects,
  pretestQuestions,
  correctAnswers,
}: {
  userName: string;
  subjects: Subject[];
  pretestQuestions: PretestQuestion[];
  correctAnswers: Record<string, string>;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [educationLevel, setEducationLevel] =
    React.useState<EducationLevel>("SMA");
  const [grade, setGrade] = React.useState(10);
  const [school, setSchool] = React.useState("");
  const [focusedSubjects, setFocusedSubjects] = React.useState<string[]>([]);
  const [learningStyle, setLearningStyle] =
    React.useState<LearningStyle | null>(null);
  const [reminderEnabled, setReminderEnabled] = React.useState(false);
  const [reminderTime, setReminderTime] = React.useState("19:00");
  const [pretestAnswers, setPretestAnswers] = React.useState<
    Record<string, string>
  >({});

  const isStepValid = (s: number): boolean => {
    if (s === 0) return true;
    if (s === 1) return school.trim().length >= 2;
    if (s === 2) return focusedSubjects.length >= 1;
    if (s === 3) return learningStyle !== null;
    if (s === 4) {
      return (
        pretestQuestions.length === 0 ||
        pretestQuestions.every((q) => Boolean(pretestAnswers[q.id]))
      );
    }
    return true;
  };

  const goNext = () => {
    if (!isStepValid(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const toggleSubject = (id: string) => {
    setFocusedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const answers = pretestQuestions.map((q) => {
      const userAnswer = pretestAnswers[q.id] ?? "";
      const correct = correctAnswers[q.id] ?? "";
      return {
        questionId: q.id,
        conceptId: q.conceptId,
        answer: userAnswer,
        isCorrect: userAnswer.toUpperCase() === correct.toUpperCase(),
      };
    });
    const result: CompleteOnboardingResult = await completeOnboarding({
      educationLevel,
      grade,
      school: school.trim(),
      focusedSubjects,
      learningStyle,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : null,
      pretestAnswers: answers,
    });
    if (!result.ok) {
      setError(result.message ?? "Gagal menyimpan. Coba lagi, ya.");
      setSubmitting(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <OnboardingWizardShell>
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Halo, <span className="text-[var(--coral)]">{userName}</span> 👋
        </p>
        <h1 className="mt-1 font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
          {step === 0 && (
            <>
              Hai! Aku <span className="text-gradient-warm">Spark</span> ✨
            </>
          )}
          {step === 1 && "Tentang kamu"}
          {step === 2 && "Mapel fokus kamu"}
          {step === 3 && "Gaya belajar & reminder"}
          {step === 4 && "Cek level awal kamu"}
        </h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
          {step === 0 &&
            "Temen belajar AI kamu. Isi beberapa hal ini, biar aku bisa nemenin kamu dengan pas."}
          {step === 1 &&
            "Biar aku nyesuaiin penjelasan sama level dan kurikulum sekolahmu."}
          {step === 2 &&
            "Pilih minimal 1. Bisa lebih dari satu, biar Spark bisa fokus ngebantu."}
          {step === 3 &&
            "Gaya belajar + reminder (opsional). Isi yang penting dulu."}
          {step === 4 &&
            "5 soal per mapel. Bisa di-skip, tapi kalo dijawab Spark bisa lebih nyesuaiin."}
        </p>
      </header>

      <StepIndicator current={step} total={STEPS.length} />

      <div key={`step-${step}`} className="mt-6 flex-1 animate-step-fade-in">
        {step === 0 && <WelcomeStep />}
        {step === 1 && (
          <ProfileStep
            educationLevel={educationLevel}
            setEducationLevel={setEducationLevel}
            grade={grade}
            setGrade={setGrade}
            school={school}
            setSchool={setSchool}
          />
        )}
        {step === 2 && (
          <SubjectsStep
            subjects={subjects}
            selected={focusedSubjects}
            onToggle={toggleSubject}
          />
        )}
        {step === 3 && (
          <StyleReminderStep
            learningStyle={learningStyle}
            setLearningStyle={setLearningStyle}
            reminderEnabled={reminderEnabled}
            setReminderEnabled={setReminderEnabled}
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
          />
        )}
        {step === 4 && (
          <PretestStep
            questions={pretestQuestions}
            answers={pretestAnswers}
            onAnswer={(qid, letter) =>
              setPretestAnswers((p) => ({ ...p, [qid]: letter }))
            }
          />
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive"
        >
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-destructive" />
          {error}
        </div>
      )}

      <footer className="mt-6 flex items-center justify-between gap-3 border-t border-border/40 pt-5">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={goBack}
          disabled={step === 0 || submitting}
          className="rounded-2xl"
        >
          <ArrowLeft size={15} />
          Kembali
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            size="lg"
            onClick={goNext}
            disabled={!isStepValid(step)}
            className="rounded-2xl bg-[var(--coral)] px-5 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90 hover:shadow-[0_10px_24px_rgba(225,29,72,0.5)]"
          >
            Lanjut
            <ArrowRight size={15} strokeWidth={2.5} />
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={!isStepValid(step) || submitting}
            className="rounded-2xl bg-[var(--coral)] px-5 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90 hover:shadow-[0_10px_32px_rgba(225,29,72,0.5)]"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Menyiapkan...
              </>
            ) : (
              <>
                <Sprout size={15} strokeWidth={2.5} />
                Mulai Belajar
              </>
            )}
          </Button>
        )}
      </footer>
    </OnboardingWizardShell>
  );
}

function OnboardingWizardShell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-muted-foreground">
          Step {current + 1} / {total}
        </span>
        <span className="text-[var(--coral)]">
          {Math.round(((current + 1) / total) * 100)}%
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const isPast = i < current;
          const isCurrent = i === current;
          return (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static ordered segments
              key={`seg-${current}-${i}`}
              className={cn(
                "h-1.5 flex-1 overflow-hidden rounded-full",
                isPast
                  ? "bg-[var(--teal)]"
                  : isCurrent
                    ? "bg-muted"
                    : "bg-muted/40",
              )}
            >
              {i <= current && (
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isPast
                      ? "w-full bg-[var(--teal)]"
                      : isCurrent
                        ? "w-full bg-gradient-to-r from-[var(--coral)] to-[var(--orange)]"
                        : "w-0",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="hidden gap-1.5 sm:flex sm:items-center sm:justify-between">
        {STEPS.map((s, i) => {
          const isPast = i < current;
          const isCurrent = i === current;
          return (
            <span
              key={s.key}
              className={cn(
                "flex items-center gap-1.5 text-[10.5px] font-semibold transition-colors",
                isCurrent
                  ? "text-[var(--coral)]"
                  : isPast
                    ? "text-[var(--teal)]"
                    : "text-muted-foreground/50",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[9.5px] font-bold",
                  isCurrent
                    ? "bg-[var(--coral)] text-white shadow-[0_2px_8px_rgba(225,29,72,0.4)]"
                    : isPast
                      ? "bg-[var(--teal)] text-white"
                      : "bg-muted text-muted-foreground/60",
                )}
              >
                {isPast ? <Check size={9} strokeWidth={3} /> : i + 1}
              </span>
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="space-y-5">
      <div className="flex justify-center pt-2">
        <SparkCharacter size="lg" />
      </div>

      <div className="rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white">
            <Heart size={14} strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-heading text-[13px] font-bold text-foreground">
              Tenang, ini cuma sebentar
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
              5 langkah, sekitar 2-3 menit. Semua data ini cuma buat aku
              nyesuaiin cara aku ngobrol, nggak dipake buat apa-apa lain.
            </p>
          </div>
        </div>
      </div>

      <ul className="grid gap-2.5">
        {[
          {
            icon: School,
            label: "Profil singkat",
            desc: "Jenjang, kelas, sekolah",
            color: "var(--coral)",
          },
          {
            icon: BookOpen,
            label: "Mapel fokus",
            desc: "Pilih yang mau kamu dalami",
            color: "var(--teal)",
          },
          {
            icon: Target,
            label: "Gaya belajar",
            desc: "Visual, teks, contoh, atau Socratic",
            color: "var(--purple)",
          },
          {
            icon: Bell,
            label: "Reminder (opsional)",
            desc: "Biar makin konsisten",
            color: "var(--yellow)",
          },
          {
            icon: CircleDashed,
            label: "Pretest (opsional)",
            desc: "5 soal biar tau level awal",
            color: "var(--pink)",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/60 p-3 backdrop-blur-sm"
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                style={{
                  background: `linear-gradient(135deg, ${item.color}, oklch(0.65 0.15 60))`,
                }}
              >
                <Icon size={15} strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold text-foreground">
                  {item.label}
                </p>
                <p className="truncate text-[10.5px] text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProfileStep({
  educationLevel,
  setEducationLevel,
  grade,
  setGrade,
  school,
  setSchool,
}: {
  educationLevel: EducationLevel;
  setEducationLevel: (v: EducationLevel) => void;
  grade: number;
  setGrade: (v: number) => void;
  school: string;
  setSchool: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: visual label for segmented control below */}
        <label className="mb-1.5 block text-[12px] font-semibold text-foreground/80">
          Jenjang
        </label>
        <div className="flex h-11 overflow-hidden rounded-2xl border border-border/40 bg-input/40">
          {(["SMA", "SMK"] as const).map((opt) => {
            const active = educationLevel === opt;
            return (
              <label
                key={opt}
                htmlFor={`edu-${opt}`}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-[var(--coral)]/10 text-[var(--coral)]"
                    : "text-foreground/70 hover:bg-muted/60",
                )}
              >
                <input
                  id={`edu-${opt}`}
                  type="radio"
                  name="educationLevel"
                  value={opt}
                  checked={active}
                  onChange={() => setEducationLevel(opt)}
                  className="sr-only"
                />
                {opt}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: visual label for segmented control below */}
        <label className="mb-1.5 block text-[12px] font-semibold text-foreground/80">
          Kelas
        </label>
        <div className="flex h-11 overflow-hidden rounded-2xl border border-border/40 bg-input/40">
          {([10, 11, 12] as const).map((g) => {
            const active = grade === g;
            return (
              <label
                key={g}
                htmlFor={`grade-${g}`}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-[var(--coral)]/10 text-[var(--coral)]"
                    : "text-foreground/70 hover:bg-muted/60",
                )}
              >
                <input
                  id={`grade-${g}`}
                  type="radio"
                  name="grade"
                  value={g}
                  checked={active}
                  onChange={() => setGrade(g)}
                  className="sr-only"
                />
                Kelas {g}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="school"
          className="mb-1.5 block text-[12px] font-semibold text-foreground/80"
        >
          Sekolah
        </label>
        <div className="group/field relative flex items-center rounded-2xl border border-transparent bg-input/40 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25">
          <span className="grid size-8 place-items-center text-muted-foreground">
            <School size={15} />
          </span>
          <input
            id="school"
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Nama sekolahmu"
            autoComplete="off"
            className="h-11 w-full min-w-0 rounded-2xl bg-transparent pr-3.5 text-[14px] outline-none placeholder:text-muted-foreground/80"
          />
        </div>
      </div>
    </div>
  );
}

function SubjectsStep({
  subjects,
  selected,
  onToggle,
}: {
  subjects: Subject[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {subjects.map((s) => {
        const active = selected.includes(s.id);
        return (
          // biome-ignore lint/a11y/useSemanticElements: custom-styled checkbox button
          <button
            key={s.id}
            type="button"
            role="checkbox"
            aria-checked={active}
            onClick={() => onToggle(s.id)}
            className={cn(
              "group/sub relative flex flex-col items-start gap-1.5 rounded-2xl border bg-card/40 p-4 text-left transition-all",
              active
                ? "border-transparent shadow-[0_8px_24px_rgba(80,20,50,0.12)] ring-2 ring-[var(--coral)]/40"
                : "border-border/40 hover:border-border/70 hover:bg-card/60",
            )}
          >
            <div className="flex w-full items-center justify-between">
              <span
                className="grid size-10 place-items-center rounded-xl text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform group-hover/sub:-translate-y-0.5"
                style={{
                  background: s.color
                    ? `linear-gradient(135deg, ${s.color}, oklch(0.65 0.15 60))`
                    : "linear-gradient(135deg, var(--coral), var(--orange))",
                }}
              >
                <span className="text-[18px]">{s.icon ?? "📚"}</span>
              </span>
              {active && (
                <span
                  aria-hidden
                  className="grid size-5 place-items-center rounded-full bg-[var(--coral)] text-white"
                >
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </div>
            <span className="font-heading text-[14px] font-bold text-foreground">
              {s.name}
            </span>
            <span className="text-[10.5px] text-muted-foreground">
              {selected.includes(s.id) ? "Dipilih" : "Tap buat pilih"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StyleReminderStep({
  learningStyle,
  setLearningStyle,
  reminderEnabled,
  setReminderEnabled,
  reminderTime,
  setReminderTime,
}: {
  learningStyle: LearningStyle | null;
  setLearningStyle: (v: LearningStyle) => void;
  reminderEnabled: boolean;
  setReminderEnabled: (v: boolean) => void;
  reminderTime: string;
  setReminderTime: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[12px] font-semibold text-foreground/80">
          Gaya belajar
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {LEARNING_STYLES.map((s) => {
            const active = learningStyle === s.value;
            const Icon = s.icon;
            return (
              // biome-ignore lint/a11y/useSemanticElements: custom-styled radio button
              <button
                key={s.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setLearningStyle(s.value)}
                className={cn(
                  "group/style relative flex flex-col items-start gap-1.5 rounded-2xl border bg-card/40 p-3.5 text-left transition-all",
                  active
                    ? "border-transparent shadow-[0_8px_24px_rgba(80,20,50,0.12)] ring-2 ring-[var(--coral)]/40"
                    : "border-border/40 hover:border-border/70 hover:bg-card/60",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform group-hover/style:-translate-y-0.5",
                      s.accent,
                    )}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="grid size-5 place-items-center rounded-full bg-[var(--coral)] text-white"
                    >
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <span className="font-heading text-[14px] font-bold text-foreground">
                  {s.label}
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  {s.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-foreground/80">
          <span>Reminder (opsional)</span>
          <span className="text-[10.5px] font-normal text-muted-foreground">
            Boleh di-skip
          </span>
        </p>
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3.5 transition-colors",
            reminderEnabled
              ? "border-[var(--coral)]/40 bg-[var(--coral)]/5"
              : "border-border/40 bg-card/60",
          )}
        >
          <span
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_14px_rgba(0,0,0,0.08)] transition-all",
              reminderEnabled
                ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] shadow-[0_8px_20px_rgba(225,29,72,0.35)]"
                : "bg-muted text-muted-foreground",
            )}
          >
            {reminderEnabled ? (
              <Bell size={15} strokeWidth={2.5} />
            ) : (
              <BellOff size={15} strokeWidth={2.5} />
            )}
          </span>
          <div className="flex-1">
            <p className="font-heading text-[13px] font-bold text-foreground">
              {reminderEnabled ? `Aktif jam ${reminderTime}` : "Reminder mati"}
            </p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">
              Maks 1 per hari, cuma kamu yang bisa aktifin
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              reminderEnabled ? "bg-[var(--coral)]" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-transform",
                reminderEnabled ? "translate-x-[22px]" : "translate-x-0.5",
              )}
            />
          </button>
        </div>

        {reminderEnabled && (
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {PRESET_TIMES.map((p) => {
              const active = reminderTime === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setReminderTime(p.value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-2xl border p-2 text-left transition-colors",
                    active
                      ? "border-transparent bg-[var(--coral)]/8 ring-2 ring-[var(--coral)]/40"
                      : "border-border/40 bg-card/40 hover:border-border/70",
                  )}
                >
                  <span className="text-[14px]">{p.emoji}</span>
                  <span className="text-[9.5px] font-semibold text-foreground/80">
                    {p.label}
                  </span>
                  <span className="font-heading text-[11.5px] font-bold text-foreground">
                    {p.value}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PretestStep({
  questions,
  answers,
  onAnswer,
}: {
  questions: PretestQuestion[];
  answers: Record<string, string>;
  onAnswer: (qid: string, letter: string) => void;
}) {
  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white">
          <CircleDashed size={20} strokeWidth={2.5} />
        </span>
        <p className="font-heading text-[15px] font-bold text-foreground">
          Belum ada soal pretest
        </p>
        <p className="mx-auto mt-1 max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
          Pilih dulu minimal 1 mapel di step sebelumnya biar soal pretest-nya
          muncul. Bisa balik ke step 3.
        </p>
      </div>
    );
  }

  const grouped = questions.reduce<Record<string, PretestQuestion[]>>(
    (acc, q) => {
      if (!acc[q.subjectName]) acc[q.subjectName] = [];
      acc[q.subjectName]?.push(q);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-3">
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

void ChevronRight;
