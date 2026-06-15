"use client";

import {
  Bell,
  BellOff,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  GraduationCap,
  Heart,
  Loader2,
  MessageSquareQuote,
  School,
  Sparkles,
  Sprout,
  Star,
  Target,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

const LEARNING_STYLES: Array<{
  value: LearningStyle;
  label: string;
  description: string;
  example: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  accent: string;
}> = [
  {
    value: "VISUAL",
    label: "Visual",
    description: "Suka gambar, diagram, dan visualisasi",
    example: "Aku jelasin pakai diagram, ilustrasi, dan warna-warni.",
    icon: Sparkles,
    accent: "from-[var(--coral)] to-[var(--orange)]",
  },
  {
    value: "TEXTUAL",
    label: "Teks",
    description: "Suka bacaan dan penjelasan tertulis",
    example: "Aku jelasin pakai paragraf rapi dan contoh tertulis.",
    icon: BookOpen,
    accent: "from-[var(--blue)] to-[var(--teal)]",
  },
  {
    value: "EXAMPLE_HEAVY",
    label: "Contoh",
    description: "Lebih paham lewat contoh soal",
    example: "Aku banyakin contoh soal yang sering keluar di ujian.",
    icon: Target,
    accent: "from-[var(--purple)] to-[var(--pink)]",
  },
  {
    value: "SOCRATIC",
    label: "Socratic",
    description: "Suka dipandu lewat pertanyaan",
    example: "Aku tanya balik biar kamu nemuin jawabannya sendiri.",
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

export function OnboardingForm({
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
  const { update } = useSession();
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
  const [pretestOpen, setPretestOpen] = React.useState(false);

  const toggleSubject = (id: string) => {
    setFocusedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const pretestAllAnswered =
    pretestQuestions.length === 0 ||
    pretestQuestions.every((q) => Boolean(pretestAnswers[q.id]));

  const canSubmit =
    school.trim().length >= 2 &&
    focusedSubjects.length >= 1 &&
    learningStyle !== null &&
    pretestAllAnswered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
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

    await update();
    router.push("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Section
        badge="Kenalan dulu"
        title={`Hai, ${userName}! 👋`}
        subtitle="Aku Spark, temen belajar AI kamu. Isi beberapa hal ini biar aku bisa nemenin kamu dengan pas."
        accent="coral"
      >
        <div className="flex justify-center pt-2">
          <SparkCharacter size="lg" />
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-border/40 bg-background/40 px-3.5 py-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-white">
            <Heart size={13} strokeWidth={2.5} />
          </span>
          <p className="text-[12.5px] leading-relaxed text-foreground/85">
            Tenang, semua data ini cuma buat aku nyesuaiin cara aku ngobrol.
            Nggak dipake buat apa-apa lain.
          </p>
        </div>
      </Section>

      <Section
        badge="Profil"
        title="Tentang kamu"
        subtitle="Biar aku nyesuaiin penjelasan sama level dan kurikulum sekolahmu."
        step={1}
        accent="coral"
        complete={school.trim().length >= 2}
      >
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
      </Section>

      <Section
        badge="Mapel fokus"
        title="Mata pelajaran yang mau kamu dalami"
        subtitle="Pilih minimal 1. Bisa lebih dari satu, tapi jangan semua biar Spark bisa fokus."
        step={2}
        accent="purple"
        complete={focusedSubjects.length >= 1}
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
          {subjects.map((s) => {
            const active = focusedSubjects.includes(s.id);
            return (
              // biome-ignore lint/a11y/useSemanticElements: custom-styled checkbox button
              <button
                key={s.id}
                type="button"
                role="checkbox"
                aria-checked={active}
                onClick={() => toggleSubject(s.id)}
                className={cn(
                  "group/sub relative flex flex-col items-start gap-1.5 rounded-2xl border bg-card/40 p-3.5 text-left transition-all",
                  active
                    ? "border-transparent shadow-[0_8px_24px_rgba(80,20,50,0.12)] ring-2 ring-[var(--coral)]/40"
                    : "border-border/40 hover:border-border/70 hover:bg-card/60",
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    className="grid size-9 place-items-center rounded-xl text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform group-hover/sub:-translate-y-0.5"
                    style={{
                      background: s.color
                        ? `linear-gradient(135deg, ${s.color}, oklch(0.65 0.15 60))`
                        : "linear-gradient(135deg, var(--coral), var(--orange))",
                    }}
                  >
                    <span className="text-[16px]">{s.icon ?? "📚"}</span>
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
                  Topik, latihan, dan chat
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        badge="Gaya belajar"
        title="Gimana cara kamu paling nyaman diajarin?"
        subtitle="Aku bakal nyesuaiin penjelasan dan latihan sesuai pilihan kamu."
        step={3}
        accent="teal"
        complete={learningStyle !== null}
      >
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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
                  "group/style relative flex flex-col items-start gap-2 rounded-2xl border bg-card/40 p-4 text-left transition-all",
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
                <span className="font-heading text-[14.5px] font-bold text-foreground">
                  {s.label}
                </span>
                <span className="text-[11.5px] leading-tight text-muted-foreground">
                  {s.description}
                </span>
                <span className="mt-0.5 text-[10.5px] leading-snug italic text-foreground/70">
                  &ldquo;{s.example}&rdquo;
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        badge="Reminder"
        title="Pengingat belajar (opsional)"
        subtitle="Biar makin konsisten. Cuma 1 per hari, dan cuma kamu yang bisa aktifin."
        step={4}
        accent="yellow"
        complete={true}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
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
              <Bell size={16} strokeWidth={2.5} />
            ) : (
              <BellOff size={16} strokeWidth={2.5} />
            )}
          </span>
          <div className="flex-1">
            <p className="font-heading text-[13.5px] font-bold text-foreground">
              {reminderEnabled ? "Reminder aktif" : "Tanpa reminder"}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
              {reminderEnabled
                ? `Spark bakal ngingetin kamu jam ${reminderTime}.`
                : "Bisa diaktifin nanti di halaman Profil."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reminderEnabled}
            onClick={() => setReminderEnabled(!reminderEnabled)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              reminderEnabled ? "bg-[var(--coral)]" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-6 rounded-full bg-white shadow-md transition-transform",
                reminderEnabled ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>

        {reminderEnabled && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PRESET_TIMES.map((p) => {
              const active = reminderTime === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setReminderTime(p.value)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors",
                    active
                      ? "border-transparent bg-[var(--coral)]/8 ring-2 ring-[var(--coral)]/40"
                      : "border-border/40 bg-card/40 hover:border-border/70",
                  )}
                >
                  <span className="text-[16px]">{p.emoji}</span>
                  <span className="text-[12px] font-semibold text-foreground/80">
                    {p.label}
                  </span>
                  <span className="font-heading text-[15px] font-bold text-foreground">
                    {p.value}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {pretestQuestions.length > 0 && (
        <section className="rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <button
            type="button"
            onClick={() => setPretestOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                <CircleDashed size={10} strokeWidth={2.5} />
                Pretest (opsional)
              </span>
              <h2 className="mt-2 font-heading text-[20px] font-bold leading-tight tracking-tight">
                Cek level awal kamu
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                5 soal per mapel fokus. Bisa kamu skip, tapi kalo dijawab, Spark
                bisa lebih nyesuaiin level awalnya.
              </p>
            </div>
            <span
              className={cn(
                "grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                pretestOpen
                  ? "bg-[var(--teal)] text-white"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {pretestOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </span>
          </button>

          {pretestOpen && (
            <div className="mt-5 space-y-3">
              {Object.entries(
                pretestQuestions.reduce<Record<string, PretestQuestion[]>>(
                  (acc, q) => {
                    if (!acc[q.subjectName]) {
                      acc[q.subjectName] = [];
                    }
                    acc[q.subjectName]?.push(q);
                    return acc;
                  },
                  {},
                ),
              ).map(([subject, qs], groupIdx) => (
                <div key={subject} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded-lg bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-[10px] font-bold text-white">
                      {groupIdx + 1}
                    </span>
                    <h3 className="font-heading text-[13.5px] font-bold text-foreground">
                      {subject}
                    </h3>
                    <span className="text-[10.5px] font-semibold text-muted-foreground">
                      {qs.length} soal
                    </span>
                  </div>
                  {qs.map((q) => {
                    const opts = q.options ?? [];
                    return (
                      <div
                        key={q.id}
                        className="rounded-2xl border border-border/40 bg-background/40 p-3"
                      >
                        <p className="text-[12.5px] font-semibold leading-snug text-foreground">
                          {q.questionText}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                          {q.conceptName}
                        </p>
                        <div className="mt-2 grid gap-1.5">
                          {opts.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            const active = pretestAnswers[q.id] === letter;
                            return (
                              <button
                                key={`${q.id}-${letter}`}
                                type="button"
                                onClick={() =>
                                  setPretestAnswers((p) => ({
                                    ...p,
                                    [q.id]: letter,
                                  }))
                                }
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors",
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
                                <span className="flex-1 leading-snug">
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
              ))}
              <p className="text-center text-[11px] font-semibold text-muted-foreground">
                {pretestAllAnswered
                  ? "✓ Semua soal terjawab"
                  : `${pretestQuestions.length - Object.keys(pretestAnswers).length} soal belum terjawab`}
              </p>
            </div>
          )}
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive"
        >
          <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-destructive" />
          {error}
        </div>
      )}

      <div className="sticky bottom-20 z-20 md:bottom-4">
        <div className="rounded-2xl border border-border/40 bg-background/85 p-3 shadow-[0_-8px_24px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-4">
          <Button
            type="submit"
            size="xl"
            disabled={!canSubmit || submitting}
            className="w-full rounded-2xl bg-[var(--coral)] text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90 hover:shadow-[0_12px_32px_rgba(225,29,72,0.5)]"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Menyiapkan...
              </>
            ) : (
              <>
                <Sprout size={16} strokeWidth={2.5} />
                Mulai Belajar
              </>
            )}
          </Button>
          {!canSubmit && (
            <p className="mt-2 text-center text-[10.5px] font-semibold text-muted-foreground">
              {focusedSubjects.length === 0 && "Pilih minimal 1 mapel. "}
              {learningStyle === null && "Pilih gaya belajar. "}
              {school.trim().length < 2 && "Isi nama sekolah. "}
              {!pretestAllAnswered && "Jawab semua soal pretest."}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

function Section({
  badge,
  title,
  subtitle,
  step,
  accent,
  complete,
  children,
}: {
  badge: string;
  title: string;
  subtitle: string;
  step?: number;
  accent: "coral" | "purple" | "teal" | "yellow";
  complete?: boolean;
  children: React.ReactNode;
}) {
  const accentMap = {
    coral: "var(--coral)",
    purple: "var(--purple)",
    teal: "var(--teal)",
    yellow: "var(--yellow)",
  } as const;
  const color = accentMap[accent];

  return (
    <section className="rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={{
              border: `1px solid color-mix(in oklch, ${color} 22%, transparent)`,
              background: `color-mix(in oklch, ${color} 8%, transparent)`,
              color: color,
            }}
          >
            {step !== undefined && (
              <span
                className="grid size-3.5 place-items-center rounded-full text-[8px] font-bold"
                style={{ background: color, color: "white" }}
              >
                {step}
              </span>
            )}
            {badge}
          </span>
          <h2 className="mt-2 font-heading text-[20px] font-bold leading-tight tracking-tight sm:text-[22px]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
              {subtitle}
            </p>
          )}
        </div>
        {complete && (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--teal)]/15 text-[var(--teal)] shadow-[inset_0_0_0_1px_rgba(20,184,166,0.25)]">
            <Check size={13} strokeWidth={3} />
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

void GraduationCap;
void Star;
void Zap;
