import type * as React from "react";

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh w-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--hero-bg)" }}
      >
        <div
          className="absolute -left-32 top-20 size-[420px] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.75 0.18 350 / 0.45), transparent 70%)",
            animation: "drift 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -right-32 top-1/3 size-[380px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.82 0.15 75 / 0.45), transparent 70%)",
            animation: "drift 26s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute bottom-20 left-1/3 size-[360px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, oklch(0.78 0.14 175 / 0.4), transparent 70%)",
            animation: "drift 30s ease-in-out infinite",
          }}
        />
      </div>
      <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
