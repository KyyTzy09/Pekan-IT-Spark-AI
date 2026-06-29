"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import * as React from "react";

interface EmojiConfig {
  emoji: string;
  label: string;
  top: string; // Vertical position down the page (absolute)
  side: "left" | "right";
  xOffset: string; // Horizontal offset from side
  parallaxFactor: number; // Speed multiplier for scroll parallax
  scale: string; // Tailwind text size
  glowColor: string; // Glow color
  driftDuration: string; // CSS animation duration
}

const EMOJIS: EmojiConfig[] = [
  {
    emoji: "✨",
    label: "sparkles",
    top: "12%",
    side: "left",
    xOffset: "4%",
    parallaxFactor: 0.15,
    scale: "text-4xl sm:text-5xl",
    glowColor: "var(--coral)",
    driftDuration: "6s",
  },
  {
    emoji: "💡",
    label: "idea",
    top: "22%",
    side: "right",
    xOffset: "5%",
    parallaxFactor: -0.12,
    scale: "text-5xl",
    glowColor: "var(--yellow)",
    driftDuration: "8s",
  },
  {
    emoji: "🧠",
    label: "brain",
    top: "35%",
    side: "left",
    xOffset: "6%",
    parallaxFactor: 0.18,
    scale: "text-5xl sm:text-6xl",
    glowColor: "var(--purple)",
    driftDuration: "9s",
  },
  {
    emoji: "🎯",
    label: "target",
    top: "48%",
    side: "right",
    xOffset: "4%",
    parallaxFactor: -0.08,
    scale: "text-4xl sm:text-5xl",
    glowColor: "var(--orange)",
    driftDuration: "7s",
  },
  {
    emoji: "📚",
    label: "books",
    top: "60%",
    side: "left",
    xOffset: "5%",
    parallaxFactor: 0.14,
    scale: "text-5xl",
    glowColor: "var(--teal)",
    driftDuration: "10s",
  },
  {
    emoji: "🚀",
    label: "rocket",
    top: "72%",
    side: "right",
    xOffset: "6%",
    parallaxFactor: -0.15,
    scale: "text-5xl sm:text-6xl",
    glowColor: "var(--blue)",
    driftDuration: "8s",
  },
  {
    emoji: "🔥",
    label: "streak",
    top: "84%",
    side: "left",
    xOffset: "4%",
    parallaxFactor: 0.12,
    scale: "text-4xl sm:text-5xl",
    glowColor: "var(--coral)",
    driftDuration: "6s",
  },
  {
    emoji: "💯",
    label: "perfect",
    top: "92%",
    side: "right",
    xOffset: "5%",
    parallaxFactor: -0.1,
    scale: "text-4xl sm:text-5xl",
    glowColor: "var(--green)",
    driftDuration: "7s",
  },
];

export function FloatingEmojis() {
  const [enabled, setEnabled] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const isMobile = window.innerWidth < 1024; // lg breakpoint
    setEnabled(!mq.matches && !isMobile);
  }, []);

  if (!enabled) return null;
  return <FloatingEmojisInner />;
}

function FloatingEmojisInner() {
  const { scrollY } = useScroll();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {EMOJIS.map((item, idx) => {
        return (
          <FloatingEmojiItem
            key={`${item.emoji}-${idx}`}
            item={item}
            scrollY={scrollY}
            idx={idx}
          />
        );
      })}
    </div>
  );
}

function FloatingEmojiItem({
  item,
  scrollY,
  idx,
}: {
  item: EmojiConfig;
  scrollY: any;
  idx: number;
}) {
  // Map page scroll to a gentle vertical offset
  const rawY = useTransform(scrollY, [0, 5000], [0, item.parallaxFactor * 450]);
  const y = useSpring(rawY, {
    stiffness: 45,
    damping: 15,
    mass: 0.4,
  });

  const positionStyles =
    item.side === "left"
      ? { left: item.xOffset, top: item.top }
      : { right: item.xOffset, top: item.top };

  return (
    <motion.div
      style={{
        ...positionStyles,
        y,
        willChange: "transform",
      }}
      className="absolute flex items-center justify-center"
    >
      {/* Soft back glow — reduced blur for mobile perf */}
      <div
        className="absolute -z-10 size-24 rounded-full opacity-20 blur-lg transition-all duration-500 hover:opacity-45"
        style={{
          background: `radial-gradient(circle, ${item.glowColor} 0%, transparent 70%)`,
        }}
      />
      {/* Emoji element with drift and hover animations */}
      <span
        role="img"
        aria-label={item.label}
        className={`select-none ${item.scale} will-change-[transform] transition-all duration-300 hover:scale-125`}
        style={{
          display: "inline-block",
          filter:
            "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.12)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08))",
          animation: `drift ${item.driftDuration} ease-in-out infinite ${idx * 0.5}s`,
        }}
      >
        {item.emoji}
      </span>
    </motion.div>
  );
}
