"use client";

import {
  BookOpen,
  GraduationCap,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";

/* ─── Animated sparkle that drifts across the panel ─── */
function FloatingSparkle({
  delay,
  x,
  y,
  size,
  color = "bg-indigo-500/10",
}: {
  delay: number;
  x: string;
  y: string;
  size: number;
  color?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full ${color}`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        animation: `float ${5 + delay}s ease-in-out ${delay * 0.3}s infinite`,
      }}
    />
  );
}

/* ─── Fake chat bubble used in login panel ─── */
function ChatBubble({
  from,
  text,
  delay,
}: {
  from: "spark" | "student";
  text: string;
  delay: number;
}) {
  const isSpark = from === "spark";
  return (
    <div
      className="flex gap-2.5 anim-slide-up gpu"
      style={{
        animationDelay: `${delay}ms`,
        flexDirection: isSpark ? "row" : "row-reverse",
      }}
    >
      {isSpark && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
          <Sparkles size={13} strokeWidth={2.5} />
        </div>
      )}
      <div
        className="max-w-[220px] rounded-2xl px-3.5 py-2 text-[11.5px] leading-relaxed shadow-sm"
        style={{
          background: isSpark
            ? "#fffbeb" // amber-50
            : "#f1f5f9", // slate-100
          color: "#1e293b", // slate-800
          borderBottomLeftRadius: isSpark ? "6px" : undefined,
          borderBottomRightRadius: !isSpark ? "6px" : undefined,
          border: isSpark
            ? "1px solid rgba(245, 158, 11, 0.2)"
            : "1px solid rgba(226, 232, 240, 0.8)",
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ─── Mini stat card for register panel ─── */
function StatChip({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/70 px-3.5 py-2.5 shadow-sm backdrop-blur-sm anim-slide-up gpu"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          color,
        }}
      >
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-slate-800">{value}</p>
        <p className="text-[10.5px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export function AuthBranding() {
  const pathname = usePathname();
  const isRegister = pathname?.includes("/register");

  return (
    <aside className="relative isolate hidden lg:flex lg:w-1/2 flex-col overflow-hidden border-r border-slate-200/10 bg-transparent">
      {/* Animated orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute -left-20 -top-20 size-[360px] rounded-full opacity-40"
          style={{
            background: isRegister
              ? "radial-gradient(circle, rgba(167, 139, 250, 0.25), transparent 70%)"
              : "radial-gradient(circle, rgba(251, 113, 133, 0.25), transparent 70%)",
            animation: "drift 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-16 bottom-1/4 size-[280px] rounded-full opacity-35"
          style={{
            background:
              "radial-gradient(circle, rgba(45, 212, 191, 0.2), transparent 70%)",
            animation: "drift 18s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Floating sparkles */}
      <FloatingSparkle
        delay={0}
        x="12%"
        y="18%"
        size={6}
        color="bg-rose-500/15"
      />
      <FloatingSparkle
        delay={1.5}
        x="75%"
        y="25%"
        size={4}
        color="bg-amber-500/15"
      />
      <FloatingSparkle
        delay={3}
        x="35%"
        y="72%"
        size={5}
        color="bg-teal-500/15"
      />
      <FloatingSparkle
        delay={2}
        x="82%"
        y="65%"
        size={3}
        color="bg-indigo-500/15"
      />
      <FloatingSparkle
        delay={4}
        x="20%"
        y="85%"
        size={4}
        color="bg-fuchsia-500/15"
      />

      {/* Grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-12">
        {/* Logo */}
        <Link
          href="/"
          className="group inline-flex w-fit items-center gap-3 focus:outline-none"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-md transition-all duration-300 group-hover:scale-105">
            <GraduationCap size={20} strokeWidth={2.2} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Spark Ai
          </span>
        </Link>

        {/* Middle content ─── DIFFERENT per page */}
        <div className="space-y-7">
          {isRegister ? (
            /* ─── REGISTER: Show what you'll unlock ─── */
            <>
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Yang akan kamu dapat
                </p>
                <h2 className="font-heading text-[28px] font-extrabold leading-[1.15] tracking-tight text-slate-900">
                  Semua yang kamu
                  <br />
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent">
                    butuhkan buat belajar
                  </span>
                </h2>
                <p className="max-w-[320px] text-[13px] leading-relaxed text-slate-500">
                  Gratis, tanpa batas waktu, tanpa iklan. Langsung bisa dipake.
                </p>
              </div>

              {/* Feature stats */}
              <div className="space-y-2.5">
                <StatChip
                  icon={Target}
                  label="Menyesuaikan level kamu"
                  value="Belajar Adaptif"
                  color="#fb7185"
                  delay={200}
                />
                <StatChip
                  icon={MessageCircle}
                  label="Dibimbing, bukan dikasih jawaban"
                  value="Chat Socratic 24/7"
                  color="#0ea5e9"
                  delay={350}
                />
                <StatChip
                  icon={Trophy}
                  label="XP, streak, badge, leaderboard"
                  value="Gamifikasi Seru"
                  color="#d97706"
                  delay={500}
                />
                <StatChip
                  icon={BookOpen}
                  label="Upload PDF guru, jadi latihan"
                  value="Asisten Dokumen"
                  color="#0d9488"
                  delay={650}
                />
              </div>
            </>
          ) : (
            /* ─── LOGIN: Show a Socratic chat preview ─── */
            <>
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Spark nemenin kamu
                </p>
                <h2 className="font-heading text-[28px] font-extrabold leading-[1.15] tracking-tight text-slate-900">
                  Bukan cuma jawaban,
                  <br />
                  <span className="bg-gradient-to-r from-rose-600 via-amber-500 to-teal-600 bg-clip-text text-transparent">
                    tapi beneran paham ✨
                  </span>
                </h2>
              </div>

              {/* Fake Socratic chat */}
              <div className="space-y-3 rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
                <div className="mb-1 flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Preview Chat
                  </span>
                </div>
                <ChatBubble
                  from="student"
                  text="Kak, cara faktorin x² + 5x + 6 gimana ya? 😅"
                  delay={400}
                />
                <ChatBubble
                  from="spark"
                  text="Oke! Coba kamu cari dua angka yang kalau dijumlahin = 5, dan kalau dikali = 6. Ada ide? 🤔"
                  delay={600}
                />
                <ChatBubble from="student" text="Hmm... 2 dan 3?" delay={800} />
                <ChatBubble
                  from="spark"
                  text="Nah betul! 🎯 Jadi x² + 5x + 6 = (x + 2)(x + 3). Kamu nemuin sendiri tuh!"
                  delay={1000}
                />
              </div>
            </>
          )}
        </div>

        {/* Bottom */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1.5">
            {[
              "from-rose-400 to-orange-400",
              "from-violet-400 to-pink-400",
              "from-teal-400 to-emerald-400",
            ].map((g, i) => (
              <div
                key={g}
                className={`grid size-6 place-items-center rounded-full border-2 border-white bg-gradient-to-br ${g} text-[8px] font-bold text-white shadow-sm`}
              >
                {["R", "B", "S"][i]}
              </div>
            ))}
          </div>
          <p className="text-[11.5px] font-medium text-slate-400">
            {isRegister
              ? "Buat akun gratis — tanpa kartu kredit 🎁"
              : "12K+ siswa sudah belajar bareng Spark 🇮🇩"}
          </p>
        </div>
      </div>
    </aside>
  );
}
