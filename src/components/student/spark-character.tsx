"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getAvatarCustomizationAction } from "@/server/actions/gamification";

export function SparkCharacter({
  size = "md",
  className,
  color: propColor,
  accessory: propAccessory,
  background: propBackground,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: string;
  accessory?: string | null;
  background?: string | null;
}) {
  const [dbCustom, setDbCustom] = React.useState<{
    color: string;
    accessory: string | null;
    background: string | null;
  } | null>(null);

  React.useEffect(() => {
    // Auto-fetch if customization is not explicitly supplied as props
    if (
      propColor === undefined &&
      propAccessory === undefined &&
      propBackground === undefined
    ) {
      getAvatarCustomizationAction().then((res) => {
        if (res.ok && res.avatar) {
          setDbCustom({
            color: res.avatar.color,
            accessory: res.avatar.accessory,
            background: res.avatar.background,
          });
        }
      });
    }
  }, [propColor, propAccessory, propBackground]);

  // Determine active choices (prop values fallback to db values fallback to default)
  const color = propColor ?? dbCustom?.color ?? "default";
  const accessory = propAccessory ?? dbCustom?.accessory ?? "none";
  const background = propBackground ?? dbCustom?.background ?? "default";

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

  // Color gradient mappings
  let gradientBg =
    "linear-gradient(135deg, oklch(0.78 0.18 25), oklch(0.72 0.18 350))"; // Default red/orange
  let shadowColor =
    "0 18px 40px rgba(225, 29, 72, 0.35), inset 0 -10px 20px rgba(160, 18, 60, 0.25)";

  if (color === "blue") {
    gradientBg =
      "linear-gradient(135deg, oklch(0.72 0.15 190), oklch(0.65 0.15 230))";
    shadowColor =
      "0 18px 40px rgba(14, 116, 144, 0.35), inset 0 -10px 20px rgba(8, 86, 107, 0.25)";
  } else if (color === "green") {
    gradientBg =
      "linear-gradient(135deg, oklch(0.75 0.15 140), oklch(0.68 0.15 160))";
    shadowColor =
      "0 18px 40px rgba(16, 185, 129, 0.35), inset 0 -10px 20px rgba(4, 120, 87, 0.25)";
  } else if (color === "purple") {
    gradientBg =
      "linear-gradient(135deg, oklch(0.65 0.2 290), oklch(0.58 0.2 320))";
    shadowColor =
      "0 18px 40px rgba(139, 92, 246, 0.35), inset 0 -10px 20px rgba(91, 33, 182, 0.25)";
  } else if (color === "gold") {
    gradientBg =
      "linear-gradient(135deg, oklch(0.85 0.15 85), oklch(0.75 0.15 70))";
    shadowColor =
      "0 18px 40px rgba(245, 158, 11, 0.35), inset 0 -10px 20px rgba(180, 83, 9, 0.25)";
  }

  // Glow / background mappings
  let glowStyle: React.CSSProperties = {
    background:
      "radial-gradient(circle, oklch(0.82 0.15 25 / 0.55), transparent 70%)",
  };
  if (background === "aurora") {
    glowStyle = {
      background:
        "linear-gradient(45deg, oklch(0.8 0.12 140 / 0.45), oklch(0.7 0.15 290 / 0.45))",
    };
  } else if (background === "space") {
    glowStyle = {
      background:
        "radial-gradient(circle, oklch(0.3 0.1 240 / 0.7), transparent 75%)",
    };
  } else if (background === "neon") {
    glowStyle = {
      background:
        "linear-gradient(135deg, oklch(0.7 0.25 330 / 0.5), oklch(0.75 0.2 200 / 0.5))",
    };
  }

  // Accessory overlay sizes and offsets
  let accessoryNode = null;
  if (accessory === "glasses") {
    const glassesSize =
      size === "lg"
        ? "text-4xl -mt-1"
        : size === "md"
          ? "text-xl"
          : "text-[10px]";
    accessoryNode = (
      <span
        className={cn(
          "absolute z-10 select-none pointer-events-none",
          glassesSize,
        )}
      >
        👓
      </span>
    );
  } else if (accessory === "hat") {
    const hatSize =
      size === "lg"
        ? "text-5xl -mt-16 sm:-mt-20"
        : size === "md"
          ? "text-3xl -mt-11"
          : "text-base -mt-6";
    accessoryNode = (
      <span
        className={cn("absolute z-10 select-none pointer-events-none", hatSize)}
      >
        🎓
      </span>
    );
  } else if (accessory === "crown") {
    const crownSize =
      size === "lg"
        ? "text-5xl -mt-16 sm:-mt-20"
        : size === "md"
          ? "text-3xl -mt-11"
          : "text-base -mt-6";
    accessoryNode = (
      <span
        className={cn(
          "absolute z-10 select-none pointer-events-none animate-bounce",
          crownSize,
        )}
      >
        👑
      </span>
    );
  } else if (accessory === "ribbon") {
    const ribbonSize =
      size === "lg"
        ? "text-4xl mt-14 ml-12"
        : size === "md"
          ? "text-xl mt-8 ml-8"
          : "text-[10px] mt-4 ml-4";
    accessoryNode = (
      <span
        className={cn(
          "absolute z-10 select-none pointer-events-none",
          ribbonSize,
        )}
      >
        🎀
      </span>
    );
  }

  return (
    <div
      className={cn("relative grid place-items-center", dimension, className)}
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full opacity-50 blur-2xl"
        style={{
          ...glowStyle,
          animation: "drift 8s ease-in-out infinite",
        }}
      />
      <div
        className="relative grid size-full place-items-center rounded-full"
        style={{
          background: gradientBg,
          boxShadow: `${shadowColor}, inset 0 6px 12px rgba(255, 255, 255, 0.4)`,
        }}
      >
        <span
          className={cn("leading-none relative z-0", emojiSize)}
          role="img"
          aria-label="Spark"
        >
          🦊
        </span>
        {accessoryNode}
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
