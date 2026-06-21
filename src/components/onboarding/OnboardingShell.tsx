import type * as React from "react";

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh w-full flex-col overflow-x-hidden">
      {/* Background - subtle gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[oklch(0.99_0.005_80)] via-[oklch(0.98_0.01_350)] to-[oklch(0.97_0.015_175)] dark:from-[oklch(0.08_0.01_260)] dark:via-[oklch(0.10_0.02_350)] dark:to-[oklch(0.12_0.02_175)]"
      />

      {/* Subtle pattern overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
