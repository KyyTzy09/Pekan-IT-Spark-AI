"use client";

import { ArrowLeft, ArrowRight, Loader2, Sprout } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { StepIndicator, type Step } from "./StepIndicator";
import { WelcomeStep } from "./WelcomeStep";
import { ProfileStep, type EducationLevel } from "./ProfileStep";
import { SubjectsStep } from "./SubjectsStep";
import {
  SubjectSearchDialog,
  type GeneratedPretestResult,
} from "./SubjectSearchDialog";
import { StyleReminderStep, type LearningStyle } from "./StyleReminderStep";
import { PretestStep } from "./PretestStep";
import { CustomSubjectStep } from "./CustomSubjectStep";
import { CustomPretestStep } from "./CustomPretestStep";
import { generateCustomSubjectPretest } from "@/server/actions/generate-onboarding-pretest";

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
  { key: "welcome", label: "Welcome" },
  { key: "profile", label: "Profil" },
  { key: "subjects", label: "Mapel" },
  { key: "style", label: "Gaya" },
  { key: "pretest", label: "Pretest" },
] as const;

const CUSTOM_STEPS = [
  { key: "welcome", label: "Welcome" },
  { key: "custom-subject", label: "Mapel" },
  { key: "custom-pretest", label: "Pretest" },
] as const;

