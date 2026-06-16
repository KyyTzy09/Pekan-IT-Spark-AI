"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  MessageCircle,
  Share2,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DocumentMarkdownText } from "@/components/shared/document-markdown";
import { Reveal } from "@/components/shared/reveal";
import { useBadgeCelebration } from "@/components/student/badge-unlock-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMaterialDetail } from "@/server/actions/challenges";
import { startNewChat } from "@/server/actions/chat";
import {
  appendQuestionsToDocumentQuizAction,
  type DocumentListItem,
  deleteDocument,
  generateDocumentMaterialAction,
  generateDocumentQuizAction,
  getDocumentHistoryAction,
  getDocumentQuizAction,
  getDocumentSummary,
  listDocuments,
  listOwnedChats,
  shareDocumentToChatSession,
  submitDocumentQuizAttemptAction,
  uploadDocument,
} from "@/server/actions/documents";

const MAX_BYTES = 10 * 1024 * 1024;

type UploadStatus =
  | { kind: "idle" }
  | { kind: "validating"; fileName: string }
  | { kind: "uploading"; fileName: string; progress: number }
  | { kind: "processing"; fileName: string }
  | { kind: "success"; fileName: string }
  | { kind: "error"; fileName: string; message: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UploadView({
  initialDocuments,
}: {
  initialDocuments: DocumentListItem[];
}) {
  const router = useRouter();
  const { showBadges } = useBadgeCelebration();
  const [documents, setDocuments] =
    React.useState<DocumentListItem[]>(initialDocuments);
  const [status, setStatus] = React.useState<UploadStatus>({ kind: "idle" });
  const [dragOver, setDragOver] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);
  const [summaryFor, setSummaryFor] = React.useState<string | null>(null);
  const [summaryData, setSummaryData] = React.useState<{
    title: string;
    summary: string;
    keyPoints: string[];
    hasHomework: boolean;
    homeworkTopic?: string;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);
  const [quizFor, setQuizFor] = React.useState<string | null>(null);
  const [quizData, setQuizData] = React.useState<{
    id: string;
    title: string;
    questions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
      explanation: string;
    }>;
    attempts: Array<{
      answers: number[];
      score: number;
      completedAt: string;
    }>;
  } | null>(null);
  const [quizLoading, setQuizLoading] = React.useState(false);
  const [quizError, setQuizError] = React.useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = React.useState(0);
  const [shareFor, setShareFor] = React.useState<string | null>(null);
  const [chats, setChats] = React.useState<
    Array<{ id: string; title: string; subjectName: string | null }>
  >([]);
  const [chatsLoading, setChatsLoading] = React.useState(false);
  const [shareError, setShareError] = React.useState<string | null>(null);
  const [shareDone, setShareDone] = React.useState<string | null>(null);
  const [materialFor, setMaterialFor] = React.useState<string | null>(null);
  const [materialData, setMaterialData] = React.useState<{
    id: string;
    title: string;
    content: string;
    keyPoints: string[];
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
    estimatedMinutes: number;
  } | null>(null);
  const [materialLoading, setMaterialLoading] = React.useState(false);
  const [materialError, setMaterialError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const refresh = React.useCallback(async () => {
    const result = await listDocuments();
    if (result.ok) setDocuments(result.documents);
  }, []);

  const handleFile = React.useCallback(
    async (file: File) => {
      setStatus({ kind: "validating", fileName: file.name });
      const lower = file.name.toLowerCase();
      const okType =
        file.type === "application/pdf" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        lower.endsWith(".pdf") ||
        lower.endsWith(".docx");
      if (!okType) {
        setStatus({
          kind: "error",
          fileName: file.name,
          message: "Format gak didukung. Pilih PDF atau DOCX ya.",
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        setStatus({
          kind: "error",
          fileName: file.name,
          message: `File ${formatBytes(file.size)} kebesaran. Maksimal 10 MB.`,
        });
        return;
      }
      if (file.size === 0) {
        setStatus({
          kind: "error",
          fileName: file.name,
          message: "File kosong.",
        });
        return;
      }

      setStatus({ kind: "uploading", fileName: file.name, progress: 30 });
      setStatus({ kind: "processing", fileName: file.name });
      const result = await uploadDocument({ file });
      if (!result.ok) {
        setStatus({
          kind: "error",
          fileName: file.name,
          message: result.error,
        });
        return;
      }
      setStatus({ kind: "success", fileName: file.name });
      await refresh();
      window.setTimeout(() => {
        setStatus((prev) =>
          prev.kind === "success" ? { kind: "idle" } : prev,
        );
      }, 2400);
    },
    [refresh],
  );

  const onDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  const onDelete = async (id: string) => {
    if (pendingDelete) return;
    setPendingDelete(id);
    const res = await deleteDocument(id);
    setPendingDelete(null);
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } else {
      setStatus({
        kind: "error",
        fileName: "dokumen",
        message: res.error,
      });
    }
  };

  const onAskSpark = async (doc: DocumentListItem) => {
    const firstMessage = `Halo Spark, aku mau diskusi soal "${doc.originalName}". Bantu aku paham materinya ya.`;
    try {
      const result = await startNewChat({
        firstMessage,
        documentId: doc.id,
      });
      router.push(`/chat/${result.sessionId}`);
    } catch (err) {
      setStatus({
        kind: "error",
        fileName: doc.originalName,
        message: err instanceof Error ? err.message : "Gagal mulai chat.",
      });
    }
  };

  const onShowSummary = async (doc: DocumentListItem, force: boolean) => {
    setSummaryFor(doc.id);
    setSummaryLoading(true);
    setSummaryError(null);
    if (!force && doc.hasSummary) {
      setSummaryLoading(false);
    }
    try {
      const result = await getDocumentSummary(doc.id, {
        forceRegenerate: force,
      });
      if (!result.ok) {
        setSummaryError(result.error);
        setSummaryLoading(false);
        return;
      }
      setSummaryData(result.summary);
      setSummaryLoading(false);
      if (force) await refresh();
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : "Gagal.");
      setSummaryLoading(false);
    }
  };

  const closeSummary = () => {
    setSummaryFor(null);
    setSummaryData(null);
    setSummaryError(null);
  };

  const onShowQuiz = async (doc: DocumentListItem, quizId?: string) => {
    setQuizFor(doc.id);
    setQuizLoading(true);
    setQuizError(null);
    setQuizData(null);
    try {
      const result = quizId
        ? await getDocumentQuizAction(quizId)
        : await generateDocumentQuizAction(doc.id, 5);
      if (!result.ok) {
        setQuizError(result.error);
        setQuizLoading(false);
        return;
      }
      setQuizData(result.quiz);
      setQuizLoading(false);
      if (!quizId) {
        setHistoryVersion((v) => v + 1);
      }
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "Gagal.");
      setQuizLoading(false);
    }
  };

  const closeQuiz = () => {
    setQuizFor(null);
    setQuizData(null);
    setQuizError(null);
  };

  const onSubmitAttempt = async (
    quizId: string,
    answers: number[],
    score: number,
  ) => {
    const res = await submitDocumentQuizAttemptAction(quizId, answers, score);
    if (res.ok) {
      setQuizData((prev) =>
        prev ? { ...prev, attempts: res.attempts } : null,
      );
      setHistoryVersion((v) => v + 1);
      if (res.unlockedBadges?.length) {
        showBadges(res.unlockedBadges);
      }
    }
  };

  const onAppendQuestions = async (quizId: string, count: number) => {
    const res = await appendQuestionsToDocumentQuizAction(quizId, count);
    if (res.ok) {
      setQuizData(res.quiz);
      setHistoryVersion((v) => v + 1);
    }
  };

  const onShowMaterial = async (
    doc: DocumentListItem,
    materialId?: string,
    enhance = false,
  ) => {
    setMaterialFor(doc.id);
    setMaterialLoading(true);
    setMaterialError(null);
    setMaterialData(null);
    try {
      let result:
        | {
            ok: true;
            material: {
              id: string;
              title: string;
              content: string;
              keyPoints: string[];
              difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
              estimatedMinutes: number;
            };
          }
        | { ok: false; error: string; material?: undefined };
      if (materialId && !enhance) {
        const detail = await getMaterialDetail(materialId);
        if (!detail) {
          throw new Error("Materi tidak ditemukan.");
        }
        result = {
          ok: true,
          material: {
            id: detail.id,
            title: detail.title,
            content: detail.content,
            keyPoints: detail.keyPoints as string[],
            difficulty: detail.difficulty as
              | "EASY"
              | "MEDIUM"
              | "HARD"
              | "ADVANCED",
            estimatedMinutes: detail.estimatedMinutes,
          },
        };
      } else {
        result = await generateDocumentMaterialAction(doc.id, enhance);
      }

      if (!result.ok) {
        setMaterialError(result.error ?? "Gagal memproses materi.");
        setMaterialLoading(false);
        return;
      }
      setMaterialData(result.material);
      setMaterialLoading(false);
      setHistoryVersion((v) => v + 1);
    } catch (err) {
      setMaterialError(err instanceof Error ? err.message : "Gagal.");
      setMaterialLoading(false);
    }
  };

  const closeMaterial = () => {
    setMaterialFor(null);
    setMaterialData(null);
    setMaterialError(null);
  };

  const onOpenShare = async (doc: DocumentListItem) => {
    setShareFor(doc.id);
    setChatsLoading(true);
    setShareError(null);
    setShareDone(null);
    try {
      const result = await listOwnedChats(20);
      if (result.ok) setChats(result.sessions);
      else setChats([]);
    } finally {
      setChatsLoading(false);
    }
  };

  const closeShare = () => {
    setShareFor(null);
    setShareError(null);
  };

  const onConfirmShare = async (chatSessionId: string) => {
    if (!shareFor) return;
    setShareError(null);
    const result = await shareDocumentToChatSession(shareFor, chatSessionId);
    if (!result.ok) {
      setShareError(result.error);
      return;
    }
    setShareDone(chatSessionId);
    await refresh();
    window.setTimeout(() => {
      setShareFor(null);
      setShareDone(null);
    }, 1500);
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
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                <UploadCloud size={10} strokeWidth={2.5} />
                Upload materi
              </span>
              <h1 className="mt-2 font-heading text-[24px] font-bold leading-tight tracking-tight sm:text-[28px]">
                Asistensi materi{" "}
                <span className="text-gradient-cool">Spark</span>
              </h1>
              <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground sm:text-[13.5px]">
                Drop PDF atau DOCX dari guru kamu. Spark bakal baca teksnya dan
                siapin rangkuman + latihan otomatis.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              <Link href="/dashboard">
                <ArrowLeft size={13} />
                Beranda
              </Link>
            </Button>
          </div>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "relative overflow-hidden rounded-3xl border-2 border-dashed bg-card/70 p-6 text-center transition-all sm:p-10",
            dragOver
              ? "border-[var(--teal)] bg-[var(--teal)]/5"
              : "border-border/60 hover:border-[var(--teal)]/60 hover:bg-[var(--teal)]/5",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-12 -top-12 size-40 rounded-full bg-[var(--teal)]/15 blur-3xl"
          />
          <div className="relative">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--teal)]/12 text-[var(--teal)]">
              <UploadCloud size={22} strokeWidth={2.2} />
            </div>
            <h2 className="mt-4 font-heading text-[18px] font-bold leading-tight">
              Drop file di sini
            </h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              atau klik tombol di bawah buat pilih dari device
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
                PDF
              </span>
              <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
                DOCX
              </span>
              <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
                Maks 10 MB
              </span>
              <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1">
                Maks 50 halaman
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={onPick}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={
                status.kind === "uploading" || status.kind === "processing"
              }
              className="mt-5 rounded-full bg-[var(--teal)] px-5 text-white shadow-[0_8px_22px_rgba(15,118,110,0.35)] hover:bg-[var(--teal)]/90"
            >
              <UploadCloud size={14} className="mr-1.5" />
              Pilih file
            </Button>
          </div>
          <UploadStatusBar status={status} />
        </div>
      </Reveal>

      <Reveal delay={120}>
        <section>
          <header className="mb-3 flex items-center justify-between gap-2 px-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Dokumen kamu
              </p>
              <h2 className="mt-0.5 font-heading text-[16px] font-bold leading-tight">
                {documents.length} materi terunggah
              </h2>
            </div>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link href="/chat">
                <Sparkles size={13} />
                Tanya Spark
              </Link>
            </Button>
          </header>

          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-6 text-center text-[12.5px] text-muted-foreground">
              Belum ada dokumen. Upload dulu, nanti bakal muncul di sini dan
              bisa ditanyain lewat chat.
            </div>
          ) : (
            <ul className="grid gap-2.5">
              <AnimatePresence initial={false}>
                {documents.map((doc) => (
                  <motion.li
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="group/doc flex items-start gap-3 rounded-2xl border border-border/40 bg-card/80 p-3.5 shadow-[0_6px_18px_rgba(80,20,50,0.06)] backdrop-blur-md"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--teal)]/10 text-[var(--teal)]">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="truncate font-heading text-[13.5px] font-bold">
                          {doc.originalName}
                        </h3>
                        <span className="rounded-full bg-background/70 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">
                          {doc.mimeType}
                          {doc.pageCount ? ` · ${doc.pageCount} hal` : ""}
                        </span>
                        {doc.chunkCount > 0 ? (
                          <span
                            className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300"
                            title="Dokumen sudah di-index untuk RAG (pencarian berbasis isi)"
                          >
                            {doc.chunkCount} chunks indexed
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                            Indexing…
                          </span>
                        )}
                        {doc.hasSummary && (
                          <span className="rounded-full bg-[var(--purple)]/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[var(--purple)]">
                            Ada ringkasan
                          </span>
                        )}
                        <span className="text-[10.5px] text-muted-foreground">
                          {formatBytes(doc.size)} · {formatDate(doc.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
                        {doc.contentPreview}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onAskSpark(doc)}
                          className="h-7 rounded-full px-2.5 text-[11px] text-[var(--coral)]"
                        >
                          <MessageCircle size={11} className="mr-1" />
                          Tanya Spark
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onShowSummary(doc, false)}
                          className="h-7 rounded-full px-2.5 text-[11px]"
                        >
                          <Sparkles size={11} className="mr-1" />
                          {doc.hasSummary
                            ? "Lihat ringkasan"
                            : "Buat ringkasan"}
                        </Button>
                        {doc.hasHomework ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onShowMaterial(doc)}
                            className="h-7 rounded-full px-2.5 text-[11px] text-[var(--teal)] font-semibold"
                          >
                            <BookOpen size={11} className="mr-1" />
                            Buat materi belajar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onShowQuiz(doc)}
                            className="h-7 rounded-full px-2.5 text-[11px]"
                          >
                            <GraduationCap size={11} className="mr-1" />
                            Buat latihan
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onOpenShare(doc)}
                          className="h-7 rounded-full px-2.5 text-[11px]"
                        >
                          <Share2 size={11} className="mr-1" />
                          Share ke chat
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(doc.id)}
                          disabled={pendingDelete === doc.id}
                          className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground hover:text-rose-600"
                        >
                          {pendingDelete === doc.id ? (
                            <Loader2 size={11} className="mr-1 animate-spin" />
                          ) : (
                            <Trash2 size={11} className="mr-1" />
                          )}
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      </Reveal>

      <Reveal delay={160}>
        <div className="rounded-2xl border border-border/40 bg-card/60 p-4 text-[12px] leading-relaxed text-muted-foreground backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <BookOpen size={13} className="text-[var(--teal)]" />
            Catatan privasi & kompatibilitas
          </div>
          <p className="mt-1">
            File yang kamu upload cuma dilihat oleh kamu dan Spark. Spark
            nyimpen teks hasil ekstrak (bukan file aslinya) buat bantu rangkum &
            jawab pertanyaan kamu. Semua event (upload, share, ringkasan,
            latihan) di-log buat audit (UU PDP).
          </p>
          <p className="mt-1.5">
            <strong>PDF scan/foto:</strong> sementara ini belum support OCR
            otomatis (akan ditambah di 5.4 advanced). Sementara itu, minta file
            PDF yg searchable dari guru, atau convert ke DOCX dulu.
          </p>
          <p className="mt-1.5">
            <strong>Rumus & tabel:</strong> rumus LaTeX-style ($...$ / $$...$$)
            otomatis ke-render via KaTeX, tabel otomatis ke-detect & format
            Markdown. <strong>Wajib edukasi:</strong> dokumen untuk belajar saja
            — konten di luar kurikulum akan ditolak otomatis.
          </p>
        </div>
      </Reveal>

      <SummaryModal
        open={summaryFor !== null}
        loading={summaryLoading}
        data={summaryData}
        error={summaryError}
        docName={documents.find((d) => d.id === summaryFor)?.originalName}
        docId={summaryFor}
        onClose={closeSummary}
        onRegenerate={() => {
          const doc = documents.find((d) => d.id === summaryFor);
          if (doc) onShowSummary(doc, true);
        }}
        onShowQuiz={(quizId) => {
          const doc = documents.find((d) => d.id === summaryFor);
          if (doc) onShowQuiz(doc, quizId);
        }}
        onShowMaterial={(materialId, enhance) => {
          const doc = documents.find((d) => d.id === summaryFor);
          if (doc) onShowMaterial(doc, materialId, enhance);
        }}
        historyVersion={historyVersion}
        isHomework={
          documents.find((d) => d.id === summaryFor)?.hasHomework ?? false
        }
      />

      <QuizModal
        open={quizFor !== null}
        loading={quizLoading}
        data={quizData}
        error={quizError}
        docName={documents.find((d) => d.id === quizFor)?.originalName}
        onClose={closeQuiz}
        onAppendQuestions={async (count) => {
          if (quizData?.id) await onAppendQuestions(quizData.id, count);
        }}
        onSubmitAttempt={async (answers, score) => {
          if (quizData?.id) await onSubmitAttempt(quizData.id, answers, score);
        }}
      />

      <MaterialModal
        open={materialFor !== null}
        loading={materialLoading}
        data={materialData}
        error={materialError}
        docName={documents.find((d) => d.id === materialFor)?.originalName}
        onClose={closeMaterial}
      />

      <ShareModal
        open={shareFor !== null}
        chats={chats}
        chatsLoading={chatsLoading}
        error={shareError}
        done={shareDone}
        docName={documents.find((d) => d.id === shareFor)?.originalName}
        onClose={closeShare}
        onConfirm={onConfirmShare}
      />
    </div>
  );
}

