import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  GraduationCap,
  MessageCircle,
  Quote,
  Rocket,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/sections/reveal";

const PROOF_AVATARS = [
  "from-[var(--coral)] to-[var(--orange)]",
  "from-[var(--purple)] to-[var(--pink)]",
  "from-[var(--teal)] to-[var(--green)]",
];
const PROOF_INITIALS = ["RA", "BP", "SP"];

const HIGHLIGHTS = [
  {
    icon: Brain,
    title: "Penjelasan Socratic",
    desc: "Spark nanya balik, bukan kasih jawaban langsung.",
  },
  {
    icon: TrendingUp,
    title: "Latihan adaptif",
    desc: "Soal otomatis naik-turun sesuai level kamu.",
  },
  {
    icon: Upload,
    title: "Upload materi guru",
    desc: "PDF/DOCX langsung jadi ringkasan & kuis.",
  },
];

const BENEFITS = [
  { icon: MessageCircle, label: "Tutor 24/7", color: "var(--coral)" },
  { icon: BookOpen, label: "Adaptif", color: "var(--purple)" },
  { icon: Upload, label: "Upload materi", color: "var(--teal)" },
];

const TRUSTED_BY = ["Kurikulum Merdeka", "BSE", "CP & ATP"];

export function AuthShell({
  children,
  side = "right",
}: {
  children: React.ReactNode;
  side?: "left" | "right";
}) {
  return (
    <div
      className="relative min-h-svh w-full overflow-hidden"
      style={{ background: "var(--hero-bg)" }}
    >
      <FloatingBackground />

      <div className="relative grid min-h-svh w-full lg:grid-cols-2">
        {side === "left" ? <FormSide>{children}</FormSide> : <StorySide />}
        {side === "left" ? <StorySide /> : <FormSide>{children}</FormSide>}
      </div>
    </div>
  );
}

function FormSide({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 lg:py-10">
      <div className="w-full max-w-[460px]">
        <BrandHeader />

        <div className="mt-6 sm:mt-8">
          <FormCard>{children}</FormCard>
        </div>

        <BenefitsStrip />

        <FootNote />
      </div>
    </main>
  );
}

