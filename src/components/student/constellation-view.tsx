"use client";

import { ArrowUpRight, Lock, Star } from "lucide-react";
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
}

export function Constellation({ concepts }: ConstellationProps) {
  const [selectedConceptId, setSelectedConceptId] = React.useState<
    string | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleConceptClick = (c: Concept) => {
    // We can open the dialog for any concept.
    // If it's locked, the dialog will show information about the prerequisite requirements.
    setSelectedConceptId(c.id);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-[oklch(0.16_0.04_260)] via-[oklch(0.18_0.04_280)] to-[oklch(0.2_0.05_300)] p-5 shadow-[0_12px_36px_rgba(20,10,50,0.18)] sm:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {concepts.map((c, i) => {
            const mastered = c.status === "MASTERED" && !c.isLocked;
            const learning = c.status === "LEARNING" && !c.isLocked;
            const struggling = c.status === "STRUGGLING" && !c.isLocked;
            const masteryPct = Math.round(c.masteryScore * 100);

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleConceptClick(c)}
                className={cn(
                  "group/cs relative overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 w-full",
                  c.isLocked
                    ? "border-white/5 bg-white/5 opacity-60 hover:opacity-95"
                    : mastered
                      ? "border-[var(--yellow)]/40 bg-[color-mix(in_oklch,var(--yellow)_10%,transparent)] shadow-[0_0_24px_rgba(245,158,11,0.18)]"
                      : learning
                        ? "border-[var(--teal)]/40 bg-[color-mix(in_oklch,var(--teal)_10%,transparent)]"
                        : struggling
                          ? "border-[var(--coral)]/40 bg-[color-mix(in_oklch,var(--coral)_10%,transparent)]"
                          : "border-white/10 bg-white/5",
                )}
                style={{
                  animation: mastered
                    ? `pulse-soft 4s ease-in-out ${(i % 6) * 0.4}s infinite`
                    : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full text-white shadow-[0_0_12px_rgba(255,255,255,0.18)]",
                      c.isLocked
                        ? "bg-muted text-muted-foreground border border-border/30"
                        : mastered
                          ? "bg-gradient-to-br from-[var(--yellow)] to-[var(--orange)]"
                          : learning
                            ? "bg-gradient-to-br from-[var(--teal)] to-[var(--blue)]"
                            : struggling
                              ? "bg-gradient-to-br from-[var(--coral)] to-[var(--pink)]"
                              : "bg-white/15",
                    )}
                  >
                    {c.isLocked ? (
                      <Lock size={11} className="text-muted-foreground/85" />
                    ) : (
                      <Star
                        size={12}
                        fill={mastered ? "currentColor" : "none"}
                        className={cn(
                          mastered ? "text-white" : "text-white/70",
                        )}
                        strokeWidth={2.5}
                      />
                    )}
                  </span>
                  <span className="font-heading text-[11px] font-bold tabular-nums text-white/90">
                    {c.isLocked ? "🔒" : `${masteryPct}%`}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-[12px] font-bold leading-snug text-white">
                  {c.name}
                </p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/60">
                  {c.isLocked
                    ? "Terkunci"
                    : c.status === "MASTERED"
                      ? "Dikuasai"
                      : c.status === "LEARNING"
                        ? "Lagi dipelajari"
                        : c.status === "STRUGGLING"
                          ? "Butuh bantuan"
                          : "Belum mulai"}
                </p>
                {c.isLocked && c.unmetPrerequisites.length > 0 && (
                  <div className="mt-2 border-t border-white/5 pt-1.5">
                    <p className="text-[8.5px] font-semibold text-amber-400 leading-tight">
                      Butuh: {c.unmetPrerequisites[0].name}
                    </p>
                    <p className="text-[7.5px] text-white/40 leading-none mt-0.5">
                      (Klik untuk melihat)
                    </p>
                  </div>
                )}
                <ArrowUpRight
                  size={12}
                  className="absolute right-2 bottom-2 text-white/40 transition-transform group-hover/cs:translate-x-0.5 group-hover/cs:-translate-y-0.5 group-hover/cs:text-white/80"
                />
              </button>
            );
          })}
        </div>
        {concepts.length === 0 && (
          <p className="relative text-center text-[12.5px] text-white/70">
            Belum ada konsep di topik ini.
          </p>
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
