"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  GraduationCap,
  Loader2,
  MessageSquareQuote,
  School,
  Sparkles,
  Sprout,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "@/server/actions/onboarding";

type Subject = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

const LEARNING_STYLES: Array<{
  value: "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC";
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  accent: string;
}> = [
  {
    value: "VISUAL",
    label: "Visual",
    description: "Suka gambar, diagram, dan visualisasi",
    icon: Sparkles,
    accent: "from-[var(--coral)] to-[var(--orange)]",
  },
  {
    value: "TEXTUAL",
    label: "Teks",
    description: "Suka bacaan dan penjelasan tertulis",
    icon: BookOpen,
    accent: "from-[var(--blue)] to-[var(--teal)]",
  },
  {
    value: "EXAMPLE_HEAVY",
    label: "Contoh",
    description: "Lebih paham lewat contoh soal",
    icon: Target,
    accent: "from-[var(--purple)] to-[var(--pink)]",
  },
  {
    value: "SOCRATIC",
    label: "Socratic",
    description: "Suka dipandu lewat pertanyaan",
    icon: MessageSquareQuote,
    accent: "from-[var(--yellow)] to-[var(--orange)]",
  },
];

const STEP_TITLES = [
  "Lengkapi profil kamu",
  "Pilih mata pelajaran fokus",
  "Pilih gaya belajar",
  "Selamat datang di Spark!",
];

const STEP_SUBTITLES = [
  "Biar Spark bisa nyesuaiin penjelasan sesuai levelmu.",
  "Kamu bisa pilih lebih dari satu. Nggak harus semua.",
  "Spark bakal ngejelasin materi pakai cara yang kamu paling nyaman.",
  "Semuanya udah siap. Yuk, mulai perjalanan belajarmu.",
];

export function OnboardingFlow({
  userName,
  subjects,
}: {
  userName: string;
  subjects: Subject[];
}) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState({
    educationLevel: "SMA" as "SMA" | "SMK",
    grade: 10,
    school: "",
  });
  const [focusedSubjects, setFocusedSubjects] = React.useState<string[]>([]);
  const [learningStyle, setLearningStyle] = React.useState<
    "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC" | null
  >(null);

  const canProceed = React.useMemo(() => {
    if (step === 0) return profile.school.trim().length >= 2;
    if (step === 1) return focusedSubjects.length >= 1;
    if (step === 2) return learningStyle !== null;
    return true;
  }, [step, profile.school, focusedSubjects.length, learningStyle]);

  const handleNext = async () => {
    setServerError(null);
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    if (!learningStyle) return;

    setSubmitting(true);
    const result = await completeOnboarding({
      educationLevel: profile.educationLevel,
      grade: profile.grade,
      school: profile.school.trim(),
      learningStyle,
      subjectIds: focusedSubjects,
    });

    if (!result.ok) {
      setServerError(result.message);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const toggleSubject = (id: string) => {
    setFocusedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  return (
    <div className="relative min-h-svh w-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--hero-bg)" }}
      >
        <div
          className="absolute -left-32 top-20 size-[480px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 350 / 0.5), transparent 70%)",
            animation: "drift 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-32 top-1/3 size-[420px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.82 0.15 75 / 0.5), transparent 70%)",
            animation: "drift 22s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute bottom-10 left-1/3 size-[400px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.14 175 / 0.4), transparent 70%)",
            animation: "drift 25s ease-in-out infinite",
          }}
        />
      </div>

      <main className="mx-auto flex min-h-svh max-w-2xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        <Header step={step} total={4} userName={userName} />

        <div className="mt-6 flex-1 sm:mt-10">
          <div className="reveal" key={step}>
            <h1 className="font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-[32px]">
              {STEP_TITLES[step]}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              {STEP_SUBTITLES[step]}
            </p>

            <div className="mt-7 sm:mt-9">
              {step === 0 && (
                <ProfileStep
                  profile={profile}
                  onChange={(patch) =>
                    setProfile((prev) => ({ ...prev, ...patch }))
                  }
                />
              )}
              {step === 1 && (
                <SubjectsStep
                  subjects={subjects}
                  selected={focusedSubjects}
                  onToggle={toggleSubject}
                />
              )}
              {step === 2 && (
                <StyleStep
                  selected={learningStyle}
                  onSelect={setLearningStyle}
                />
              )}
              {step === 3 && (
                <DoneStep
                  userName={userName}
                  profile={profile}
                  subjects={subjects.filter((s) =>
                    focusedSubjects.includes(s.id),
                  )}
                  learningStyle={learningStyle}
                />
              )}
            </div>

            {serverError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/8 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive"
              >
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-destructive" />
                {serverError}
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 flex items-center justify-between gap-3 sm:mt-12">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleBack}
            disabled={step === 0 || submitting}
            className="rounded-2xl"
          >
            <ArrowLeft size={15} />
            Kembali
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={handleNext}
            disabled={!canProceed || submitting}
            className="rounded-2xl bg-[var(--coral)] px-6 text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90 hover:shadow-[0_12px_32px_rgba(225,29,72,0.5)]"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : step < 3 ? (
              <ArrowRight size={16} strokeWidth={2.5} />
            ) : (
              <Sparkles size={16} strokeWidth={2.5} />
            )}
            {submitting
              ? "Menyiapkan..."
              : step < 3
                ? "Lanjut"
                : "Mulai belajar"}
          </Button>
        </footer>
      </main>
    </div>
  );
}

