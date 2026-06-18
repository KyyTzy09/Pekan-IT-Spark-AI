export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Hero section skeleton */}
      <div className="rounded-3xl border border-border/40 bg-card/80 p-6 animate-pulse sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 rounded-full bg-muted/60" />
            <div className="h-7 w-48 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted/60" />
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-xl bg-muted/60" />
              <div className="h-6 w-28 rounded-xl bg-muted/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Content grid skeleton */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 md:col-span-6">
          <div className="rounded-3xl border border-border/40 bg-card/65 p-6 animate-pulse">
            <div className="h-5 w-40 rounded bg-muted mb-4" />
            <div className="h-48 w-full rounded-xl bg-muted/40" />
          </div>
          <div className="rounded-3xl border border-border/40 bg-card/65 p-6 animate-pulse">
            <div className="h-5 w-40 rounded bg-muted mb-4" />
            <div className="h-32 w-full rounded-xl bg-muted/40" />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6 md:col-span-6">
          <div className="rounded-3xl border border-border/40 bg-card/50 p-6 animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-5 w-36 rounded bg-muted" />
              <div className="h-6 w-16 rounded-xl bg-muted/60" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-3 rounded-2xl border border-border/30"
                >
                  <div className="h-12 w-12 rounded-2xl bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-48 rounded bg-muted/60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
