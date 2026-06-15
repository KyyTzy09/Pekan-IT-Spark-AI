import { cn } from "@/lib/utils";

export function SparkCharacter({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimension =
    size === "lg"
      ? "size-32 sm:size-40"
      : size === "md"
        ? "size-20"
        : "size-12";
  const emojiSize =
    size === "lg"
      ? "text-[64px] sm:text-[80px]"
      : size === "md"
        ? "text-4xl"
        : "text-xl";
  const sparkSize =
    size === "lg" ? "size-3" : size === "md" ? "size-2" : "size-1.5";

  return (
    <div
      className={cn("relative grid place-items-center", dimension, className)}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full opacity-50 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.82 0.15 25 / 0.55), transparent 70%)",
          animation: "drift 8s ease-in-out infinite",
        }}
      />
      <div
        className="relative grid size-full place-items-center rounded-full"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.78 0.18 25), oklch(0.72 0.18 350))",
          boxShadow:
            "0 18px 40px rgba(225, 29, 72, 0.35), inset 0 -10px 20px rgba(160, 18, 60, 0.25), inset 0 6px 12px rgba(255, 255, 255, 0.4)",
        }}
      >
        <span
          className={cn("leading-none", emojiSize)}
          role="img"
          aria-label="Spark"
        >
          🦊
        </span>
      </div>
      <span
        className={cn(
          "absolute right-1 top-2 rounded-full bg-[var(--yellow)]",
          sparkSize,
        )}
        style={{ boxShadow: "0 0 12px var(--yellow)" }}
      />
      <span
        className={cn(
          "absolute left-2 top-1/3 rounded-full bg-[var(--teal)]",
          sparkSize,
        )}
        style={{ boxShadow: "0 0 10px var(--teal)" }}
      />
      <span
        className={cn(
          "absolute bottom-2 right-2 rounded-full bg-[var(--purple)]",
          sparkSize,
        )}
        style={{ boxShadow: "0 0 10px var(--purple)" }}
      />
    </div>
  );
}
