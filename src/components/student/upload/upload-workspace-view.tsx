"use client";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileText,
  GraduationCap,
  ListChecks,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { DocumentPretestView } from "@/components/student/document-pretest-view";
import { DocumentMarkdownText } from "@/components/shared/document-markdown";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocInfo = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  pageCount: number | null;
  chunkCount: number;
  createdAt: string;
};

type Summary = {
  title: string;
  summary: string;
  keyPoints: string[];
  hasHomework: boolean;
  homeworkTopic?: string;
};

type MaterialItem = {
  id: string;
  title: string;
  difficulty: string;
  estimatedMinutes: number;
  createdAt: string;
};

type QuizItem = {
  id: string;
  title: string;
  questionsCount: number;
  attemptsCount: number;
  lastScore: number | null;
  createdAt: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UploadWorkspaceView({
  document,
  summary,
  materials,
  quizzes,
}: {
  document: DocInfo;
  summary: Summary | null;
  materials: MaterialItem[];
  quizzes: QuizItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") ?? "summary") as
    | "summary"
    | "materials"
    | "quizzes";
  const [isGenerating, setIsGenerating] = React.useState<
    null | "summary" | "material" | "quiz"
  >(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pretestQuestions, setPretestQuestions] = React.useState<any[] | null>(null);
  const [pretestLoading, setPretestLoading] = React.useState(false);

  const setTab = (next: "summary" | "materials" | "quizzes") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.push(`/upload/${document.id}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleGenerateSummary = async () => {
    setIsGenerating("summary");
    setError(null);
    try {
      const { getDocumentSummary } = await import("@/server/actions/documents");
      const result = await getDocumentSummary(document.id, {
        forceRegenerate: true,
      });
      if (!result.ok) {
        setError(result.error);
        setIsGenerating(null);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal.");
      setIsGenerating(null);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleStartPretest = async () => {
    setPretestLoading(true);
    try {
      const { generateDocumentPretest } = await import("@/server/actions/document-pretest");
      const result = await generateDocumentPretest(document.id);
      if (result.ok) {
        setPretestQuestions(result.questions);
      } else {
        alert(result.error || "Gagal generate pretest");
      }
    } finally {
      setPretestLoading(false);
    }
  };

  const handleSubmitPretest = async (answers: any[]) => {
    const { submitDocumentPretest } = await import("@/server/actions/document-pretest");
    const result = await submitDocumentPretest({ documentId: document.id, answers });
    if (result.ok) {
      alert(`Pretest selesai! ${result.stats.correct}/${result.stats.total} benar`);
      setPretestQuestions(null);
      router.refresh();
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <Reveal>
        <header className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.15 175 / 0.5), transparent 70%)",
            }}
          />
          <div className="relative flex flex-col gap-3">
            <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <Link
                href="/upload"
                className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
              >
                <ArrowLeft size={11} />
                Upload
              </Link>
              <ChevronRight size={11} />
              <span className="truncate text-foreground">
                {document.originalName}
              </span>
            </nav>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--teal)]/10 text-[var(--teal)]">
                  <FileText size={18} />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                    <Sparkles size={10} strokeWidth={2.5} />
                    Workspace AI
                  </span>
                  <h1 className="mt-1 font-heading text-[22px] font-bold leading-tight tracking-tight sm:text-[26px]">
                    {summary?.title ?? document.originalName}
                  </h1>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                    {document.mimeType}
                    {document.pageCount ? ` · ${document.pageCount} hal` : ""} ·{" "}
                    {formatBytes(document.size)} ·{" "}
                    {document.chunkCount > 0
                      ? `${document.chunkCount} chunks indexed`
                      : "Indexing…"}
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link href="/upload">
                  <ArrowLeft size={13} />
                  Semua dokumen
                </Link>
              </Button>
            </div>
          </div>
        </header>
      </Reveal>

      <Reveal delay={60}>
        <div className="flex gap-1 border-b border-border/40 text-[12.5px] font-semibold overflow-x-auto">
          <TabButton
            active={tab === "summary"}
            onClick={() => setTab("summary")}
            icon={<Sparkles size={12} />}
            color="purple"
            label="Ringkasan"
          />
          <TabButton
            active={tab === "materials"}
            onClick={() => setTab("materials")}
            icon={<BookOpen size={12} />}
            color="teal"
            label={`Materi Teori (${materials.length})`}
          />
          <TabButton
            active={tab === "quizzes"}
            onClick={() => setTab("quizzes")}
            icon={<GraduationCap size={12} />}
            color="coral"
            label={`Latihan Soal (${quizzes.length})`}
          />
        </div>
      </Reveal>

      {error && (
        <div className="rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      <Reveal delay={120}>
        <div className="min-h-[300px]">
          {tab === "summary" && (
            <SummaryTab
              documentId={document.id}
              summary={summary}
              isGenerating={isGenerating === "summary"}
              onGenerate={handleGenerateSummary}
            />
          )}
          {tab === "materials" && (
            <MaterialsTab documentId={document.id} materials={materials} />
          )}
          {tab === "quizzes" && (
            <QuizzesTab documentId={document.id} quizzes={quizzes} />
          )}
        </div>
      </Reveal>

      {tab === "summary" && !pretestQuestions && (
        <div className="flex justify-center">
          <Button onClick={handleStartPretest} disabled={pretestLoading} className="rounded-full bg-amber-500 text-white">
            {pretestLoading ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
            Mulai Pretest
          </Button>
        </div>
      )}

      {pretestQuestions && (
        <DocumentPretestView questions={pretestQuestions} onSubmit={handleSubmitPretest} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  color,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  color: "purple" | "teal" | "coral";
  label: string;
}) {
  const colorMap = {
    purple: "border-[var(--purple)] text-[var(--purple)]",
    teal: "border-[var(--teal)] text-[var(--teal)]",
    coral: "border-[var(--coral)] text-[var(--coral)]",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 transition-colors",
        active
          ? colorMap[color]
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function SummaryTab({
  documentId,
  summary,
  isGenerating,
  onGenerate,
}: {
  documentId: string;
  summary: Summary | null;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  if (!summary) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 p-6 text-center">
        <Sparkles size={28} className="mx-auto text-muted-foreground/45" />
        <p className="mt-2 text-[13px] text-muted-foreground">
          Belum ada ringkasan. Spark bisa baca dokumen ini dan bikin ringkasan
          otomatis.
        </p>
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={isGenerating}
          className="mt-4 rounded-full bg-[var(--purple)] text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 size={13} className="mr-1.5 animate-spin" />
              Lagi mikir...
            </>
          ) : (
            <>
              <Sparkles size={13} className="mr-1.5" />
              Bikin ringkasan
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-[13px] leading-relaxed">
      <div className="rounded-2xl border border-border/40 bg-card/85 p-5">
        <DocumentMarkdownText text={summary.summary} />
      </div>
      <div>
        <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
          Poin kunci
        </h3>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {summary.keyPoints.map((kp) => (
            <li
              key={kp}
              className="flex items-start gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-[12.5px]"
            >
              <CheckCircle2
                size={13}
                className="mt-0.5 shrink-0 text-[var(--teal)]"
              />
              <span>{kp}</span>
            </li>
          ))}
        </ul>
      </div>
      {summary.hasHomework && (
        <div className="rounded-2xl border border-amber-300/50 bg-amber-50/80 p-3 text-[12.5px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-center gap-1.5 font-bold">
            <ListChecks size={13} />
            Terdeteksi PR/tugas
          </div>
          <p className="mt-1">
            Dokumen ini sepertinya berisi soal/latihan. Topiknya kira-kira{" "}
            <strong>{summary.homeworkTopic ?? "umum"}</strong>. Spark bisa
            buatkan penjelasan materi yang relevan secara otomatis.
          </p>
          <Button
            asChild
            size="sm"
            className="mt-3 rounded-full bg-[var(--teal)] text-white"
          >
            <Link href={`/upload/${documentId}/material/new`}>
              <BookOpen size={12} className="mr-1" />
              Bikin materi belajar
            </Link>
          </Button>
        </div>
      )}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={onGenerate}
          disabled={isGenerating}
          className="rounded-full"
        >
          <Sparkles size={12} className="mr-1" />
          {isGenerating ? "Lagi bikin ulang..." : "Bikin ulang ringkasan"}
        </Button>
      </div>
    </div>
  );
}

function MaterialsTab({
  documentId,
  materials,
}: {
  documentId: string;
  materials: MaterialItem[];
}) {
  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <BookOpen size={28} className="text-muted-foreground/45" />
        <p className="mt-2 text-[13px] text-muted-foreground">
          Belum ada materi pembelajaran teori untuk dokumen ini.
        </p>
        <Button
          asChild
          size="sm"
          className="mt-4 rounded-full bg-[var(--teal)] text-white"
        >
          <Link href={`/upload/${documentId}/material/new`}>
            <BookOpen size={12} className="mr-1" />
            Bikin materi pertama
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {materials.map((m) => (
        <li key={m.id}>
          <Link
            href={`/upload/${documentId}/material/${m.id}`}
            className="group/mat flex h-full items-start gap-3 rounded-2xl border border-border/40 bg-card/85 p-4 shadow-[0_6px_18px_rgba(80,20,50,0.06)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(80,20,50,0.12)]"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--teal)]/10 text-[var(--teal)]">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-heading text-[13.5px] font-bold">
                {m.title}
              </h4>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                Level: {m.difficulty} · ~{m.estimatedMinutes} m ·{" "}
                {formatDate(m.createdAt)}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--teal)] opacity-0 transition-opacity group-hover/mat:opacity-100">
                Baca <ChevronRight size={12} />
              </div>
            </div>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={`/upload/${documentId}/material/new`}
          className="flex h-full min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 bg-background/40 p-4 text-center text-[12px] font-semibold text-muted-foreground transition-all hover:border-[var(--teal)]/40 hover:bg-[var(--teal)]/5 hover:text-[var(--teal)]"
        >
          <BookOpen size={18} />
          Bikin materi baru
        </Link>
      </li>
    </ul>
  );
}

function QuizzesTab({
  documentId,
  quizzes,
}: {
  documentId: string;
  quizzes: QuizItem[];
}) {
  if (quizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 p-8 text-center">
        <GraduationCap size={28} className="text-muted-foreground/45" />
        <p className="mt-2 text-[13px] text-muted-foreground">
          Belum ada latihan kuis untuk dokumen ini.
        </p>
        <Button
          asChild
          size="sm"
          className="mt-4 rounded-full bg-[var(--coral)] text-white"
        >
          <Link href={`/upload/${documentId}/quiz/new`}>
            <GraduationCap size={12} className="mr-1" />
            Bikin latihan pertama
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2">
      {quizzes.map((q) => (
        <li key={q.id}>
          <Link
            href={`/upload/${documentId}/quiz/${q.id}`}
            className="group/quiz flex h-full items-start gap-3 rounded-2xl border border-border/40 bg-card/85 p-4 shadow-[0_6px_18px_rgba(80,20,50,0.06)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(80,20,50,0.12)]"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--coral)]/10 text-[var(--coral)]">
              <CircleHelp size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-heading text-[13.5px] font-bold">
                {q.title}
              </h4>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                {q.questionsCount} Soal · {q.attemptsCount}x dikerjakan · Skor:{" "}
                {q.lastScore !== null
                  ? `${q.lastScore}/${q.questionsCount}`
                  : "Belum"}{" "}
                · {formatDate(q.createdAt)}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--coral)] opacity-0 transition-opacity group-hover/quiz:opacity-100">
                {q.attemptsCount > 0 ? "Mulai ulang" : "Kerjakan"}{" "}
                <ChevronRight size={12} />
              </div>
            </div>
          </Link>
        </li>
      ))}
      <li>
        <Link
          href={`/upload/${documentId}/quiz/new`}
          className="flex h-full min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/50 bg-background/40 p-4 text-center text-[12px] font-semibold text-muted-foreground transition-all hover:border-[var(--coral)]/40 hover:bg-[var(--coral)]/5 hover:text-[var(--coral)]"
        >
          <GraduationCap size={18} />
          Bikin latihan baru
        </Link>
      </li>
    </ul>
  );
}
