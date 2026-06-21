import { OnboardingShell } from "@/components/onboarding/OnboardingShell";

export default function OnboardingLoading() {
  return (
    <OnboardingShell>
      <div className="flex flex-1 flex-col">
        {/* Header skeleton */}
        <header className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-3 w-32 animate-skeleton-loading rounded-full bg-muted" />
            <div className="h-3 w-20 animate-skeleton-loading rounded-full bg-muted" />
          </div>
          <div className="h-7 w-64 animate-skeleton-loading rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-80 animate-skeleton-loading rounded-lg bg-muted" />
        </header>

        {/* Progress skeleton */}
        <div className="mb-6 space-y-3">
          <div className="h-1.5 animate-skeleton-loading rounded-full bg-muted" />
          <div className="flex items-center justify-between gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-7 animate-skeleton-loading rounded-full bg-muted" />
                <div className="hidden h-3 w-12 animate-skeleton-loading rounded bg-muted sm:block" />
              </div>
            ))}
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          <div className="size-40 animate-skeleton-loading rounded-full bg-muted" />
          <div className="space-y-3 text-center">
            <div className="mx-auto h-8 w-64 animate-skeleton-loading rounded-lg bg-muted" />
            <div className="mx-auto h-4 w-96 animate-skeleton-loading rounded-lg bg-muted" />
          </div>
          <div className="w-full space-y-3">
            <div className="h-40 animate-skeleton-loading rounded-xl bg-muted" />
            <div className="h-40 animate-skeleton-loading rounded-xl bg-muted" />
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
