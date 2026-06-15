"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 22,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] origin-left bg-gradient-to-r from-[var(--coral)] via-[var(--orange)] via-[var(--yellow)] via-[var(--teal)] to-[var(--purple)]"
      style={{
        scaleX,
        boxShadow: "0 0 10px rgba(225, 29, 72, 0.5)",
      }}
    />
  );
}
