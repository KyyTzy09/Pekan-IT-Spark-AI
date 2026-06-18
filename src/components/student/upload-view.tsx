"use client";

import { gooeyToast } from "goey-toast";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  Loader2,
  MessageCircle,
  Share2,
  Sparkles,
  Trash2,
  UploadCloud,
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
  deleteDocument,
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
  return new Date(iso).toLocaleDateString("id-ID", {
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
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const refresh = React.useCallback(async () => {
    const result = await (
      await import("@/server/actions/documents")
    ).listDocuments();
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
        gooeyToast.error("File terlalu besar", {
          description: "Maksimal ukuran file adalah 10 MB.",
        });
        return;
      }
      if (file.size === 0) {
        setStatus({
          kind: "error",
          fileName: file.name,
          message: "File kosong.",
        });
        gooeyToast.error("File kosong");
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
        gooeyToast.error("Gagal mengupload materi", {
          description: result.error,
        });
        return;
      }
      setStatus({ kind: "success", fileName: file.name });
      gooeyToast.success("Materi berhasil diupload!", {
        description: `${file.name} sekarang siap digunakan.`,
      });
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
      gooeyToast.success("Dokumen berhasil dihapus");
    } else {
      gooeyToast.error(res.error || "Gagal menghapus dokumen");
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
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  pendingDelete={pendingDelete === doc.id}
                  onAskSpark={() => onAskSpark(doc)}
                  onDelete={() => onDelete(doc.id)}
                />
              ))}
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
    </div>
  );
}

function DocumentRow({
  doc,
  pendingDelete,
  onAskSpark,
  onDelete,
}: {
  doc: DocumentListItem;
  pendingDelete: boolean;
  onAskSpark: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="group/doc relative flex items-start gap-3 rounded-2xl border border-border/40 bg-card/80 p-3.5 shadow-[0_6px_18px_rgba(80,20,50,0.06)] backdrop-blur-md">
      <Link
        href={`/upload/${doc.id}`}
        className="absolute inset-0 z-0 rounded-2xl"
        aria-label={`Buka workspace ${doc.originalName}`}
      />
      <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--teal)]/10 text-[var(--teal)]">
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
        <div className="relative z-10 mt-2 flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={onAskSpark}
            className="h-7 rounded-full px-2.5 text-[11px] text-[var(--coral)]"
          >
            <MessageCircle size={11} className="mr-1" />
            Tanya Spark
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-2.5 text-[11px]"
          >
            <Link href={`/upload/${doc.id}`}>
              <Sparkles size={11} className="mr-1" />
              {doc.hasSummary ? "Lihat ringkasan" : "Buat ringkasan"}
            </Link>
          </Button>
          {doc.hasHomework ? (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 rounded-full px-2.5 text-[11px] font-semibold text-[var(--teal)]"
            >
              <Link href={`/upload/${doc.id}/material/new`}>
                <BookOpen size={11} className="mr-1" />
                Buat materi belajar
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="h-7 rounded-full px-2.5 text-[11px]"
            >
              <Link href={`/upload/${doc.id}/quiz/new`}>
                <GraduationCap size={11} className="mr-1" />
                Buat latihan
              </Link>
            </Button>
          )}
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-2.5 text-[11px]"
          >
            <Link href={`/upload/${doc.id}/share`}>
              <Share2 size={11} className="mr-1" />
              Share ke chat
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={pendingDelete}
            className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground hover:text-rose-600"
          >
            {pendingDelete ? (
              <Loader2 size={11} className="mr-1 animate-spin" />
            ) : (
              <Trash2 size={11} className="mr-1" />
            )}
            Hapus
          </Button>
        </div>
      </div>
      <Link
        href={`/upload/${doc.id}`}
        className="relative z-10 grid shrink-0 place-items-center self-stretch pr-1 text-muted-foreground/40 transition-colors group-hover/doc:text-[var(--coral)]"
        aria-label="Buka workspace"
      >
        <ArrowUpRight size={14} />
      </Link>
    </li>
  );
}

function UploadStatusBar({ status }: { status: UploadStatus }) {
  if (status.kind === "idle") return null;
  return (
    <div
      className={cn(
        "mt-5 flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left text-[12.5px]",
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
        <Loader2 size={14} className="text-emerald-600" />
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
  );
}

void ChevronRight;
