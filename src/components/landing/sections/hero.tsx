"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Rocket,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";
import { Reveal } from "../../shared/reveal";

const SUBJECTS = ["Matematika", "B. Indonesia", "B. Inggris", "IPA"];

export function Hero() {
  const [pause, setPause] = React.useState(false);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && session?.user;
  const role = session?.user?.role as string | undefined;
  const home =
    role === "PARENT" ? "/parent" : role === "ADMIN" ? "/admin" : "/dashboard";
  const ctaHref = isLoggedIn ? home : "/auth/register";
  const ctaLabel = isLoggedIn ? "Lanjut Belajar" : "Mulai Belajar Gratis";
  const CtaIcon = isLoggedIn ? ArrowRight : Rocket;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPause(mq.matches);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* ── Background particles ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
        <div
          className="absolute left-[5%] top-[10%] size-2.5 rounded-full bg-[var(--coral)] opacity-70 will-change-[transform]"
          style={{
            animation: pause ? undefined : "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[8%] top-[18%] size-1.5 rounded-full bg-[var(--yellow)] opacity-80 will-change-[transform]"
          style={{
            animation: pause ? undefined : "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-[25%] left-[12%] size-2 rounded-full bg-[var(--teal)] opacity-60 will-change-[transform]"
          style={{
            animation: pause ? undefined : "float 7s ease-in-out infinite",
          }}
        />
        <div
          className="absolute right-[15%] bottom-[12%] size-2.5 rounded-full bg-[var(--purple)] opacity-60 will-change-[transform]"
          style={{
            animation: pause ? undefined : "float 9s ease-in-out infinite",
          }}
        />
        <div
          className="absolute left-1/4 top-1/2 size-1.5 rounded-full bg-[var(--pink)] opacity-60 will-change-[transform]"
          style={{
            animation: pause ? undefined : "float 7.5s ease-in-out infinite",
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

      <div className="container-px relative grid items-center gap-10 py-14 md:grid-cols-[1.1fr_0.9fr] md:gap-14 md:py-20">
        {/* ── LEFT SIDE ── */}
        <Reveal className="relative z-10 max-w-[640px]">
          {/* Subject pills row */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {SUBJECTS.map((subj, i) => (
              <span
                key={subj}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card/80 px-3 py-1 text-[11px] font-bold text-muted-foreground backdrop-blur-sm transition-all duration-300 hover:border-[var(--coral)]/30 hover:text-foreground"
                style={{
                  animation: pause
                    ? undefined
                    : `slide-up 0.5s ease-out ${i * 0.08}s backwards`,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{
                    background: [
                      "var(--coral)",
                      "var(--blue)",
                      "var(--teal)",
                      "var(--yellow)",
                    ][i],
                  }}
                />
                {subj}
              </span>
            ))}
          </div>

          {/* Heading with wave emoji */}
          <h1 className="mb-3 font-heading text-[40px] font-bold leading-[1.05] tracking-tight md:text-[52px] lg:text-[60px]">
            Tutor AI yang{" "}
            <span
              className="inline-block"
              style={{
                animation: pause ? undefined : "wave 1.5s ease-in-out infinite",
                transformOrigin: "70% 70%",
              }}
            >
              👋
            </span>
            <br />
            bikin kamu{" "}
            <span className="text-gradient-warm">beneran paham.</span>
          </h1>

          <p className="mb-7 max-w-[480px] text-[15px] leading-relaxed text-muted-foreground">
            Bukan sekadar jawaban — Spark nemenin proses belajar kamu dari awal
            sampai tuntas, pakai bahasa yang santai dan metode yang terbukti.
          </p>

          {/* CTA + Social proof row */}
          <div className="flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="xl"
              className="rounded-full shadow-[0_8px_24px_rgba(225,29,72,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(225,29,72,0.55)]"
            >
              <Link href={ctaHref}>
                <CtaIcon size={18} />
                {ctaLabel}
                <ArrowRight size={16} />
              </Link>
            </Button>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 px-3 py-1.5">
                <TrendingUp size={14} className="text-[var(--teal)]" />
                <span className="text-[11px] font-bold text-foreground">
                  Gratis & Terbuka
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 px-3 py-1.5">
                <Zap size={14} className="text-[var(--yellow)]" />
                <span className="text-[11px] font-bold text-foreground">
                  Tanpa Batas Waktu
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── RIGHT SIDE: Interactive Chat Preview ── */}
        <Reveal delay={120} className="relative mx-auto w-full max-w-[460px]">
          <ChatPreview pause={pause} />
        </Reveal>
      </div>

      <TrustedByMarquee />
    </section>
  );
}

/* ─── Interactive Chat Preview ─────── */

const CHAT_MESSAGES = [
  {
    role: "student" as const,
    text: "Kak, aku ga ngerti pecahan 😅",
    delay: 0.3,
  },
  {
    role: "spark" as const,
    text: "Oke! Bayangin pizza dipotong 4 bagian 🍕 Kalau kamu ambil 1 potong, itu berapa per berapa dari seluruh pizza?",
    delay: 1.8,
  },
  {
    role: "student" as const,
    text: "Oh, 1/4 ya! Aku paham sekarang 😲",
    delay: 3.6,
  },
];

const MATH_DECORATIONS = [
  { symbol: "+", top: "8%", left: "92%", delay: 0, dur: "7s" },
  { symbol: "×", top: "25%", left: "-4%", delay: 1, dur: "8s" },
  { symbol: "=", top: "75%", left: "95%", delay: 2, dur: "6s" },
  { symbol: "π", top: "90%", left: "5%", delay: 0.5, dur: "9s" },
  { symbol: "√", top: "45%", left: "98%", delay: 1.5, dur: "7.5s" },
];

function ChatPreview({ pause }: { pause: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleMsgs, setVisibleMsgs] = React.useState(0);
  const [showTyping, setShowTyping] = React.useState(false);

  React.useEffect(() => {
    if (!isInView || pause) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Show typing, then message 1
    timers.push(setTimeout(() => setShowTyping(true), 200));
    timers.push(
      setTimeout(() => {
        setShowTyping(false);
        setVisibleMsgs(1);
      }, 800),
    );

    // Show typing, then message 2
    timers.push(setTimeout(() => setShowTyping(true), 1600));
    timers.push(
      setTimeout(() => {
        setShowTyping(false);
        setVisibleMsgs(2);
      }, 2800),
    );

    // Show typing, then message 3
    timers.push(setTimeout(() => setShowTyping(true), 3400));
    timers.push(
      setTimeout(() => {
        setShowTyping(false);
        setVisibleMsgs(3);
      }, 4200),
    );

    return () => timers.forEach(clearTimeout);
  }, [isInView, pause]);

  return (
    <div ref={ref} className="relative">
      {/* Floating math decorations — hidden on mobile (decorative) */}
      {!pause &&
        MATH_DECORATIONS.map((d) => (
          <span
            key={d.symbol}
            aria-hidden
            className="pointer-events-none absolute z-0 hidden select-none font-heading text-xl font-bold text-foreground/10 md:block"
            style={{
              top: d.top,
              left: d.left,
              animation: `float ${d.dur} ease-in-out ${d.delay}s infinite`,
            }}
          >
            {d.symbol}
          </span>
        ))}

      {/* Glow behind the chat window — reduced blur on mobile */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] opacity-40 blur-xl will-change-[transform] lg:blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(139,92,246,0.3), transparent 60%), radial-gradient(circle at 70% 60%, rgba(225,29,72,0.2), transparent 60%)",
          animation: pause ? undefined : "pulse-soft 4s ease-in-out infinite",
        }}
      />

      {/* Morphing blob accent — reduced blur on mobile */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 size-32 opacity-20 blur-lg will-change-[transform] lg:blur-2xl"
        style={{
          background: "linear-gradient(135deg, var(--coral), var(--purple))",
          animation: pause ? undefined : "morph-blob 8s ease-in-out infinite",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}
      />

      {/* Chat window */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 overflow-hidden rounded-3xl border border-border/50 bg-card/90 shadow-[0_20px_60px_rgba(80,20,50,0.15)] backdrop-blur-md lg:backdrop-blur-xl"
      >
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-border/30 px-5 py-3.5">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_12px_rgba(225,29,72,0.3)]">
            <GraduationCap size={16} strokeWidth={2.5} />
            <span
              className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-[var(--teal)]"
              style={{
                animation: pause
                  ? undefined
                  : "pulse-soft 2s ease-in-out infinite",
              }}
            />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">Spark AI</p>
            <p className="text-[10px] font-semibold text-[var(--teal)]">
              ● Online sekarang
            </p>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="size-2 rounded-full bg-[var(--teal)] opacity-60" />
            <div className="size-2 rounded-full bg-[var(--yellow)] opacity-60" />
            <div className="size-2 rounded-full bg-[var(--coral)] opacity-60" />
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex min-h-[260px] flex-col gap-3 px-4 py-5">
          <AnimatePresence>
            {CHAT_MESSAGES.slice(0, visibleMsgs).map((msg, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  x: msg.role === "student" ? 20 : -20,
                  scale: 0.9,
                }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                }}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed",
                  msg.role === "student"
                    ? "ml-auto rounded-br-md bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-[0_4px_16px_rgba(225,29,72,0.25)]"
                    : "mr-auto rounded-bl-md border border-border/30 bg-muted/60 text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.05)]",
                )}
              >
                {msg.role === "spark" && (
                  <span className="mb-1 flex items-center gap-1 text-[10px] font-bold text-[var(--purple)]">
                    <Sparkles size={10} />
                    Spark AI
                  </span>
                )}
                {msg.text}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {showTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mr-auto flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border/30 bg-muted/60 px-4 py-3"
              >
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="size-1.5 rounded-full bg-muted-foreground/60 will-change-[transform]"
                    style={{
                      animation: `float 1.2s ease-in-out ${dot * 0.15}s infinite`,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat input mock */}
        <div className="border-t border-border/30 px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/30 bg-background/60 px-3.5 py-2.5">
            <span className="text-[12px] text-muted-foreground/50">
              Tanya Spark apa aja...
            </span>
            <div className="ml-auto grid size-7 place-items-center rounded-lg bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-sm">
              <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating badges — hidden on mobile (decorative) */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute -right-3 top-[20%] z-20 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white/90 p-2.5 shadow-[0_10px_24px_rgba(80,20,50,0.12)] backdrop-blur-md will-change-[transform] dark:border-border/40 dark:bg-card/90 md:flex"
        style={{
          animation: pause ? undefined : "float 5s ease-in-out infinite",
        }}
      >
        <Sparkles size={14} className="text-[var(--coral)]" />
        <span className="text-[11px] font-bold text-foreground">+50 XP</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute -left-3 bottom-[25%] z-20 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white/90 p-2.5 shadow-[0_10px_24px_rgba(80,20,50,0.12)] backdrop-blur-md will-change-[transform] dark:border-border/40 dark:bg-card/90 md:flex"
        style={{
          animation: pause ? undefined : "float 6s ease-in-out 1.5s infinite",
        }}
      >
        <CheckCircle2 size={14} className="text-[var(--teal)]" />
        <span className="text-[11px] font-bold text-foreground">Paham! ✓</span>
      </motion.div>
    </div>
  );
}

function TrustedByMarquee() {
  const items = [
    "Kurikulum Merdeka",
    "CP & ATP Resmi",
    "BSE Kemendikbud",
    "Selaras dengan sekolah",
    "Gratis untuk siswa",
    "24/7 tutor AI",
  ];

  return (
    <div className="border-y border-dashed border-border/40 bg-card/30 py-4 backdrop-blur-sm will-change-[transform]">
      <div className="container-px flex items-center gap-6 overflow-hidden">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Selaras dengan
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex gap-8 whitespace-nowrap will-change-[transform]"
            style={{ animation: "scroll-x 30s linear infinite" }}
          >
            {[...items, ...items].map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="flex items-center gap-2 text-[12px] font-bold text-foreground/60"
              >
                <CheckCircle2 size={12} className="text-[var(--teal)]" />
                {item}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>
    </div>
  );
}
