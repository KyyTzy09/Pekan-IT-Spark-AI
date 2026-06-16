"use client";

import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Mail,
  ShieldOff,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { CustomSubjectDetail } from "@/server/actions/admin";
import {
  approveCustomSubject,
  rejectCustomSubject,
} from "@/server/actions/admin";

type Props = {
  subject: CustomSubjectDetail;
};

export function CustomSubjectDetailView({ subject }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isPending = !subject.isVerified && subject.isActive;
  const isVerified = subject.isVerified && subject.isActive;
  const isRejected = !subject.isActive;

  const handleApprove = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await approveCustomSubject({ subjectId: subject.id });
      if (result.ok) {
        setSuccess("Mapel berhasil diverifikasi!");
        setTimeout(() => router.push("/admin/custom-subjects"), 800);
      } else {
        setError(result.error ?? "Gagal approve");
      }
    });
  };

  const handleReject = () => {
    if (rejectReason.trim().length < 3) {
      setError("Alasan penolakan minimal 3 karakter");
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await rejectCustomSubject({
        subjectId: subject.id,
        reason: rejectReason.trim(),
      });
      if (result.ok) {
        setSuccess("Mapel ditolak (soft delete).");
        setTimeout(() => router.push("/admin/custom-subjects"), 800);
      } else {
        setError(result.error ?? "Gagal reject");
      }
    });
  };

  return (
    <div className="space-y-5 pb-20">
      <Link
        href="/admin/custom-subjects"
        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={12} />
        Kembali ke daftar
      </Link>

      <header
        className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-5 shadow-sm backdrop-blur-md sm:p-6"
        style={
          subject.color
            ? {
                background: `linear-gradient(135deg, ${subject.color}20, var(--card) 70%)`,
              }
            : undefined
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div
            className="grid size-16 shrink-0 place-items-center rounded-2xl text-[28px] shadow-sm"
            style={
              subject.color
                ? { background: `${subject.color}30`, color: subject.color }
                : undefined
            }
          >
            {subject.icon ?? <BookOpen size={28} />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="font-heading text-[24px] font-extrabold leading-tight text-foreground sm:text-[28px]">
                  {subject.name}
                </h1>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  {subject.slug}
                </p>
              </div>
              <StatusBadge
                isPending={isPending}
                isVerified={isVerified}
                isRejected={isRejected}
              />
            </div>

            {subject.description && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-foreground/85">
                {subject.description}
              </p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Topik" value={subject.topicCount} accent />
              <Stat label="Konsep" value={subject.conceptCount} accent />
              <Stat
                label="Soal pretest"
                value={subject.pretestQuestionCount}
                accent
              />
              <Stat
                label="Dibuat"
                value={new Date(subject.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
                icon={<Calendar size={12} />}
              />
            </div>

            {subject.createdBy && (
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Mail size={11} />
                <span>Dibuat oleh {subject.createdBy.email}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Action bar */}
      {(isPending || showRejectForm) && (
        <section className="rounded-2xl border border-border/40 bg-card/60 p-4">
          {error && (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-[11.5px] font-semibold text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-[11.5px] font-semibold text-emerald-700 dark:text-emerald-300">
              {success}
            </div>
          )}

          {!showRejectForm ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleApprove}
                disabled={pending || !isPending}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-[12.5px] font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {pending ? "Memproses…" : "Approve Mapel"}
              </button>
              {isPending && (
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectForm(true);
                    setError(null);
                  }}
                  disabled={pending}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[12.5px] font-bold text-red-700 transition-all hover:bg-red-500/20 disabled:opacity-50 dark:text-red-300"
                >
                  <ShieldOff size={14} />
                  Reject
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <label
                htmlFor="reject-reason"
                className="block text-[11px] font-bold uppercase tracking-wider text-foreground"
              >
                Alasan penolakan (wajib)
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Mis: konsep tidak sesuai kurikulum, duplikat mapel existing, dll."
                rows={3}
                className="w-full resize-none rounded-xl border border-border/50 bg-background/50 p-2.5 text-[12px] text-foreground outline-none transition-colors focus:border-red-500/50"
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {rejectReason.length}/500
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason("");
                      setError(null);
                    }}
                    disabled={pending}
                    className="rounded-xl border border-border/50 bg-card/60 px-3 py-1.5 text-[11.5px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={pending}
                    className="rounded-xl bg-red-600 px-3 py-1.5 text-[11.5px] font-bold text-white hover:bg-red-700"
                  >
                    {pending ? "Memproses…" : "Konfirmasi Reject"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Topics & concepts tree */}
      <section className="rounded-2xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[15px] font-bold text-foreground">
              Topik & Konsep
            </h2>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {subject.topics.length} topik •{" "}
              {subject.topics.reduce((acc, t) => acc + t.concepts.length, 0)}{" "}
              konsep
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Sparkles size={10} className="mr-1 inline" />
            AI-generated
          </span>
        </div>

        <ol className="mt-4 space-y-2">
          {subject.topics.map((topic, i) => (
            <li
              key={topic.id}
              className="rounded-xl border border-border/30 bg-background/40 p-3"
            >
              <div className="flex items-start gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[12.5px] font-bold text-foreground">
                    {topic.name}
                  </h3>
                  {topic.description && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {topic.description}
                    </p>
                  )}
                  {topic.concepts.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {topic.concepts.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                        >
                          <ChevronRight size={10} className="shrink-0" />
                          <span className="truncate">{c.name}</span>
                          {c.questionCount > 0 && (
                            <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {c.questionCount} soal
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function StatusBadge({
  isPending,
  isVerified,
  isRejected,
}: {
  isPending: boolean;
  isVerified: boolean;
  isRejected: boolean;
}) {
  if (isVerified) {
    return (
      <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={10} className="mr-1 inline" />
        Verified
      </span>
    );
  }
  if (isRejected) {
    return (
      <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
        <ShieldOff size={10} className="mr-1 inline" />
        Ditolak
      </span>
    );
  }
  if (isPending) {
    return (
      <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
        Menunggu review
      </span>
    );
  }
  return null;
}

function Stat({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-2.5",
        accent
          ? "border-border/40 bg-background/60"
          : "border-border/30 bg-background/30",
      )}
    >
      <div className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-0.5 font-heading text-[15px] font-extrabold leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}
