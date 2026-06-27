"use client";

import { BookOpen, Sparkles, Wand2 } from "lucide-react";
import * as React from "react";
import { SparkCharacter } from "@/components/student/spark-character";
import { cn } from "@/lib/utils";

export function WelcomeStep({
  userName,
  onChooseNational,
  onChooseCustom,
}: {
  userName: string;
  onChooseNational: () => void;
  onChooseCustom: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      {/* Hero section */}
      <div className="flex flex-col items-center text-center">
        {/* Spark character with glow */}
        <div className="relative mb-6">
          <div
            aria-hidden
            className="absolute inset-0 -m-8 rounded-full bg-gradient-to-br from-[var(--coral)]/15 via-[var(--orange)]/10 to-[var(--yellow)]/5 blur-3xl"
          />
          <SparkCharacter
            size="lg"
            color="default"
            accessory="none"
            background="default"
          />
        </div>

        {/* Greeting */}
        <div className="space-y-3">
          <h2 className="font-heading text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">
            Hai, <span className="text-gradient-warm">{userName}</span>! 👋
          </h2>
          <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
            Aku <span className="font-bold text-[var(--coral)]">Spark</span>,
            teman belajar AI kamu. Yuk kenalan dulu biar kita bisa mulai
            petualangan belajar bareng! 🚀
          </p>
        </div>
      </div>

      {/* Choice cards */}
      <div className="w-full space-y-3">
        <p className="text-center text-[13px] font-semibold text-foreground/70">
          Pilih jalur belajar kamu
        </p>

        {/* National curriculum card */}
        <button
          type="button"
          onClick={() => {
            console.log("[ONBOARDING_CLIENT] chooseNational");
            onChooseNational();
          }}
          className="group relative w-full overflow-hidden rounded-2xl border-2 border-border/60 bg-card/80 p-6 text-left backdrop-blur-sm transition-all duration-300 hover:border-[var(--teal)]/70 hover:shadow-[0_16px_48px_rgba(20,184,166,0.18)] active:scale-[0.98]"
        >
          {/* Gradient accent */}
          <div
            aria-hidden
            className="absolute -right-20 -top-20 size-48 rounded-full bg-gradient-to-br from-[var(--teal)]/10 to-[var(--blue)]/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          />

          <div className="relative flex items-start gap-5">
            {/* Icon */}
            <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white shadow-[0_8px_24px_rgba(20,184,166,0.3)] transition-transform duration-300 group-hover:scale-110">
              <BookOpen size={24} strokeWidth={2.5} />
            </span>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-[17px] font-bold text-foreground">
                  Kurikulum Nasional
                </h3>
                <span className="rounded-full bg-[var(--teal)]/15 px-2.5 py-0.5 text-[10px] font-bold text-[var(--teal)] ring-1 ring-[var(--teal)]/25">
                  Populer
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Mapel SMA/SMK sesuai Kurikulum Merdeka. Spark langsung siap
                nemenin belajar dengan materi terstruktur.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Profil", "Pilih Mapel", "Gaya Belajar", "Pretest"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--teal)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--teal)]"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Custom subject card */}
        <button
          type="button"
          onClick={() => {
            console.log("[ONBOARDING_CLIENT] chooseCustom");
            onChooseCustom();
          }}
          className="group relative w-full overflow-hidden rounded-2xl border-2 border-border/60 bg-card/80 p-6 text-left backdrop-blur-sm transition-all duration-300 hover:border-[var(--coral)]/70 hover:shadow-[0_16px_48px_rgba(225,29,72,0.18)] active:scale-[0.98]"
        >
          {/* Gradient accent */}
          <div
            aria-hidden
            className="absolute -left-20 -top-20 size-48 rounded-full bg-gradient-to-br from-[var(--coral)]/10 to-[var(--orange)]/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          />

          <div className="relative flex items-start gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_8px_24px_rgba(225,29,72,0.3)] transition-transform duration-300 group-hover:scale-110">
              <Wand2 size={24} strokeWidth={2.5} />
            </span>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-[17px] font-bold text-foreground">
                  Mapel Kustom
                </h3>
                <span className="rounded-full bg-[var(--purple)]/15 px-2.5 py-0.5 text-[10px] font-bold text-[var(--purple)] ring-1 ring-[var(--purple)]/25">
                  AI Powered
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                Mau belajar hal unik? AI bakal bikin outline materi + pretest
                khusus buat kamu dalam hitungan detik.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Bikin Mapel", "AI Generate", "Pretest"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--coral)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--coral)]"
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
      <div className="w-full rounded-xl border border-[var(--purple)]/20 bg-[var(--purple)]/5 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Sparkles
            size={16}
            strokeWidth={2.5}
            className="mt-0.5 shrink-0 text-[var(--purple)]"
          />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
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
