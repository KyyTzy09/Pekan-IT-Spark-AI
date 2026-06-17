import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

export default function OnboardingLoading() {
  return (
    <OnboardingShell>
      <div className="flex flex-1 flex-col">
        <header className="mb-6">
          <div className="h-3 w-24 animate-skeleton-loading rounded-full bg-muted" />
          <div className="mt-2 h-7 w-56 animate-skeleton-loading rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-72 animate-skeleton-loading rounded-lg bg-muted" />
        </header>

        <div className="flex gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 animate-skeleton-loading rounded-full bg-muted"
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="size-24 animate-skeleton-loading rounded-full bg-muted" />
          <div className="h-4 w-48 animate-skeleton-loading rounded-lg bg-muted" />
          <div className="h-3 w-64 animate-skeleton-loading rounded-lg bg-muted" />
        </div>
      </div>
    </OnboardingShell>
  );
}