function BrandHeader() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1"
    >
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_14px_rgba(225,29,72,0.4)] transition-shadow group-hover:shadow-[0_6px_20px_rgba(225,29,72,0.55)]">
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 to-transparent" />
        <GraduationCap size={18} strokeWidth={2.5} className="relative" />
      </span>
      <span className="font-heading text-[17px] font-semibold text-gradient">
        Spark Ai
      </span>
    </Link>
  );
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/90 p-5 shadow-[0_20px_60px_-20px_rgba(80,20,50,0.18),0_4px_14px_rgba(80,20,50,0.05),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md sm:p-7 dark:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-[var(--coral)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-16 size-44 rounded-full bg-[var(--teal)]/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function BenefitsStrip() {
  return (
    <div className="mt-4">
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        Yang kamu dapat
      </p>
      <div className="grid grid-cols-3 gap-2">
        {BENEFITS.map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="group/ben flex flex-col items-center gap-1.5 rounded-2xl border border-border/40 bg-card/55 p-2.5 text-center backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-border/60 hover:bg-card/80"
          >
            <span
              className="grid size-7 place-items-center rounded-lg bg-card/80 ring-1 ring-border/50 transition-transform group-hover/ben:scale-110"
              style={{ color }}
            >
              <Icon size={13} strokeWidth={2.5} />
            </span>
            <span className="text-[10px] font-bold leading-tight text-foreground/80">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FootNote() {
  return (
    <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
      Dengan melanjutkan, kamu setuju dengan{" "}
      <Link
        href="/terms"
        className="underline underline-offset-2 hover:text-foreground"
      >
        Ketentuan Layanan
      </Link>{" "}
      dan{" "}
      <Link
        href="/privacy"
        className="underline underline-offset-2 hover:text-foreground"
      >
        Kebijakan Privasi
      </Link>{" "}
      Spark Ai.
    </p>
  );
}

function StorySide() {
  return (
    <aside className="relative hidden lg:flex lg:flex-col lg:justify-between lg:gap-6 lg:p-10 xl:p-14">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          aria-hidden
          className="absolute -right-32 top-1/4 size-[520px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.82 0.15 75 / 0.55), transparent 70%)",
            animation: "drift 22s ease-in-out infinite reverse",
          }}
        />
        <div
          aria-hidden
          className="absolute -left-32 bottom-10 size-[420px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.14 175 / 0.4), transparent 70%)",
            animation: "drift 25s ease-in-out infinite",
          }}
        />
        <div
          aria-hidden
          className="absolute right-1/4 top-1/2 size-2 rounded-full bg-[var(--coral)] opacity-70"
          style={{ animation: "float 6s ease-in-out infinite" }}
        />
        <div
          aria-hidden
          className="absolute left-1/3 top-1/3 size-1.5 rounded-full bg-[var(--purple)] opacity-60"
          style={{ animation: "float 8s ease-in-out 0.5s infinite" }}
        />
        <div
          aria-hidden
          className="absolute right-[15%] bottom-[20%] size-1.5 rounded-full bg-[var(--teal)] opacity-60"
          style={{ animation: "float 9s ease-in-out 1s infinite" }}
        />
      </div>

      <Reveal className="relative max-w-[460px]">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/80 px-3 py-1 text-[11px] font-bold text-muted-foreground backdrop-blur-sm">
          <Sparkles size={11} className="text-[var(--coral)]" />
          Tutor AI yang beneran ngertiin
        </div>

        <h2 className="font-heading text-[34px] font-bold leading-[1.05] tracking-tight xl:text-[42px]">
          Belajar lebih <span className="text-gradient-warm">paham,</span>
          <br />
          bukan cuma <span className="text-gradient-cool">dijawabin.</span>
        </h2>

        <p className="mt-3.5 text-[13.5px] leading-relaxed text-muted-foreground">
          Spark nemenin kamu memahami konsep lewat dialog, latihan yang
          disesuaikan, dan penjelasan yang nggak menggurui.
        </p>

        <ul className="mt-5 space-y-2">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <li
                key={h.title}
                className="flex items-start gap-2.5 rounded-xl bg-card/40 px-2.5 py-1.5 backdrop-blur-sm"
              >
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[var(--coral)]/15 to-[var(--orange)]/15 text-[var(--coral)]">
                  <Icon size={12} strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-[12.5px] font-bold text-foreground">
                    {h.title}
                  </p>
                  <p className="text-[11.5px] leading-tight text-muted-foreground">
                    {h.desc}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Reveal>

      <Reveal delay={140} className="relative max-w-[460px] space-y-3">
        <ChatPreview />
        <TestimonialCard />
      </Reveal>

      <Reveal delay={240} className="relative space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="flex -space-x-2">
            {PROOF_AVATARS.map((g, i) => (
              <div
                key={i}
                className={cn(
                  "grid size-9 place-items-center rounded-full border-2 border-background bg-gradient-to-br text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.1)]",
                  g,
                )}
              >
                {PROOF_INITIALS[i]}
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-3 fill-[var(--yellow)] text-[var(--yellow)]"
                />
              ))}
              <span className="ml-1 text-[11px] font-bold text-foreground">
                4.9
              </span>
            </div>
            <span className="text-[10.5px] font-semibold text-muted-foreground">
              12K+ siswa aktif belajar bareng Spark
            </span>
          </div>
        </div>
        <TrustedByStrip />
      </Reveal>
    </aside>
  );
}

function ChatPreview() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/85 p-3.5 shadow-[0_12px_32px_rgba(80,20,50,0.1)] backdrop-blur-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-[var(--coral)]/15 blur-2xl"
      />
      <div className="relative mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_2px_8px_rgba(225,29,72,0.35)]">
            <Sparkles size={13} strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-heading text-[12px] font-bold leading-none text-foreground">
              Spark
            </p>
            <p className="text-[9px] font-semibold text-muted-foreground">
              Matematika • Integral
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[color-mix(in_oklch,var(--teal)_15%,transparent)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--teal)]">
          <span
            className="size-1.5 rounded-full bg-[var(--teal)]"
            style={{ animation: "pulse-soft 1.5s ease-in-out infinite" }}
          />
          Live
        </span>
      </div>

      <div className="relative space-y-2">
        <ChatBubble side="user">Kak, integral tuh apa sih? 😵</ChatBubble>
        <ChatBubble side="ai">
          Hmm, sebelum kita mulai — kamu masih inget konsep turunan? 🤔
        </ChatBubble>
        <ChatBubble side="user">Turunan itu... perubahan suatu fungsi?</ChatBubble>
        <ChatBubble side="ai">
          Betul! Nah, integral itu{" "}
          <span className="font-bold text-[var(--coral)]">kebalikannya</span>.
          Bisa tebak gimana cara dapet luas di bawah kurva?
        </ChatBubble>
        <div className="flex items-center gap-1.5 pt-1 pl-1">
          <div className="flex items-center gap-1 rounded-full bg-[var(--coral)]/10 px-2 py-0.5 text-[9.5px] font-bold text-[var(--coral)]">
            <Sparkles size={9} strokeWidth={2.5} />
            +15 XP
          </div>
          <span className="text-[9.5px] font-semibold text-muted-foreground">
            Jawabanmu bener 🎉
          </span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  children,
  side,
}: {
  children: React.ReactNode;
  side: "ai" | "user";
}) {
  if (side === "ai") {
    return (
      <div className="flex items-start gap-1.5">
        <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white">
          <Sparkles size={9} strokeWidth={2.5} />
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted/60 px-2.5 py-1.5 text-[11.5px] leading-snug text-foreground/90">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start justify-end gap-1.5">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[var(--coral)]/10 px-2.5 py-1.5 text-[11.5px] leading-snug text-foreground/90">
        {children}
      </div>
      <div className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] text-[8px] font-bold text-white">
        R
      </div>
    </div>
  );
}

