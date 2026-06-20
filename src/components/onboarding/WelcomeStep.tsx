"use client";

import { BookOpen, Sparkles, Wand2 } from "lucide-react";
import * as React from "react";
import { SparkCharacter } from "@/components/student/spark-character";

export function WelcomeStep({
  userName,
  onChooseNational,
  onChooseCustom,
}: {
  userName: string;
  onChooseNational: () => void;
  onChooseCustom: () => void;
}) {
  const [hoveredCard, setHoveredCard] = React.useState<
    "national" | "custom" | null
  >(null);

  return (
    <div className="space-y-5">
      {/* Animated character with speech bubble */}
      <div className="relative flex flex-col items-center pt-1">
        <div className="relative">
          {/* Glow effect */}
          <div
            aria-hidden
            className="absolute inset-0 size-20 rounded-full bg-gradient-to-br from-[var(--coral)]/20 to-[var(--purple)]/20 blur-2xl"
          />
          <SparkCharacter
            size="lg"
            color="default"
            accessory="none"
            background="default"
          />
        </div>

        {/* Speech bubble */}
        <div className="mt-3 max-w-[260px] rounded-2xl border border-border/40 bg-card/70 px-4 py-3 text-center backdrop-blur-sm">
          <p className="text-[13px] leading-relaxed text-foreground/90">
            Hai,{" "}
            <span className="font-bold text-[var(--coral)]">{userName}</span>!
            Yuk kenalan dulu biar kita bisa belajar bareng 🚀
          </p>
          {/* Bubble tail */}
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-border/40 bg-card/70" />
        </div>
      </div>

      {/* Route cards */}
      <p className="text-center text-[12px] font-bold text-foreground/70">
        Pilih jalur yang kamu mau
      </p>

      <div className="grid gap-3">
        {/* National card */}
        <button
          type="button"
          onClick={onChooseNational}
          onMouseEnter={() => setHoveredCard("national")}
          onMouseLeave={() => setHoveredCard(null)}
          className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 text-left backdrop-blur-sm transition-all duration-300 hover:border-[var(--teal)]/50 hover:shadow-[0_12px_36px_rgba(20,184,166,0.15)] active:scale-[0.98]"
        >
          {/* Background gradient orb */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-25 group-hover:scale-110"
            style={{
              background:
                "radial-gradient(circle, oklch(0.78 0.14 175 / 0.5), transparent 70%)",
            }}
          />

          <div className="relative flex items-start gap-4">
            {/* Icon */}
            <span
              className={cn(
                "grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg transition-all duration-300 group-hover:-translate-y-1",
                hoveredCard === "national"
                  ? "bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] shadow-[0_8px_20px_rgba(20,184,166,0.4)]"
                  : "bg-gradient-to-br from-[var(--teal)]/80 to-[var(--blue)]/80 shadow-[0_4px_12px_rgba(20,184,166,0.2)]",
              )}
            >
              <BookOpen size={22} strokeWidth={2.5} />
            </span>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading text-[16px] font-bold text-foreground">
                  Kurikulum Nasional
                </p>
                <span className="rounded-full bg-[var(--teal)]/15 px-2 py-0.5 text-[9px] font-bold text-[var(--teal)] ring-1 ring-[var(--teal)]/20">
                  Populer
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Mapel SMA/SMK sesuai Kurikulum Merdeka. Spark langsung siap
                nemenin belajar.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Profil", "Pilih Mapel", "Gaya Belajar", "Pretest"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--teal)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--teal)] transition-colors group-hover:bg-[var(--teal)]/15"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Custom card */}
        <button
          type="button"
          onClick={onChooseCustom}
          onMouseEnter={() => setHoveredCard("custom")}
          onMouseLeave={() => setHoveredCard(null)}
          className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 text-left backdrop-blur-sm transition-all duration-300 hover:border-[var(--coral)]/50 hover:shadow-[0_12px_36px_rgba(225,29,72,0.15)] active:scale-[0.98]"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-10 size-32 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-25 group-hover:scale-110"
            style={{
              background:
                "radial-gradient(circle, oklch(0.75 0.18 350 / 0.5), transparent 70%)",
            }}
          />

          <div className="relative flex items-start gap-4">
            <span
              className={cn(
                "grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-lg transition-all duration-300 group-hover:-translate-y-1",
                hoveredCard === "custom"
                  ? "bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] shadow-[0_8px_20px_rgba(225,29,72,0.4)]"
                  : "bg-gradient-to-br from-[var(--coral)]/80 to-[var(--orange)]/80 shadow-[0_4px_12px_rgba(225,29,72,0.2)]",
              )}
            >
              <Wand2 size={22} strokeWidth={2.5} />
            </span>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-heading text-[16px] font-bold text-foreground">
                  Mapel Kustom
                </p>
                <span className="rounded-full bg-[var(--purple)]/15 px-2 py-0.5 text-[9px] font-bold text-[var(--purple)] ring-1 ring-[var(--purple)]/20">
                  AI Powered
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                Mau belajar hal unik? AI bakal bikin outline + pretest khusus
                buat kamu.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Bikin Mapel", "AI Generate", "Pretest"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--coral)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--coral)] transition-colors group-hover:bg-[var(--coral)]/15"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Tip */}
      <div className="rounded-2xl border border-[var(--purple)]/20 bg-[var(--purple)]/5 p-3.5 backdrop-blur-sm">
        <div className="flex items-start gap-2.5">
          <Sparkles
            size={14}
            strokeWidth={2.5}
            className="mt-0.5 shrink-0 text-[var(--purple)]"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground">Tips:</span> Pilih{" "}
            <span className="font-bold text-[var(--teal)]">
              Kurikulum Nasional
            </span>{" "}
            untuk mapel sekolah biasa. Pilih{" "}
            <span className="font-bold text-[var(--coral)]">Mapel Kustom</span>{" "}
            kalau mapel kamu tidak ada di list.
          </p>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
