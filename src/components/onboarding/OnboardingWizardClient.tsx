"use client";

import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type CompleteOnboardingResult,
  completeOnboarding,
} from "@/server/actions/complete-onboarding";
import {
  type CompleteOnboardingCustomResult,
  completeOnboardingCustom,
} from "@/server/actions/complete-onboarding-custom";
import { fetchPretestPool } from "@/server/actions/fetch-pretest";
import { generateCustomSubjectPretest } from "@/server/actions/generate-onboarding-pretest";
import { CustomPretestStep } from "./CustomPretestStep";
import { CustomSubjectStep } from "./CustomSubjectStep";
import { PretestStep } from "./PretestStep";
import { type EducationLevel, ProfileStep } from "./ProfileStep";
import { type Step, StepIndicator } from "./StepIndicator";
import { type LearningStyle, StyleReminderStep } from "./StyleReminderStep";
import {
  type GeneratedPretestResult,
  SubjectSearchDialog,
} from "./SubjectSearchDialog";
import { SubjectsStep } from "./SubjectsStep";
import { WelcomeStep } from "./WelcomeStep";

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
  subjectId: string;
  subjectName: string;
};

type Flow = "national" | "custom" | null;

const NATIONAL_STEPS = [
  { key: "welcome", label: "Mulai" },
  { key: "profile", label: "Profil" },
  { key: "subjects", label: "Mapel" },
  { key: "style", label: "Gaya" },
  { key: "pretest", label: "Pretest" },
] as const;

const CUSTOM_STEPS = [
  { key: "welcome", label: "Mulai" },
  { key: "custom-subject", label: "Mapel" },
  { key: "custom-pretest", label: "Pretest" },
] as const;