export function OnboardingWizardClient({
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
  const [flow, setFlow] = React.useState<Flow>(null);
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
  const [generatedSubjectData, setGeneratedSubjectData] =
    React.useState<GeneratedPretestResult["subjectData"] | null>(null);
  const [customPretestAnswers, setCustomPretestAnswers] = React.useState<
    Record<number, string>
  >({});

  // Search dialog state
  const [searchOpen, setSearchOpen] = React.useState(false);

  const steps = flow === "custom" ? CUSTOM_STEPS : NATIONAL_STEPS;

  const showStepIndicator = flow !== null;

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
          generatedQuestions.every((_, qi) =>
            Boolean(customPretestAnswers[qi]),
          )
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
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goBack = () => {
    if (step === 0 && flow !== null) {
      setFlow(null);
      setStep(0);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const toggleSubject = (id: string) => {
    setFocusedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleChooseNational = () => {
    setFlow("national");
    setStep(0);
  };

  const handleChooseCustom = () => {
    setFlow("custom");
    setStep(0);
  };

  const handleCustomGenerate = async () => {
    if (customName.trim().length < 2) {
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
      if (!result.ok) {
        setError(result.error ?? "Gagal generate. Coba lagi.");
        setIsGenerating(false);
        return;
      }
      setGeneratedQuestions(result.questions);
      setGeneratedSubjectData(result.subjectData);
      setIsGenerating(false);
    } catch (err) {
      console.error("[ONBOARDING_SERVICE] generateCustomSubjectPretest error:", err);
      setError("Gagal terhubung ke AI. Coba lagi.");
      setIsGenerating(false);
    }
  };

  const handleCustomSubjectCreated = (result: GeneratedPretestResult) => {
    setGeneratedQuestions(result.questions);
    setGeneratedSubjectData(result.subjectData);
    setCustomName(result.subjectData.name);
    setCustomPretestAnswers({});
  };

  const handleNationalSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
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
          resolvedAnswer.trim().toUpperCase() === correct.trim().toUpperCase(),
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
    router.replace("/dashboard");
  };

  const handleCustomSubmit = async () => {
    if (submitting) return;
    if (!generatedQuestions || !generatedSubjectData) return;
    setSubmitting(true);
    setError(null);

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

    if (!result.ok) {
      setError(result.message ?? "Gagal menyimpan. Coba lagi, ya.");
      setSubmitting(false);
      return;
    }
    await update();
    router.replace("/dashboard");
  };

  const handleSubmit = flow === "custom" ? handleCustomSubmit : handleNationalSubmit;

  const stepTitle = () => {
    const currentStepKey = steps[step]?.key;
    if (currentStepKey === "welcome") {
      return (
        <>
          Hai! Aku <span className="text-gradient-warm">Spark</span> ✨
        </>
      );
    }
    if (flow === "custom") {
      if (currentStepKey === "custom-subject") return "Bikin mapel kustom";
      if (currentStepKey === "custom-pretest") return "Cek level awal kamu";
    }
    if (currentStepKey === "profile") return "Tentang kamu";
    if (currentStepKey === "subjects") return "Mapel fokus kamu";
    if (currentStepKey === "style") return "Gaya belajar & reminder";
    if (currentStepKey === "pretest") return "Cek level awal kamu";
    return "";
  };

  const stepDescription = () => {
    const currentStepKey = steps[step]?.key;
    if (currentStepKey === "welcome") {
      return "Isi beberapa hal ini, biar aku bisa nemenin kamu dengan pas.";
    }
    if (flow === "custom") {
      if (currentStepKey === "custom-subject") {
        return "Nama mapel yang kamu mau, terus Spark bakal generate outline + soal pretest.";
      }
      if (currentStepKey === "custom-pretest") {
        return "Soal ini dibuat khusus buat kamu sama AI. Jawab aja sebisanya.";
      }
    }
    if (currentStepKey === "profile") {
      return "Biar aku nyesuaiin penjelasan sama level dan kurikulum sekolahmu.";
    }
    if (currentStepKey === "subjects") {
      return "Pilih minimal 1. Bisa lebih dari satu, biar Spark bisa fokus ngebantu.";
    }
    if (currentStepKey === "style") {
      return "Gaya belajar + reminder (opsional). Isi yang penting dulu.";
    }
    if (currentStepKey === "pretest") {
      return "Soal pretest muncul sesuai mapel yang kamu pilih. Bisa di-skip, tapi kalo dijawab Spark bisa lebih nyesuaiin.";
    }
    return "";
  };

  React.useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  if (flow === null) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Halo, <span className="text-[var(--coral)]">{userName}</span> 👋
          </p>
          <h1 className="mt-1 font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
            {stepTitle()}
          </h1>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
            {stepDescription()}
          </p>
        </header>
        <WelcomeStep
          userName={userName}
          onChooseNational={handleChooseNational}
          onChooseCustom={handleChooseCustom}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Halo, <span className="text-[var(--coral)]">{userName}</span> 👋
        </p>
        <h1 className="mt-1 font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
          {stepTitle()}
        </h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13px]">
          {stepDescription()}
        </p>
      </header>

      {showStepIndicator && (
        <StepIndicator steps={steps as unknown as Step[]} current={step} />
      )}

      <div key={`step-${flow}-${step}`} className="mt-6 flex-1 animate-step-fade-in">
        {flow === "national" && step === 0 && (
          <WelcomeStep
            userName={userName}
            onChooseNational={handleChooseNational}
            onChooseCustom={handleChooseCustom}
          />
        )}
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
        {flow === "national" && step === 4 && (
          <PretestStep
            questions={visiblePretest}
            answers={pretestAnswers}
            onAnswer={(qid, letter) =>
              setPretestAnswers((p) => ({ ...p, [qid]: letter }))
            }
            selectedCount={focusedSubjects.length}
          />
        )}
        {flow === "custom" && step === 0 && (
          <WelcomeStep
            userName={userName}
            onChooseNational={handleChooseNational}
            onChooseCustom={handleChooseCustom}
          />
        )}
        {flow === "custom" && step === 1 && (
          <CustomSubjectStep
            name={customName}
            context={customContext}
            educationLevel={educationLevel}
            grade={grade}
            onNameChange={setCustomName}
            onContextChange={setCustomContext}
            onEducationLevelChange={setEducationLevel}
            onGradeChange={setGrade}
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

      {error && flow !== "custom" && (
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
          disabled={submitting || isGenerating}
          className="rounded-2xl"
        >
          <ArrowLeft size={15} />
          Kembali
        </Button>
        {step < steps.length - 1 ? (
          <Button
            type="button"
            size="lg"
            onClick={flow === "custom" && step === 1 && !isGenerating ? handleCustomGenerate : goNext}
            disabled={!isStepValid(step) || isGenerating}
            className="rounded-2xl bg-[var(--coral)] px-5 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90 hover:shadow-[0_10px_24px_rgba(225,29,72,0.5)]"
          >
            {flow === "custom" && step === 1 ? (
              isGenerating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generate...
                </>
              ) : generatedQuestions ? (
                <>
                  Lanjut
                  <ArrowRight size={15} strokeWidth={2.5} />
                </>
              ) : (
                <>
                  <Sprout size={15} strokeWidth={2.5} />
                  Generate + Test
                </>
              )
            ) : (
              <>
                Lanjut
                <ArrowRight size={15} strokeWidth={2.5} />
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={!isStepValid(step) || submitting || isGenerating}
            className={cn(
              "rounded-2xl px-5 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)] transition-all",
              submitting
                ? "bg-[var(--coral)]/70"
                : "bg-[var(--coral)] hover:bg-[var(--coral)]/90 hover:shadow-[0_10px_32px_rgba(225,29,72,0.5)]",
            )}
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Menyiapkan dashboard kamu...
              </>
            ) : (
              <>
                <Sprout size={15} strokeWidth={2.5} />
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
