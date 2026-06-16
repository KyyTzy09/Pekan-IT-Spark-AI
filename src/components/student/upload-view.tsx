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
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startNewChat } from "@/server/actions/chat";
import {
  type DocumentListItem,
  type GeneratedQuiz,
  deleteDocument,
  generateDocumentQuizAction,
  getDocumentSummary,
  listDocuments,
  listOwnedChats,
  shareDocumentToChatSession,
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
  const [quizData, setQuizData] = React.useState<GeneratedQuiz | null>(null);
  const [quizLoading, setQuizLoading] = React.useState(false);
  const [quizError, setQuizError] = React.useState<string | null>(null);
  const [shareFor, setShareFor] = React.useState<string | null>(null);
  const [chats, setChats] = React.useState<
    Array<{ id: string; title: string; subjectName: string | null }>
  >([]);
  const [chatsLoading, setChatsLoading] = React.useState(false);
  const [shareError, setShareError] = React.useState<string | null>(null);
  const [shareDone, setShareDone] = React.useState<string | null>(null);
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

  const onShowQuiz = async (doc: DocumentListItem) => {
    setQuizFor(doc.id);
    setQuizLoading(true);
    setQuizError(null);
    setQuizData(null);
    try {
      const result = await generateDocumentQuizAction(doc.id, 5);
      if (!result.ok) {
        setQuizError(result.error);
        setQuizLoading(false);
        return;
      }
      setQuizData(result.quiz);
      setQuizLoading(false);
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
                          {doc.hasSummary ? "Lihat ringkasan" : "Buat ringkasan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onShowQuiz(doc)}
                          className="h-7 rounded-full px-2.5 text-[11px]"
                        >
                          <GraduationCap size={11} className="mr-1" />
                          Buat latihan
                        </Button>
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
            <strong>PDF scan/foto:</strong> sementara ini belum support OCR otomatis
            (akan ditambah di 5.4 advanced). Sementara itu, minta file PDF yg
            searchable dari guru, atau convert ke DOCX dulu.
          </p>
          <p className="mt-1.5">
            <strong>Rumus & tabel:</strong> rumus LaTeX-style ($...$ / $$...$$)
            otomatis ke-render via KaTeX, tabel otomatis ke-detect & format
            Markdown.{" "}
            <strong>Wajib edukasi:</strong> dokumen untuk belajar saja — konten
            di luar kurikulum akan ditolak otomatis.
          </p>
        </div>
      </Reveal>

      <SummaryModal
        open={summaryFor !== null}
        loading={summaryLoading}
        data={summaryData}
        error={summaryError}
        docName={documents.find((d) => d.id === summaryFor)?.originalName}
        onClose={closeSummary}
        onRegenerate={() => {
          const doc = documents.find((d) => d.id === summaryFor);
          if (doc) onShowSummary(doc, true);
        }}
      />

      <QuizModal
        open={quizFor !== null}
        loading={quizLoading}
        data={quizData}
        error={quizError}
        docName={documents.find((d) => d.id === quizFor)?.originalName}
        onClose={closeQuiz}
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
  onClose,
  onRegenerate,
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
  onClose: () => void;
  onRegenerate: () => void;
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
            className="relative w-full max-w-2xl overflow-hidden rounded-t-3xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[var(--teal)]/15 blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-3 border-b border-border/40 p-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                  <Sparkles size={10} strokeWidth={2.5} />
                  Ringkasan AI
                </span>
                <h2 className="mt-2 font-heading text-[18px] font-bold leading-tight">
                  {data?.title ?? docName ?? "Ringkasan materi"}
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
                  <Loader2 size={14} className="animate-spin text-[var(--purple)]" />
                  Lagi mikir... Spark baca dokumen kamu terus nge-ekstrak poin
                  pentingnya.
                </div>
              )}
              {error && (
                <p className="rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}
              {data && !loading && (
                <div className="space-y-4 text-[13px] leading-relaxed">
                  <p className="whitespace-pre-line text-foreground/90">
                    {data.summary}
                  </p>
                  <div>
                    <h3 className="text-[10.5px] font-bold uppercase tracking-widest text-muted-foreground">
                      Poin kunci
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {data.keyPoints.map((kp, i) => (
                        <li
                          key={i}
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
                        <strong>{data.homeworkTopic ?? "umum"}</strong>. Mau
                        Spark bantu bahas via mode Socratic? Klik{" "}
                        <strong>Tanya Spark</strong> di daftar dokumen.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-border/40 p-4">
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

function QuizModal({
  open,
  loading,
  data,
  error,
  docName,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  data: GeneratedQuiz | null;
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
            className="relative w-full max-w-2xl overflow-hidden rounded-t-3xl border border-border/40 bg-card/95 shadow-2xl backdrop-blur-xl sm:rounded-3xl"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-[var(--teal)]/15 blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-3 border-b border-border/40 p-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--teal)_22%,transparent)] bg-[color-mix(in_oklch,var(--teal)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--teal)]">
                  <GraduationCap size={10} strokeWidth={2.5} />
                  Latihan otomatis
                </span>
                <h2 className="mt-2 font-heading text-[18px] font-bold leading-tight">
                  {docName ?? "Latihan dari dokumen"}
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
                  <Loader2 size={14} className="animate-spin text-[var(--teal)]" />
                  Bikinin soal... Spark lagi nyiapin 5 pertanyaan pilihan ganda.
                </div>
              )}
              {error && (
                <p className="rounded-2xl border border-rose-300/50 bg-rose-50/80 p-3 text-[12.5px] text-rose-900 dark:bg-rose-500/10 dark:text-rose-200">
                  {error}
                </p>
              )}
              {data && !loading && (
                <ol className="space-y-4">
                  {data.quiz.map((q, i) => (
                    <li
                      key={i}
                      className="rounded-2xl border border-border/40 bg-background/60 p-3.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-[var(--teal)]/15 text-[10px] font-bold text-[var(--teal)]">
                          {i + 1}
                        </span>
                        <p className="flex-1 text-[13.5px] font-semibold leading-snug">
                          {q.question}
                        </p>
                        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">
                          {q.difficulty}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {q.options.map((opt, j) => (
                          <li
                            key={j}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-[12.5px]",
                              j === q.correctIndex
                                ? "border-emerald-300/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"
                                : "border-border/40 bg-card/60 text-foreground/85",
                            )}
                          >
                            <span className="mr-1.5 font-bold">
                              {String.fromCharCode(65 + j)}.
                            </span>
                            {opt}
                            {j === q.correctIndex && (
                              <CheckCircle2
                                size={11}
                                className="ml-1.5 inline text-emerald-600"
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                        <CircleHelp
                          size={12}
                          className="mt-0.5 shrink-0 text-[var(--teal)]"
                        />
                        {q.explanation}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div className="relative flex flex-wrap items-center justify-end gap-2 border-t border-border/40 p-4">
              <Button
                onClick={onClose}
                size="sm"
                className="rounded-full bg-[var(--teal)] text-white"
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
                  Spark bakal jawab berdasarkan dokumen ini di chat yang kamu pilih.
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