function TestimonialCard() {
  return (
    <figure className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/85 p-3.5 shadow-[0_8px_24px_rgba(80,20,50,0.08)] backdrop-blur-md">
      <Quote
        className="absolute right-2.5 top-2.5 size-5 text-[var(--coral)]/25"
        aria-hidden
      />
      <div
        className="mb-2 flex items-center gap-0.5"
        aria-label="Rating 5 dari 5"
      >
        {Array.from({ length: 5 }).map((_, j) => (
          <Star
            key={j}
            className="size-3 fill-[var(--yellow)] text-[var(--yellow)]"
          />
        ))}
      </div>
      <blockquote className="text-[12.5px] leading-relaxed text-foreground/85">
        “Dulu malu nanya ke guru. Pake Spark, aku bisa nanya kapan aja tanpa
        dihakimi. Nilai matematika naik dari{" "}
        <span className="font-bold text-[var(--coral)]">70 ke 85</span>.”
      </blockquote>
      <figcaption className="mt-3 flex items-center gap-2.5 border-t border-dashed border-border/60 pt-2.5">
        <div
          className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-[10px] font-bold text-white shadow-[0_2px_6px_rgba(0,0,0,0.1)]"
          aria-hidden
        >
          RA
        </div>
        <div>
          <p className="text-[11.5px] font-bold text-foreground">Rina Aulia</p>
          <p className="text-[10px] text-muted-foreground">Kelas 11 SMK • TKJ</p>
        </div>
      </figcaption>
    </figure>
  );
}

function TrustedByStrip() {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      <span className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground/70">
        Selaras dengan
      </span>
      {TRUSTED_BY.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-card/50 px-2 py-0.5 text-[10px] font-semibold text-foreground/80 backdrop-blur-sm"
        >
          <CheckCircle2 size={9} className="text-[var(--teal)]" />
          {item}
        </span>
      ))}
    </div>
  );
}

function FloatingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute -left-32 top-20 size-[480px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.75 0.18 350 / 0.5), transparent 70%)",
          animation: "drift 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-32 top-1/3 size-[520px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.82 0.15 75 / 0.5), transparent 70%)",
          animation: "drift 22s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute bottom-10 left-1/3 size-[400px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.78 0.14 175 / 0.4), transparent 70%)",
          animation: "drift 25s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}

export { GoogleIcon, SparkleIcon };

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-4", className)}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <Rocket
      className={cn(
        "text-[var(--coral)] transition-transform group-hover/button:translate-x-0.5",
        className,
      )}
      size={16}
      strokeWidth={2.5}
    />
  );
}
