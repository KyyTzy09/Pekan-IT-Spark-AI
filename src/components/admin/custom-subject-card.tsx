"use client";

import { ArrowUpRight, BookOpen, Calendar, Mail } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CustomSubjectListItem } from "@/server/actions/admin";

type Props = {
  subject: CustomSubjectListItem;
};

const STATUS_BADGE: Record<
  "pending" | "verified" | "rejected",
  { label: string; color: string }
> = {
  pending: {
    label: "Menunggu",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  verified: {
    label: "Terverifikasi",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  rejected: {
    label: "Ditolak",
    color: "bg-red-500/15 text-red-700 dark:text-red-300",
  },
};

export function CustomSubjectCard({ subject }: Props) {
  const status: "pending" | "verified" | "rejected" = !subject.isActive
    ? "rejected"
    : subject.isVerified
      ? "verified"
      : "pending";
  const badge = STATUS_BADGE[status];

  return (
    <Link
      href={`/admin/custom-subjects/${subject.id}`}
      className="group block transition-transform hover:scale-[1.01]"
    >
      <article
        className="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-4 shadow-sm backdrop-blur-md transition-all group-hover:border-slate-300 group-hover:shadow-md dark:group-hover:border-slate-700"
        style={
          subject.color
            ? {
                background: `linear-gradient(135deg, ${subject.color}15, var(--card) 60%)`,
              }
            : undefined
        }
      >
        <div className="flex items-start gap-3">
          <div
            className="grid size-12 shrink-0 place-items-center rounded-xl text-[22px] shadow-sm"
            style={
              subject.color
                ? { background: `${subject.color}25`, color: subject.color }
                : undefined
            }
          >
            {subject.icon ?? <BookOpen size={20} />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-bold text-foreground">
                  {subject.name}
                </h3>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                  {subject.slug}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                  badge.color,
                )}
              >
                {badge.label}
              </span>
            </div>

            {subject.description && (
              <p className="mt-2 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
                {subject.description}
              </p>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Topik" value={subject.topicCount} />
              <Stat label="Konsep" value={subject.conceptCount} />
              <Stat label="Soal" value={subject.pretestQuestionCount} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[10.5px] text-muted-foreground">
                {subject.createdBy ? (
                  <>
                    <Mail size={10} className="shrink-0" />
                    <span className="truncate">{subject.createdBy.email}</span>
                  </>
                ) : (
                  <span className="italic">Tanpa creator</span>
                )}
              </div>
              <div className="flex items-center gap-2.5 text-[10.5px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(subject.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                {status === "pending" && (
                  <ArrowUpRight
                    size={12}
                    className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/30 bg-background/40 p-1.5 text-center">
      <p className="font-heading text-[14px] font-extrabold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