export function OnboardingWizardClient({
  userName,
  subjects,
}: {
  userName: string;
  subjects: Subject[];
}) {
  const router = useRouter();
  const [flow, setFlow] = React.useState<Flow>(null);
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Pretest state (lazy loaded)
  const [pretestQuestions, setPretestQuestions] = React.useState<
    PretestQuestion[]
  >([]);
  const [correctAnswers, setCorrectAnswers] = React.useState<
    Record<string, string>
  >({});
  const [pretestLoading, setPretestLoading] = React.useState(false);
  const pretestFetched = React.useRef(false);
  const submittingRef = React.useRef(false);

  // Shared profile state
  const [educationLevel, setEducationLevel] =
    React.useState<EducationLevel>("SMA");
  const [grade, setGrade] = React.useState(10);
  const [school, setSchool] = React.useState("");
  const [learningStyle, setLearningStyle] =
    React.useState<LearningStyle | null>(null);
  const [reminderEnabled, setReminderEnabled] = React.useState(false);
  const [reminderTime, setReminderTime] = React.useState("19:00");

  // National flow state
  const [focusedSubjects, setFocusedSubjects] = React.useState<string[]>([]);
  const [pretestAnswers, setPretestAnswers] = React.useState<
    Record<string, string>
  >({});

  // Custom flow state
  const [customName, setCustomName] = React.useState("");
  const [customContext, setCustomContext] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedQuestions, setGeneratedQuestions] = React.useState<
    GeneratedPretestResult["questions"] | null
  >(null);
  const [generatedSubjectData, setGeneratedSubjectData] = React.useState<
    GeneratedPretestResult["subjectData"] | null
  >(null);
  const [customPretestAnswers, setCustomPretestAnswers] = React.useState<
    Record<number, string>
  >({});

  // Reset custom generation when custom parameters change
  const handleCustomNameChange = (val: string) => {
    setCustomName(val);
    setGeneratedQuestions(null);
    setGeneratedSubjectData(null);
  };
  const handleCustomContextChange = (val: string) => {
    setCustomContext(val);
    setGeneratedQuestions(null);
    setGeneratedSubjectData(null);
  };
  const handleCustomEducationLevelChange = (val: EducationLevel) => {
    setEducationLevel(val);
    setGeneratedQuestions(null);
    setGeneratedSubjectData(null);
  };
  const handleCustomGradeChange = (val: number) => {
    setGrade(val);
    setGeneratedQuestions(null);
    setGeneratedSubjectData(null);
  };

  // Search dialog state
  const [searchOpen, setSearchOpen] = React.useState(false);

  const steps = flow === "custom" ? CUSTOM_STEPS : NATIONAL_STEPS;

  const showStepIndicator = flow !== null;

  // Lazy fetch pretest when reaching pretest step
  const loadPretest = React.useCallback(async () => {
    if (pretestFetched.current || pretestLoading) return;
    setPretestLoading(true);
    const result = await fetchPretestPool();
    if (result.ok) {
      setPretestQuestions(result.questions);
      setCorrectAnswers(result.correctAnswers);
      pretestFetched.current = true;
    }
    setPretestLoading(false);
  }, [pretestLoading]);

  // Fetch pretest when step 4 (pretest) is reached in national flow
  React.useEffect(() => {
    if (flow === "national" && step === 4 && !pretestFetched.current) {
      loadPretest();
    }
  }, [flow, step, loadPretest]);

  const visiblePretest = React.useMemo(
    () =>
      focusedSubjects.length === 0
        ? []
        : pretestQuestions.filter((q) => focusedSubjects.includes(q.subjectId)),
    [pretestQuestions, focusedSubjects],
  );

  const isStepValid = (s: number): boolean => {
    if (flow === null) return true;
    if (flow === "custom") {
      if (s === 0) return true;
      if (s === 1) return generatedQuestions !== null;
      if (s === 2) {
        return (
          generatedQuestions === null ||
          generatedQuestions.every((_, qi) => Boolean(customPretestAnswers[qi]))
        );
      }
      return true;
    }
    if (s === 0) return true;
    if (s === 1) return school.trim().length >= 2;
    if (s === 2) return focusedSubjects.length >= 1;
    if (s === 3) return learningStyle !== null;
    if (s === 4) {
      return (
        visiblePretest.length === 0 ||
        visiblePretest.every((q) => Boolean(pretestAnswers[q.id]))
      );
    }
    return true;
  };

  const goNext = () => {
    if (!isStepValid(step)) return;
    const nextStep = Math.min(step + 1, steps.length - 1);
    console.log("[ONBOARDING_CLIENT] goNext", { flow, fromStep: step, toStep: nextStep, stepKey: steps[nextStep]?.key });
    setStep(nextStep);
  };

  const goBack = () => {
    console.log("[ONBOARDING_CLIENT] goBack", { flow, step });
    if (step === 0) {
      // UX-3 FIX: Add confirmation before resetting onboarding progress
      if (flow !== null) {
        if (
          window.confirm(
            "Kembali ke awal? Semua data yang sudah diisi akan hilang.",
          )
        ) {
          setFlow(null);
          setStep(0);
        }
      }
      return;
    }
    if (step === 1 && flow !== null) {
      // UX-3 FIX: Add confirmation before resetting onboarding progress
      if (
        window.confirm(
          "Kembali ke awal? Semua data yang sudah diisi akan hilang.",
        )
      ) {
        setFlow(null);
        setStep(0);
      }
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const toggleSubject = (id: string) => {
    setFocusedSubjects((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      console.log("[ONBOARDING_CLIENT] toggleSubject", { id, wasSelected: prev.includes(id), nowSelected: next.includes(id), totalSelected: next.length });
      return next;
    });
  };

  const handleChooseNational = () => {
    console.log("[ONBOARDING_CLIENT] handleChooseNational");
    setFlow("national");
    setStep(1);
  };

  const handleChooseCustom = () => {
    console.log("[ONBOARDING_CLIENT] handleChooseCustom");
    setFlow("custom");
    setStep(1);
  };

  const handleCustomGenerate = async () => {
    console.log("[ONBOARDING_CLIENT] handleCustomGenerate", { name: customName.trim(), context: customContext.trim(), educationLevel, grade });
    if (customName.trim().length < 2) {
      console.log("[ONBOARDING_CLIENT] handleCustomGenerate failed: name too short");
      setError("Nama mapel minimal 2 karakter");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateCustomSubjectPretest({
        name: customName.trim(),
        context: customContext.trim() || undefined,
        educationLevel,
        grade,
      });
      console.log("[ONBOARDING_CLIENT] handleCustomGenerate result", { ok: result.ok, questionsCount: result.ok ? result.questions.length : 0 });
      if (!result.ok) {
        console.log("[ONBOARDING_CLIENT] handleCustomGenerate error:", result.error);
        setError(result.error ?? "Gagal generate. Coba lagi.");
        setIsGenerating(false);
        return;
      }
      setGeneratedQuestions(result.questions);
      setGeneratedSubjectData(result.subjectData);
      setIsGenerating(false);
    } catch (err) {
      console.error(
        "[ONBOARDING_CLIENT] generateCustomSubjectPretest error:",
        err,
      );
      setError("Gagal terhubung ke AI. Coba lagi.");
      setIsGenerating(false);
    }
  };

  const handleCustomSubjectCreated = (result: GeneratedPretestResult) => {
    console.log("[ONBOARDING_CLIENT] handleCustomSubjectCreated", { name: result.subjectData.name, questionsCount: result.questions.length });
    setGeneratedQuestions(result.questions);
    setGeneratedSubjectData(result.subjectData);
    setCustomName(result.subjectData.name);
    setCustomPretestAnswers({});
  };

  const handleNationalSubmit = async () => {
    console.log("[ONBOARDING_CLIENT] handleNationalSubmit called", { submitting: submittingRef.current });
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const answers = visiblePretest.map((q, _qi) => {
        const userAnswer = pretestAnswers[q.id] ?? "";
        const correct = correctAnswers[q.id] ?? "";
        const letterIndex = userAnswer.charCodeAt(0) - 65;
        const resolvedAnswer =
          q.options && letterIndex >= 0 && letterIndex < q.options.length
            ? q.options[letterIndex]
            : userAnswer;
        return {
          questionId: q.id,
          conceptId: q.conceptId,
          answer: userAnswer,
          isCorrect:
            resolvedAnswer.trim().toUpperCase() ===
            correct.trim().toUpperCase(),
        };
      });

      console.log("[ONBOARDING_CLIENT] handleNationalSubmit calling completeOnboarding", {
        educationLevel,
        grade,
        school: school.trim(),
        focusedSubjectsCount: focusedSubjects.length,
        learningStyle,
        reminderEnabled,
        answersCount: answers.length,
        correctCount: answers.filter((a) => a.isCorrect).length,
      });

      // Server action now calls redirect("/dashboard") on success.
      // If it returns, it means there was an error.
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

      // If we reach here, the action returned an error (success would redirect)
      console.log("[ONBOARDING_CLIENT] handleNationalSubmit returned (error case)", { ok: result.ok, message: result.message });
      setError(result.message ?? "Gagal menyimpan. Coba lagi, ya.");
      submittingRef.current = false;
      setSubmitting(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        console.log("[ONBOARDING_CLIENT] handleNationalSubmit redirect triggered");
        throw err;
      }
      console.error("[ONBOARDING_CLIENT] handleNationalSubmit error:", err);
      setError("Terjadi kesalahan. Coba lagi.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleCustomSubmit = async () => {
    console.log("[ONBOARDING_CLIENT] handleCustomSubmit called", { submitting: submittingRef.current, hasQuestions: !!generatedQuestions, hasSubjectData: !!generatedSubjectData });
    // Use ref guard to prevent duplicate calls (React strict mode, double-clicks)
    if (submittingRef.current) return;
    if (!generatedQuestions || !generatedSubjectData) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const pretestAnswers = generatedQuestions.map((q, qi) => {
        const userAnswer = customPretestAnswers[qi] ?? "";
        const letterIndex = userAnswer.charCodeAt(0) - 65;
        const resolvedAnswer =
          letterIndex >= 0 && letterIndex < q.options.length
            ? q.options[letterIndex]
            : userAnswer;
        return {
          questionIndex: qi,
          answer: userAnswer,
          isCorrect:
            resolvedAnswer.trim().toUpperCase() ===
            q.correctAnswer.trim().toUpperCase(),
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty as "EASY" | "MEDIUM" | "HARD",
        };
      });

      console.log("[ONBOARDING_CLIENT] handleCustomSubmit calling completeOnboardingCustom", {
        educationLevel,
        grade,
        school: school.trim(),
        learningStyle: learningStyle ?? "VISUAL",
        reminderEnabled,
        focusedSubjectsCount: focusedSubjects.length,
        subjectName: generatedSubjectData.name,
        topicsCount: generatedSubjectData.topics?.length ?? 0,
        pretestAnswersCount: pretestAnswers.length,
        correctCount: pretestAnswers.filter((a) => a.isCorrect).length,
      });

      // Server action now calls redirect("/dashboard") on success.
      // If it returns, it means there was an error.
      const result: CompleteOnboardingCustomResult =
        await completeOnboardingCustom({
          profile: {
            educationLevel,
            grade,
            school: school.trim(),
            learningStyle: learningStyle ?? "VISUAL",
            reminderEnabled,
            reminderTime: reminderEnabled ? reminderTime : null,
            focusedSubjects,
          },
          subjectName: generatedSubjectData.name,
          subjectData: generatedSubjectData,
          pretestAnswers,
        });

      // If we reach here, the action returned an error (success would redirect)
      console.log("[ONBOARDING_CLIENT] handleCustomSubmit returned (error case)", { ok: result.ok, message: result.message });
      setError(result.message ?? "Gagal menyimpan. Coba lagi, ya.");
      submittingRef.current = false;
      setSubmitting(false);
    } catch (err) {
      // redirect() throws in server actions — rethrow it so Next.js handles it
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        console.log("[ONBOARDING_CLIENT] handleCustomSubmit redirect triggered");
        throw err;
      }
      console.error("[ONBOARDING_CLIENT] handleCustomSubmit error:", err);
      setError("Terjadi kesalahan. Coba lagi.");
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleSubmit =
    flow === "custom" ? handleCustomSubmit : handleNationalSubmit;

  const stepTitle = () => {
    const currentStepKey = steps[step]?.key;
    if (flow === "custom") {
      if (currentStepKey === "custom-subject") return "Bikin mapel kustom";
      if (currentStepKey === "custom-pretest") return "Cek level awal kamu";
    }
    if (currentStepKey === "profile") return "Tentang kamu";
    if (currentStepKey === "subjects") return "Pilih mapel fokus";
    if (currentStepKey === "style") return "Gaya belajar kamu";
    if (currentStepKey === "pretest") return "Cek level awal kamu";
    return "";
  };

  const stepDescription = () => {
    const currentStepKey = steps[step]?.key;
    if (flow === "custom") {
      if (currentStepKey === "custom-subject") {
        return "Kasih tau Spark mapel apa yang kamu mau, nanti AI generate outline + soal pretest.";
      }
      if (currentStepKey === "custom-pretest") {
        return "Soal ini dibuat khusus buat kamu sama AI. Jawab aja sebisanya.";
      }
    }
    if (currentStepKey === "profile") {
      return "Biar Spark bisa nyesuaiin penjelasan sama level dan kurikulum sekolahmu.";
    }
    if (currentStepKey === "subjects") {
      return "Pilih minimal 1 mapel. Bisa lebih dari satu biar Spark fokus ngebantu.";
    }
    if (currentStepKey === "style") {
      return "Pilih gaya belajar yang paling cocok buat kamu. Reminder opsional.";
    }
    if (currentStepKey === "pretest") {
      return "Jawab sebisanya — Spark pakai ini buat nyesuaiin materi. Bisa di-skip.";
    }
    return "";
  };

  const isWelcomeScreen = flow === null;

  React.useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  // ─── Welcome screen (no header/footer chrome) ───
  if (isWelcomeScreen) {
    return (
      <div className="flex flex-1 flex-col">
        <WelcomeStep
          userName={userName}
          onChooseNational={handleChooseNational}
          onChooseCustom={handleChooseCustom}
        />
      </div>
    );
  }

  // ─── All other steps ───
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Halo, <span className="text-[var(--coral)]">{userName}</span> 👋
          </p>
          <span className="text-[11px] font-semibold text-muted-foreground/60">
            Step {step + 1} dari {steps.length}
          </span>
        </div>
        <h1 className="font-heading text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
          {stepTitle()}
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {stepDescription()}
        </p>
      </header>

      {/* Step indicator */}
      {showStepIndicator && (
        <StepIndicator steps={steps as unknown as Step[]} current={step} />
      )}

      {/* Step content */}
      <div
        key={`step-${flow}-${step}`}
        className="mt-6 flex-1 animate-step-fade-in"
      >
        {/* Step 0: Welcome (catch-all for any flow so it never shows blank) */}
        {step === 0 && (
          <WelcomeStep
            userName={userName}
            onChooseNational={handleChooseNational}
            onChooseCustom={handleChooseCustom}
          />
        )}

        {/* National flow */}
        {flow === "national" && step === 1 && (
          <ProfileStep
            educationLevel={educationLevel}
            setEducationLevel={setEducationLevel}
            grade={grade}
            setGrade={setGrade}
            school={school}
            setSchool={setSchool}
          />
        )}
        {flow === "national" && step === 2 && (
          <>
            <SubjectsStep
              subjects={subjects}
              selected={focusedSubjects}
              onToggle={toggleSubject}
              onOpenSearch={() => setSearchOpen(true)}
              onContinue={goNext}
            />
            <SubjectSearchDialog
              open={searchOpen}
              onClose={() => setSearchOpen(false)}
              subjects={subjects}
              selectedSubjects={focusedSubjects}
              onToggleSubject={toggleSubject}
              onCustomSubjectCreated={handleCustomSubjectCreated}
              educationLevel={educationLevel}
              grade={grade}
            />
          </>
        )}
        {flow === "national" && step === 3 && (
          <StyleReminderStep
            learningStyle={learningStyle}
            setLearningStyle={setLearningStyle}
            reminderEnabled={reminderEnabled}
            setReminderEnabled={setReminderEnabled}
            reminderTime={reminderTime}
            setReminderTime={setReminderTime}
          />
        )}
        {flow === "national" &&
          step === 4 &&
          (pretestLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-[var(--coral)]/15 to-[var(--orange)]/10">
                <Loader2
                  size={28}
                  className="animate-spin text-[var(--coral)]"
                />
              </div>
              <p className="text-[14px] font-semibold text-muted-foreground">
                Memuat soal pretest...
              </p>
            </div>
          ) : (
            <PretestStep
              questions={visiblePretest}
              answers={pretestAnswers}
              onAnswer={(qid, letter) =>
                setPretestAnswers((p) => ({ ...p, [qid]: letter }))
              }
              selectedCount={focusedSubjects.length}
            />
          ))}

        {/* Custom flow */}
        {flow === "custom" && step === 1 && (
          <CustomSubjectStep
            name={customName}
            context={customContext}
            educationLevel={educationLevel}
            grade={grade}
            onNameChange={handleCustomNameChange}
            onContextChange={handleCustomContextChange}
            onEducationLevelChange={handleCustomEducationLevelChange}
            onGradeChange={handleCustomGradeChange}
            isGenerating={isGenerating}
            error={error}
          />
        )}
        {flow === "custom" && step === 2 && generatedQuestions && (
          <CustomPretestStep
            questions={generatedQuestions}
            answers={customPretestAnswers}
            onAnswer={(qi, letter) =>
              setCustomPretestAnswers((p) => ({ ...p, [qi]: letter }))
            }
            subjectName={generatedSubjectData?.name ?? customName}
          />
        )}
      </div>

      {/* Error */}
      {error && flow !== "custom" && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-xl border-2 border-destructive/30 bg-destructive/8 px-4 py-3 text-[13px] font-medium text-destructive"
        >
          <span className="mt-1 size-2 shrink-0 rounded-full bg-destructive" />
          {error}
        </div>
      )}

      {/* Footer navigation */}
      <footer className="mt-8 flex items-center justify-between gap-4 border-t border-border/40 pt-6">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={goBack}
          disabled={submitting || isGenerating}
          className="rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Kembali
        </Button>

        {step < steps.length - 1 ? (
          <Button
            type="button"
            size="xl"
            onClick={
              flow === "custom" && step === 1 && !isGenerating
                ? generatedQuestions
                  ? goNext
                  : handleCustomGenerate
                : goNext
            }
            disabled={
              isGenerating ||
              (flow === "custom" && step === 1
                ? generatedQuestions
                  ? false
                  : customName.trim().length < 2
                : !isStepValid(step))
            }
            className="rounded-xl bg-gradient-to-r from-[var(--coral)] to-[var(--orange)] px-7 text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.3)] hover:shadow-[0_12px_32px_rgba(225,29,72,0.4)]"
          >
            {flow === "custom" && step === 1 ? (
              isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Generate...
                </>
              ) : generatedQuestions ? (
                <>
                  Lanjut
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              ) : (
                <>
                  <Sparkles size={16} strokeWidth={2.5} />
                  Generate + Test
                </>
              )
            ) : (
              <>
                Lanjut
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            size="xl"
            onClick={handleSubmit}
            disabled={!isStepValid(step) || submitting || isGenerating}
            className={cn(
              "rounded-xl px-7 text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.3)] transition-all",
              submitting
                ? "bg-[var(--coral)]/70"
                : "bg-gradient-to-r from-[var(--coral)] to-[var(--orange)] hover:shadow-[0_12px_32px_rgba(225,29,72,0.45)]",
            )}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Menyiapkan dashboard...
              </>
            ) : (
              <>
                <Sparkles size={16} strokeWidth={2.5} />
                {flow === "custom"
                  ? "Selesai & Mulai Belajar"
                  : "Mulai Belajar"}
              </>
            )}
          </Button>
        )}
      </footer>
    </div>
  );
}
