"use client";

import * as React from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Kembali ke atas"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-full border border-border/40 bg-background/85 text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.18)]",
        show
          ? "opacity-100 pointer-events-auto"
          : "pointer-events-none opacity-0 translate-y-2",
      )}
    >
      <ArrowUp size={18} />
    </button>
  );
}