function Header({
  step,
  total,
  userName,
}: {
  step: number;
  total: number;
  userName: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="font-heading text-[14px] font-semibold text-foreground/80">
          Halo, <span className="text-[var(--coral)]">{userName}</span> 👋
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Step {step + 1} / {total}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 overflow-hidden rounded-full",
              i < step
                ? "bg-[var(--coral)]/60"
                : i === step
                  ? "bg-muted"
                  : "bg-muted/40",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                i <= step
                  ? "w-full bg-gradient-to-r from-[var(--coral)] to-[var(--orange)]"
                  : "w-0",
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileStep({
  profile,
  onChange,
}: {
  profile: { educationLevel: "SMA" | "SMK"; grade: number; school: string };
  onChange: (patch: Partial<typeof profile>) => void;
}) {
  return (
    <div className="space-y-5">
      <FormRow label="Jenjang">
        <div className="flex h-11 overflow-hidden rounded-2xl border border-transparent bg-input/40">
          {(["SMA", "SMK"] as const).map((opt) => {
            const active = profile.educationLevel === opt;
            const id = `edu-${opt.toLowerCase()}`;
            return (
              <label
                key={opt}
                htmlFor={id}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 text-[13.5px] font-semibold transition-colors hover:bg-muted/60",
                  active
                    ? "bg-[var(--coral)]/10 text-[var(--coral)]"
                    : "text-foreground/70",
                )}
              >
                <input
                  id={id}
                  type="radio"
                  name="educationLevel"
                  value={opt}
                  checked={active}
                  onChange={() => onChange({ educationLevel: opt })}
                  className="sr-only"
                />
                {opt}
              </label>
            );
          })}
        </div>
      </FormRow>

      <FormRow label="Kelas">
        <div className="flex h-11 overflow-hidden rounded-2xl border border-transparent bg-input/40">
          {([10, 11, 12] as const).map((g) => {
            const active = profile.grade === g;
            const id = `grade-${g}`;
            return (
              <label
                key={g}
                htmlFor={id}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 text-[13.5px] font-semibold transition-colors hover:bg-muted/60",
                  active
                    ? "bg-[var(--coral)]/10 text-[var(--coral)]"
                    : "text-foreground/70",
                )}
              >
                <input
                  id={id}
                  type="radio"
                  name="grade"
                  value={g}
                  checked={active}
                  onChange={() => onChange({ grade: g })}
                  className="sr-only"
                />
                Kelas {g}
              </label>
            );
          })}
        </div>
      </FormRow>

      <FormRow label="Sekolah">
        <div className="group/field relative flex items-center rounded-2xl border border-transparent bg-input/40 transition-[color,box-shadow] duration-200 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25">
          <span className="grid size-8 place-items-center text-muted-foreground">
            <School size={15} />
          </span>
          <input
            type="text"
            name="school"
            value={profile.school}
            onChange={(e) => onChange({ school: e.target.value })}
            placeholder="Nama sekolahmu"
            className="h-11 w-full min-w-0 rounded-2xl bg-transparent pr-3.5 text-[14px] outline-none placeholder:text-muted-foreground/80"
          />
        </div>
        <p className="mt-1 text-[11.5px] font-medium text-muted-foreground/80">
          Nggak harus formal — nama panggilan juga boleh.
        </p>
      </FormRow>
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
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-foreground/80">
          {selected.length} dipilih
        </span>
        <span className="text-[11.5px] font-medium text-muted-foreground">
          Minimal 1
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
        {subjects.map((s) => {
          const active = selected.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => onToggle(s.id)}
              className={cn(
                "group/sub relative flex flex-col items-start gap-1.5 rounded-2xl border bg-card/40 p-3.5 text-left transition-all",
                active
                  ? "border-transparent shadow-[0_8px_24px_rgba(80,20,50,0.12)] ring-2 ring-[var(--coral)]/40"
                  : "border-border/40 hover:border-border/70 hover:bg-card/60",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span
                  className="grid size-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform group-hover/sub:-translate-y-0.5"
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
              <span className="text-[11.5px] leading-tight text-muted-foreground">
                Topik, latihan, dan chat Socratic
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StyleStep({
  selected,
  onSelect,
}: {
  selected: "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC" | null;
  onSelect: (v: "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC") => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {LEARNING_STYLES.map((s) => {
        const active = selected === s.value;
        const Icon = s.icon;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(s.value)}
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
          </button>
        );
      })}
    </div>
  );
}

function DoneStep({
  userName,
  profile,
  subjects,
  learningStyle,
}: {
  userName: string;
  profile: { educationLevel: "SMA" | "SMK"; grade: number; school: string };
  subjects: Subject[];
  learningStyle: "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC" | null;
}) {
  const styleLabel = learningStyle
    ? (LEARNING_STYLES.find((s) => s.value === learningStyle)?.label ?? "-")
    : "-";

  const summary = [
    {
      label: "Jenjang",
      value: `${profile.educationLevel} • Kelas ${profile.grade}`,
    },
    { label: "Sekolah", value: profile.school },
    {
      label: "Mata pelajaran fokus",
      value: subjects.map((s) => s.name).join(", ") || "-",
    },
    { label: "Gaya belajar", value: styleLabel },
  ];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--teal)]/30 bg-[color-mix(in_oklch,var(--teal)_10%,transparent)] p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-[var(--teal)] opacity-20 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--teal)] to-[var(--green)] text-white shadow-[0_4px_12px_rgba(20,184,166,0.3)]">
            <Sprout size={18} strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="font-heading text-[16px] font-bold text-foreground">
              Sip, {userName}! Semuanya udah siap ✨
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/80">
              Spark bakal ngejelasin materi pakai gaya yang kamu pilih dan
              nyesuaiin levelnya sesuai kelas kamu.
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {summary.map((item) => (
          <li
            key={item.label}
            className="flex items-start justify-between gap-3 rounded-2xl border border-border/40 bg-card/60 px-4 py-3 backdrop-blur-sm"
          >
            <span className="shrink-0 text-[11.5px] font-bold uppercase tracking-widest text-muted-foreground">
              {item.label}
            </span>
            <span className="text-right text-[12.5px] font-semibold text-foreground/90">
              {item.value}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3.5 py-2.5 text-[11.5px] font-medium text-muted-foreground">
        <GraduationCap size={13} className="text-[var(--coral)]" />
        Kamu bisa ubah semuanya nanti di halaman{" "}
        <span className="font-bold text-foreground/80">Profil</span>.
      </div>
    </div>
  );
}

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-4">
      <label className="shrink-0 pt-2.5 text-right text-[12.5px] font-semibold text-foreground/80 sm:w-24">
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}