function UploadStatusBar({ status }: { status: UploadStatus }) {
  if (status.kind === "idle") return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5"
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left text-[12.5px]",
          status.kind === "error"
            ? "border-rose-300/50 bg-rose-50 text-rose-900 dark:bg-rose-500/10 dark:text-rose-200"
            : status.kind === "success"
              ? "border-emerald-300/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "border-border/40 bg-background/70 text-foreground",
        )}
      >
        {status.kind === "uploading" || status.kind === "processing" ? (
          <Loader2 size={14} className="animate-spin text-[var(--teal)]" />
        ) : status.kind === "success" ? (
          <CheckCircle2 size={14} className="text-emerald-600" />
        ) : status.kind === "error" ? (
          <Trash2 size={14} className="text-rose-600" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{status.fileName}</p>
          <p className="text-[11px] opacity-80">
            {status.kind === "validating" && "Cek format & ukuran..."}
            {status.kind === "uploading" &&
              `Upload ${status.progress}% — sabar ya, file besar butuh waktu`}
            {status.kind === "processing" &&
              "Selesai upload. Spark lagi baca & ekstrak teks..."}
            {status.kind === "success" && "Berhasil! Dokumen masuk ke daftar."}
            {status.kind === "error" && status.message}
          </p>
        </div>
        {status.kind === "uploading" && (
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-[var(--teal)] transition-all"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SummaryModal({
  open,
  loading,
  data,
  error,
  docName,
  docId,
  onClose,
  onRegenerate,
  onShowQuiz,
  onShowMaterial,
  historyVersion,
  isHomework,
}: {
  open: boolean;
  loading: boolean;
  data: {
    title: string;
    summary: string;
    keyPoints: string[];
    hasHomework: boolean;
    homeworkTopic?: string;
  } | null;
  error: string | null;
  docName: string | undefined;
  docId: string | null;
  onClose: () => void;
  onRegenerate: () => void;
  onShowQuiz: (quizId?: string) => void;
  onShowMaterial: (materialId?: string, enhance?: boolean) => void;
  historyVersion: number;
  isHomework: boolean;
}) {
  const [activeTab, setActiveTab] = React.useState<
    "summary" | "materials" | "quizzes"
  >("summary");
  const [history, setHistory] = React.useState<{
    quizzes: Array<{
      id: string;
      title: string;
      questionsCount: number;
      attemptsCount: number;
      lastScore: number | null;
      createdAt: string;
    }>;
    materials: Array<{
      id: string;
      title: string;
      difficulty: string;
      estimatedMinutes: number;
      createdAt: string;
    }>;
  } | null>(null);
  const [historyLoading, setHistoryLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && docId) {
      setHistoryLoading(true);
      getDocumentHistoryAction(docId).then((res) => {
        if (res.ok) {
          setHistory(res);
        }
        setHistoryLoading(false);
      });
    }
  }, [open, docId, historyVersion]);

  // Reset tab when modal opens
  React.useEffect(() => {
    if (open) {
      setActiveTab("summary");
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-t-3xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[var(--teal)]/15 blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-3 border-b border-border/40 p-5 pb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                  <Sparkles size={10} strokeWidth={2.5} />
                  Workspace AI
                </span>
                <h2 className="mt-2 font-heading text-[18px] font-bold leading-tight">
                  {data?.title ?? docName ?? "Workspace"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-background/60 text-muted-foreground hover:bg-background"
              >
                <X size={14} />
              </button>
            </div>

            {/* Workspace Tabs */}
            <div className="flex border-b border-border/40 px-5 text-[12px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("summary")}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition-colors",
                  activeTab === "summary"
                    ? "border-[var(--purple)] text-[var(--purple)]"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Sparkles size={12} />
                Ringkasan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("materials")}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition-colors",
                  activeTab === "materials"
                    ? "border-[var(--teal)] text-[var(--teal)]"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <BookOpen size={12} />
                Materi Teori ({history?.materials.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("quizzes")}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2.5 transition-colors",
                  activeTab === "quizzes"
                    ? "border-[var(--coral)] text-[var(--coral)]"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <GraduationCap size={12} />
                Latihan Soal ({history?.quizzes.length ?? 0})
              </button>
            </div>

            <div className="relative max-h-[60vh] min-h-[300px] overflow-y-auto p-5">
              {loading && activeTab === "summary" && (
                <div className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
                  <Loader2
                    size={12}
                    className="animate-spin text-[var(--purple)]"
                  />
                  Lagi mikir... Spark baca dokumen kamu terus nge-ekstrak poin
                  pentingnya.
                </div>
              )}
              {error && (
                <p className="rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}

              {/* Summary Tab */}
              {activeTab === "summary" && data && !loading && (
                <div className="space-y-4 text-[13px] leading-relaxed">
                  <p className="whitespace-pre-line text-foreground/90">
                    {data.summary}
                  </p>
                  <div>
                    <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
                      Poin kunci
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {data.keyPoints.map((kp) => (
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
                  {data.hasHomework && (
                    <div className="rounded-2xl border border-amber-300/50 bg-amber-50/80 p-3 text-[12.5px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold">
                        <ListChecks size={13} />
                        Terdeteksi PR/tugas
                      </div>
                      <p className="mt-1">
                        Dokumen ini sepertinya berisi soal/latihan. Topiknya
                        kira-kira{" "}
                        <strong>{data.homeworkTopic ?? "umum"}</strong>. Spark
                        bisa buatkan penjelasan materi yang relevan secara
                        otomatis.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Materials Tab */}
              {activeTab === "materials" && (
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
                      <Loader2
                        size={12}
                        className="animate-spin text-[var(--teal)]"
                      />
                      Memuat materi...
                    </div>
                  ) : history?.materials && history.materials.length > 0 ? (
                    <ul className="space-y-2.5">
                      {history.materials.map((m) => (
                        <li
                          key={m.id}
                          className="flex flex-col gap-2 rounded-2xl border border-border/40 bg-background/60 p-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-heading text-[13px] font-bold">
                                {m.title}
                              </h4>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">
                                Level: {m.difficulty} · Waktu Baca: ~
                                {m.estimatedMinutes} m · Dibuat pada{" "}
                                {formatDate(m.createdAt)}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  onClose();
                                  onShowMaterial(m.id, false);
                                }}
                                className="h-7 rounded-full text-[10.5px]"
                              >
                                Baca
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  onClose();
                                  onShowMaterial(m.id, true);
                                }}
                                className="h-7 rounded-full text-[10.5px] text-[var(--teal)]"
                              >
                                Tingkatkan (Lebih Berbobot)
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <BookOpen
                        size={28}
                        className="text-muted-foreground/45"
                      />
                      <p className="mt-2 text-[12.5px] text-muted-foreground">
                        Belum ada materi pembelajaran teori yang dibuat untuk
                        dokumen ini.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          onClose();
                          onShowMaterial(undefined, false);
                        }}
                        className="mt-4 rounded-full bg-[var(--teal)] text-white text-[11px]"
                      >
                        Bikin Materi Pertama
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Quizzes Tab */}
              {activeTab === "quizzes" && (
                <div className="space-y-4">
                  {historyLoading ? (
                    <div className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
                      <Loader2
                        size={12}
                        className="animate-spin text-[var(--coral)]"
                      />
                      Memuat kuis...
                    </div>
                  ) : history?.quizzes && history.quizzes.length > 0 ? (
                    <ul className="space-y-2.5">
                      {history.quizzes.map((q) => (
                        <li
                          key={q.id}
                          className="flex flex-col gap-2 rounded-2xl border border-border/40 bg-background/60 p-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-heading text-[13px] font-bold">
                                {q.title}
                              </h4>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">
                                {q.questionsCount} Soal · {q.attemptsCount}x
                                Dikerjakan · Skor Terakhir:{" "}
                                {q.lastScore !== null
                                  ? `${q.lastScore}/${q.questionsCount}`
                                  : "Belum dikerjakan"}{" "}
                                · Dibuat pada {formatDate(q.createdAt)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                onClose();
                                onShowQuiz(q.id);
                              }}
                              className="h-7 rounded-full bg-[var(--coral)] text-white text-[10.5px]"
                            >
                              {q.attemptsCount > 0 ? "Mulai Ulang" : "Kerjakan"}
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <GraduationCap
                        size={28}
                        className="text-muted-foreground/45"
                      />
                      <p className="mt-2 text-[12.5px] text-muted-foreground">
                        Belum ada latihan kuis yang dibuat untuk dokumen ini.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          onClose();
                          onShowQuiz(undefined);
                        }}
                        className="mt-4 rounded-full bg-[var(--coral)] text-white text-[11px]"
                      >
                        Bikin Latihan Pertama
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-border/40 p-4">
              {activeTab === "summary" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  disabled={loading}
                  className="rounded-full"
                >
                  <Sparkles size={12} className="mr-1" />
                  Bikin ulang
                </Button>
              )}
              <Button
                onClick={onClose}
                size="sm"
                className="rounded-full bg-[var(--purple)] text-white"
              >
                Tutup
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MaterialModal({
  open,
  loading,
  data,
  error,
  docName,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  data: {
    id: string;
    title: string;
    content: string;
    keyPoints: string[];
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
    estimatedMinutes: number;
  } | null;
  error: string | null;
  docName: string | undefined;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl overflow-hidden rounded-t-3xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[var(--teal)]/15 blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-3 border-b border-border/40 p-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                  <BookOpen size={10} strokeWidth={2.5} />
                  Materi Belajar AI
                </span>
                <h2 className="mt-2 font-heading text-[18px] font-bold leading-tight">
                  {data?.title ?? docName ?? "Materi Belajar"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-background/60 text-muted-foreground hover:bg-background"
              >
                <X size={14} />
              </button>
            </div>
            <div className="relative max-h-[70vh] overflow-y-auto p-5">
              {loading && (
                <div className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
                  <Loader2
                    size={14}
                    className="animate-spin text-[var(--teal)]"
                  />
                  Lagi merangkai materi... Spark lagi baca soal-soal dan bikin
                  materi belajar teori yang lengkap buat kamu.
                </div>
              )}
              {error && (
                <p className="rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}
              {data && !loading && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
                      Level: {data.difficulty}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground">
                      Waktu Baca: ~{data.estimatedMinutes} menit
                    </span>
                  </div>

                  <div>
                    <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
                      Poin Kunci
                    </h3>
                    <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {data.keyPoints.map((kp) => (
                        <li
                          key={kp}
                          className="flex items-start gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-[12px]"
                        >
                          <CheckCircle2
                            size={12}
                            className="mt-0.5 shrink-0 text-[var(--teal)]"
                          />
                          <span>{kp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-border/40 pt-4">
                    <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Isi Materi
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed">
                      <DocumentMarkdownText text={data.content} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-border/40 p-4">
              <Button
                onClick={onClose}
                size="sm"
                className="rounded-full bg-[var(--teal)] text-white"
              >
                Selesai Membaca
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuizModal({
  open,
  loading,
  data,
  error,
  docName,
  onClose,
  onAppendQuestions,
  onSubmitAttempt,
}: {
  open: boolean;
  loading: boolean;
  data: {
    id: string;
    title: string;
    questions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
      explanation: string;
    }>;
    attempts: Array<{
      answers: number[];
      score: number;
      completedAt: string;
    }>;
  } | null;
  error: string | null;
  docName: string | undefined;
  onClose: () => void;
  onAppendQuestions: (count: number) => Promise<void>;
  onSubmitAttempt: (answers: number[], score: number) => Promise<void>;
}) {
  const [selectedAnswers, setSelectedAnswers] = React.useState<
    Record<number, number>
  >({});
  const [showExplanations, setShowExplanations] = React.useState<
    Record<number, boolean>
  >({});
  const [isAppending, setIsAppending] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasSubmittedAttempt, setHasSubmittedAttempt] = React.useState(false);
  const [appendCount, setAppendCount] = React.useState(5);

  // Reset states when new quiz data is loaded or opened
  React.useEffect(() => {
    if (open) {
      setSelectedAnswers({});
      setShowExplanations({});
      setHasSubmittedAttempt(false);
      setIsAppending(false);
      setIsSubmitting(false);
    }
  }, [open, data?.id]);

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (selectedAnswers[questionIndex] !== undefined) return; // Locked once answered
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleToggleExplanation = (questionIndex: number) => {
    setShowExplanations((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  const handleAppend = async (count: number) => {
    setIsAppending(true);
    try {
      await onAppendQuestions(count);
    } catch (err) {
      console.error("Failed to append questions:", err);
    } finally {
      setIsAppending(false);
    }
  };

  const totalQuestions = data?.questions.length ?? 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const correctCount = data
    ? data.questions.filter((q, idx) => selectedAnswers[idx] === q.correctIndex)
        .length
    : 0;
  const calculatedScore =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const handleSaveAttempt = async () => {
    if (!data || isSubmitting || hasSubmittedAttempt) return;
    setIsSubmitting(true);
    try {
      const answersArray = data.questions.map(
        (_, idx) => selectedAnswers[idx] ?? -1,
      );
      await onSubmitAttempt(answersArray, calculatedScore);
      setHasSubmittedAttempt(true);
    } catch (err) {
      console.error("Failed to save attempt:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setShowExplanations({});
    setHasSubmittedAttempt(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl overflow-hidden rounded-t-3xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl flex flex-col max-h-[90vh] sm:max-h-[85vh]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-[var(--teal)]/15 blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-3 border-b border-border/40 p-5 shrink-0">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                  <GraduationCap size={10} strokeWidth={2.5} />
                  Latihan Interaktif
                </span>
                <h2 className="mt-2 font-heading text-[18px] font-bold leading-tight">
                  {docName ?? "Latihan dari dokumen"}
                </h2>
                {data && (
                  <p className="mt-1 text-[11.5px] text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{data.questions.length} Soal Pilihan Ganda</span>
                    {data.attempts && data.attempts.length > 0 && (
                      <>
                        <span className="inline-block size-1 rounded-full bg-border" />
                        <span>Riwayat: {data.attempts.length}x dikerjakan</span>
                        <span className="inline-block size-1 rounded-full bg-border" />
                        <span className="font-semibold text-teal-600 dark:text-teal-400">
                          Nilai tertinggi:{" "}
                          {Math.max(...data.attempts.map((a) => a.score))}/100
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-background/60 text-muted-foreground hover:bg-background"
              >
                <X size={14} />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto p-5 space-y-6">
              {loading && (
                <div className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground py-8 justify-center">
                  <Loader2
                    size={18}
                    className="animate-spin text-[var(--teal)]"
                  />
                  <span>Menyiapkan soal pilihan ganda...</span>
                </div>
              )}
              {error && (
                <p className="rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}
              {data && !loading && (
                <div className="space-y-6">
                  <ol className="space-y-6">
                    {data.questions.map((q, i) => {
                      const selected = selectedAnswers[i];
                      const isAnswered = selected !== undefined;
                      const isCorrect =
                        isAnswered && selected === q.correctIndex;
                      const hasExplanationOpen = showExplanations[i] || false;

                      return (
                        <li
                          key={`${i}-${q.question.slice(0, 15)}`}
                          className="rounded-2xl border border-border/40 bg-background/60 p-4 space-y-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-[var(--teal)]/15 text-[11px] font-bold text-[var(--teal)]">
                              {i + 1}
                            </span>
                            <div className="flex-1 text-[13.5px] font-semibold leading-snug text-foreground">
                              <DocumentMarkdownText text={q.question} />
                            </div>
                            <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 self-start">
                              {q.difficulty}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2 mt-3 pl-8">
                            {q.options.map((opt, j) => {
                              const isSelectedOpt = selected === j;
                              const isCorrectOpt = q.correctIndex === j;

                              let btnStyle =
                                "border-border/60 bg-card hover:bg-accent/40 text-foreground/80";
                              if (isAnswered) {
                                if (isSelectedOpt) {
                                  btnStyle = isCorrect
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                                    : "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium";
                                } else if (isCorrectOpt) {
                                  btnStyle =
                                    "border-emerald-500/50 bg-emerald-500/5 text-emerald-800/80 dark:text-emerald-400/80 font-medium";
                                } else {
                                  btnStyle =
                                    "border-border/30 bg-muted/20 text-muted-foreground/60 opacity-60";
                                }
                              }

                              return (
                                <button
                                  key={`${i}-${j}-${opt.slice(0, 10)}`}
                                  type="button"
                                  onClick={() => handleSelectOption(i, j)}
                                  disabled={isAnswered}
                                  className={cn(
                                    "flex items-center justify-between text-left rounded-xl border px-3.5 py-2 text-[12.5px] transition-all",
                                    btnStyle,
                                  )}
                                >
                                  <span>
                                    <span className="mr-2 font-bold opacity-60">
                                      {String.fromCharCode(65 + j)}.
                                    </span>
                                    {opt}
                                  </span>
                                  {isAnswered && isCorrectOpt && (
                                    <CheckCircle2
                                      size={12}
                                      className="text-emerald-600 shrink-0 ml-2"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {isAnswered && (
                            <div className="pl-8 pt-2">
                              {!isCorrect && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleExplanation(i)}
                                  className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[var(--teal)] hover:underline"
                                >
                                  <span>
                                    💡{" "}
                                    {hasExplanationOpen
                                      ? "Sembunyikan penjelasan"
                                      : "Jelaskan kenapa ini salah"}
                                  </span>
                                </button>
                              )}
                              {isCorrect && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleExplanation(i)}
                                  className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:underline"
                                >
                                  <span>Lihat Penjelasan</span>
                                </button>
                              )}

                              {hasExplanationOpen && (
                                <div className="mt-3 rounded-xl border border-teal-200/50 bg-teal-50/20 p-3.5 text-[12.5px] text-foreground/90 dark:border-teal-500/10 dark:bg-teal-500/5">
                                  <div className="flex items-center gap-1.5 font-bold text-[var(--teal)] mb-1">
                                    <CircleHelp size={13} />
                                    <span>Penjelasan Spark:</span>
                                  </div>
                                  <DocumentMarkdownText text={q.explanation} />
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>

                  {isAllAnswered && (
                    <div className="rounded-2xl border border-teal-200/60 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 p-5 dark:border-teal-500/15 dark:from-teal-500/5 dark:to-emerald-500/5 mt-8 space-y-4">
                      <div>
                        <h3 className="font-heading text-base font-bold text-foreground">
                          Hasil Latihan Kamu
                        </h3>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          Kamu menjawab benar <strong>{correctCount}</strong>{" "}
                          dari <strong>{totalQuestions}</strong> soal.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="text-3xl font-extrabold text-[var(--teal)]">
                          {calculatedScore}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            / 100
                          </span>
                        </div>
                        {!hasSubmittedAttempt ? (
                          <Button
                            onClick={handleSaveAttempt}
                            disabled={isSubmitting}
                            className="rounded-full bg-[var(--teal)] text-white font-medium hover:bg-[var(--teal)]/90"
                            size="sm"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2
                                  size={13}
                                  className="animate-spin mr-1.5"
                                />
                                Menyimpan...
                              </>
                            ) : (
                              "Simpan Riwayat Nilai"
                            )}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                            <CheckCircle2 size={14} />
                            Nilai Tersimpan!
                          </div>
                        )}
                        <Button
                          variant="outline"
                          onClick={handleRetry}
                          size="sm"
                          className="rounded-full text-[12px]"
                        >
                          Coba Lagi
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 border-t border-border/40 pt-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-muted/40 p-4 border border-border/20">
                      <div>
                        <h4 className="text-[13px] font-bold text-foreground">
                          Kurang puas dengan soal yang ada?
                        </h4>
                        <p className="text-[11.5px] text-muted-foreground">
                          Tambahkan soal baru secara dinamis untuk memperbanyak
                          variasi soal latihanmu.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <select
                          value={appendCount}
                          onChange={(e) =>
                            setAppendCount(Number(e.target.value))
                          }
                          disabled={isAppending}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                        >
                          <option value={3}>+3 Soal</option>
                          <option value={5}>+5 Soal</option>
                          <option value={7}>+7 Soal</option>
                          <option value={10}>+10 Soal</option>
                        </select>
                        <Button
                          onClick={() => handleAppend(appendCount)}
                          disabled={isAppending}
                          size="sm"
                          className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-medium text-[12px]"
                        >
                          {isAppending ? (
                            <>
                              <Loader2
                                size={12}
                                className="animate-spin mr-1.5"
                              />
                              Membuat...
                            </>
                          ) : (
                            "Tambah Soal"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-border/40 p-4 shrink-0 bg-background/50">
              <Button
                onClick={onClose}
                size="sm"
                className="rounded-full bg-border text-foreground hover:bg-border/80 border border-transparent"
              >
                Tutup
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShareModal({
  open,
  chats,
  chatsLoading,
  error,
  done,
  docName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  chats: Array<{ id: string; title: string; subjectName: string | null }>;
  chatsLoading: boolean;
  error: string | null;
  done: string | null;
  docName: string | undefined;
  onClose: () => void;
  onConfirm: (chatSessionId: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[var(--coral)]/15 blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-3 border-b border-border/40 p-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
                  <Share2 size={10} strokeWidth={2.5} />
                  Share ke chat
                </span>
                <h2 className="mt-2 font-heading text-[18px] font-bold leading-tight">
                  {docName ?? "Pilih chat"}
                </h2>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Spark bakal jawab berdasarkan dokumen ini di chat yang kamu
                  pilih.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="grid size-8 shrink-0 place-items-center rounded-full bg-background/60 text-muted-foreground hover:bg-background"
              >
                <X size={14} />
              </button>
            </div>
            <div className="relative max-h-[60vh] overflow-y-auto p-3">
              {chatsLoading && (
                <div className="flex items-center gap-2 px-3 py-2.5 text-[12.5px] text-muted-foreground">
                  <Loader2 size={13} className="animate-spin" />
                  Lagi muat daftar chat...
                </div>
              )}
              {!chatsLoading && chats.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-4 text-center text-[12.5px] text-muted-foreground">
                  Belum ada chat. Mulai chat baru dulu dari menu{" "}
                  <Link href="/chat" className="text-[var(--coral)] underline">
                    Tanya Spark
                  </Link>
                  , nanti balik ke sini buat share dokumen.
                </p>
              )}
              {error && (
                <p className="rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}
              {done && (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/50 bg-emerald-50/80 px-3 py-2.5 text-[12.5px] text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
                  <CheckCircle2 size={14} />
                  Berhasil! Dokumen ke-attach ke chat. Lanjut diskusi di sana.
                </div>
              )}
              <ul className="mt-1 space-y-1">
                {chats.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => onConfirm(c.id)}
                      disabled={done !== null}
                      className={cn(
                        "group/chat flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-background/60 p-3 text-left transition-all hover:border-border/70 hover:bg-background disabled:opacity-50",
                      )}
                    >
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--coral)]/10 text-[var(--coral)]">
                        <MessageCircle size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold">
                          {c.title}
                        </p>
                        {c.subjectName && (
                          <p className="text-[10.5px] text-muted-foreground">
                            {c.subjectName}
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-muted-foreground/50 group-hover/chat:text-[var(--coral)]"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

void ChevronRight;
