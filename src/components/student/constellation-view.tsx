"use client";

import {
  ArrowUpRight,
  Lock,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import * as React from "react";
import { ConceptDetailDialog } from "@/components/student/concept-detail-dialog";
import { cn } from "@/lib/utils";

type Concept = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: "NOT_STARTED" | "LEARNING" | "MASTERED" | "STRUGGLING";
  masteryScore: number;
  isLocked: boolean;
  unmetPrerequisites: Array<{ id: string; name: string }>;
};

interface ConstellationProps {
  concepts: Concept[];
  subjectColor?: string | null;
}

const STATUS_CONFIG = {
  MASTERED: {
    border: "border-[var(--yellow)]/30",
    bg: "bg-[var(--yellow)]/5",
    shadow: "shadow-[0_0_20px_rgba(245,158,11,0.1)]",
    iconBg: "bg-gradient-to-br from-[var(--yellow)] to-[var(--orange)]",
    badge: "bg-[var(--yellow)]/10 text-[var(--yellow)]",
    label: "Dikuasai",
    icon: Star,
  },
  LEARNING: {
    border: "border-[var(--teal)]/30",
    bg: "bg-[var(--teal)]/5",
    shadow: "shadow-[0_0_16px_rgba(20,184,166,0.08)]",
    iconBg: "bg-gradient-to-br from-[var(--teal)] to-[var(--blue)]",
    badge: "bg-[var(--teal)]/10 text-[var(--teal)]",
    label: "Lagi dipelajari",
    icon: TrendingUp,
  },
  STRUGGLING: {
    border: "border-[var(--coral)]/30",
    bg: "bg-[var(--coral)]/5",
    shadow: "shadow-[0_0_16px_rgba(225,29,72,0.08)]",
    iconBg: "bg-gradient-to-br from-[var(--coral)] to-[var(--pink)]",
    badge: "bg-[var(--coral)]/10 text-[var(--coral)]",
    label: "Butuh bantuan",
    icon: Target,
  },
  NOT_STARTED: {
    border: "border-border/40",
    bg: "bg-card/60",
    shadow: "",
    iconBg: "bg-muted",
    badge: "bg-muted text-muted-foreground",
    label: "Belum mulai",
    icon: Sparkles,
  },
} as const;

export function Constellation({ concepts, subjectColor }: ConstellationProps) {
  const [selectedConceptId, setSelectedConceptId] = React.useState<
    string | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleConceptClick = (c: Concept) => {
    setSelectedConceptId(c.id);
    setIsDialogOpen(true);
  };

  // Sort: mastered first, then learning, then struggling, then not started, locked last
  const sortedConcepts = React.useMemo(() => {
    const order = { MASTERED: 0, LEARNING: 1, STRUGGLING: 2, NOT_STARTED: 3 };
    return [...concepts].sort((a, b) => {
      if (a.isLocked !== b.isLocked) return a.isLocked ? 1 : -1;
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });
  }, [concepts]);

  const masteredCount = concepts.filter(
    (c) => c.status === "MASTERED" && !c.isLocked,
  ).length;

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_8px_24px_rgba(80,20,50,0.06)] backdrop-blur-md sm:p-6">
        {/* Subtle background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-52 rounded-full opacity-20 blur-3xl"
          style={{
            background: subjectColor
              ? `radial-gradient(circle, ${subjectColor}40, transparent 70%)`
              : "radial-gradient(circle, var(--yellow), transparent 70%)",
          }}
        />

        {/* Summary bar */}
        <div className="relative mb-4 flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-background/40 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-[var(--yellow)]/10">
              <Star
                size={13}
                className="text-[var(--yellow)]"
                fill="currentColor"
              />
            </span>
            <span className="text-[12px] font-bold text-foreground">
              {masteredCount} / {concepts.length} konsep dikuasai
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {["MASTERED", "LEARNING", "STRUGGLING", "NOT_STARTED"].map(
              (status) => {
                const count = concepts.filter(
                  (c) => c.status === status && !c.isLocked,
                ).length;
                if (count === 0) return null;
                const cfg =
                  STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                return (
                  <span
                    key={status}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold",
                      cfg.badge,
                    )}
                  >
                    {count}
                  </span>
                );
              },
            )}
          </div>
        </div>

        {/* Concept grid */}
        <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {sortedConcepts.map((c) => {
            const cfg = c.isLocked
              ? null
              : STATUS_CONFIG[c.status] ?? STATUS_CONFIG.NOT_STARTED;
            const masteryPct = Math.round(c.masteryScore * 100);
            const StatusIcon = cfg?.icon ?? Sparkles;

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleConceptClick(c)}
                className={cn(
                  "group/cs relative overflow-hidden rounded-2xl border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md w-full",
                  c.isLocked
                    ? "border-border/20 bg-muted/30 opacity-60 hover:opacity-90"
                    : cn(cfg?.border, cfg?.bg, cfg?.shadow),
                )}
              >
                {/* Icon & Score row */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-xl text-white shadow-sm",
                      c.isLocked ? "bg-muted text-muted-foreground" : cfg?.iconBg,
                    )}
                  >
                    {c.isLocked ? (
                      <Lock size={13} className="text-muted-foreground/80" />
                    ) : (
                      <StatusIcon
                        size={14}
                        fill={
                          c.status === "MASTERED" ? "currentColor" : "none"
                        }
                        strokeWidth={2.5}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "font-heading text-[11px] font-bold tabular-nums",
                      c.isLocked
                        ? "text-muted-foreground"
                        : "text-foreground/80",
                    )}
                  >
                    {c.isLocked ? "🔒" : `${masteryPct}%`}
                  </span>
                </div>

                {/* Concept name */}
                <p
                  className={cn(
                    "mt-2.5 line-clamp-2 text-[12.5px] font-bold leading-snug",
                    c.isLocked
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {c.name}
                </p>

                {/* Status badge */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider",
                      c.isLocked
                        ? "bg-muted/60 text-muted-foreground/70"
                        : cfg?.badge,
                    )}
                  >
                    {c.isLocked ? "Terkunci" : cfg?.label}
                  </span>
                </div>

                {/* Locked prerequisites hint */}
                {c.isLocked && c.unmetPrerequisites.length > 0 && (
                  <div className="mt-2 border-t border-border/20 pt-1.5">
                    <p className="text-[9px] font-semibold text-[var(--coral)] leading-tight">
                      Butuh: {c.unmetPrerequisites[0].name}
                    </p>
                  </div>
                )}

                {/* Hover arrow */}
                <ArrowUpRight
                  size={12}
                  className="absolute right-2.5 bottom-2.5 text-muted-foreground/30 transition-all group-hover/cs:translate-x-0.5 group-hover/cs:-translate-y-0.5 group-hover/cs:text-foreground/50"
                />
              </button>
            );
          })}
        </div>

        {/* Empty state */}
        {concepts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground mb-3">
              <Sparkles size={20} />
            </span>
            <p className="text-[13px] font-semibold text-muted-foreground">
              Belum ada konsep di topik ini.
            </p>
          </div>
        )}
      </div>

      <ConceptDetailDialog
        conceptId={selectedConceptId}
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedConceptId(null);
        }}
      />
    </>
  );
}
