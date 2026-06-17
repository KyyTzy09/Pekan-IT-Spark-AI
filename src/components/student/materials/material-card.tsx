"use client";

import { BookOpen, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { cn } from "@/lib/utils";

type Difficulty = "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
type MaterialSource = "CHALLENGE" | "ON_DEMAND" | "ADAPTIVE";

interface MaterialLibraryItem {
  id: string;
  title: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  source: MaterialSource;
  createdAt: string;
  read: { completed: boolean; readAt: string; readSeconds: number } | null;
  subject: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
}

const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; color: string; bg: string }
> = {
  EASY: {
    label: "Dasar",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-500/15",
  },
  MEDIUM: {
    label: "Sedang",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-500/15",
  },
  HARD: {
    label: "Lanjut",
    color: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-100 dark:bg-rose-500/15",
  },
  ADVANCED: {
    label: "Tantangan",
    color: "text-fuchsia-700 dark:text-fuchsia-300",
    bg: "bg-fuchsia-100 dark:bg-fuchsia-500/15",
  },
};

const SOURCE_LABEL: Record<MaterialSource, string> = {
  CHALLENGE: "Tantangan",
  ON_DEMAND: "Custom",
  ADAPTIVE: "Adaptif",
};

export const MaterialCard = memo(function MaterialCard({
  material,
}: {
  material: MaterialLibraryItem;
}) {
  const meta = DIFFICULTY_META[material.difficulty];
  const date = new Date(material.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
  const isRead = material.read?.completed;

  return (
    <Link
      href={`/materials/${material.id}`}
      className="group/mat flex items-start gap-3 rounded-2xl border border-border/40 bg-card/80 p-3.5 shadow-[0_4px_14px_rgba(80,20,50,0.04)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(80,20,50,0.1)]"
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-2xl"
        style={{
          background: material.subject?.color
            ? `linear-gradient(135deg, ${material.subject.color}30, transparent)`
            : "var(--teal)/10",
        }}
      >
        {material.subject?.icon ? (
          <span className="text-[18px]">{material.subject.icon}</span>
        ) : (
          <BookOpen
            size={16}
            strokeWidth={2.5}
            className="text-[var(--teal)]"
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {material.subject && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {material.subject.name}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">·</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-widest",
              meta.color,
              meta.bg,
            )}
          >
            {meta.label}
          </span>
        </div>
        <h3 className="mt-0.5 line-clamp-2 font-heading text-[13.5px] font-bold leading-snug">
          {material.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Clock size={10} strokeWidth={2.5} />
            {material.estimatedMinutes} min
          </span>
          <span>·</span>
          <span>{date}</span>
          <span>·</span>
          <span>{SOURCE_LABEL[material.source]}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isRead && <CheckCircle2 size={14} className="text-emerald-500" />}
        <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover/mat:translate-x-0.5" />
      </div>
    </Link>
  );
});
