export default function DashboardLoading() {
  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Hero Greeting skeleton */}
      <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 sm:p-7 animate-pulse">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-6 w-48 rounded bg-muted" />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-8 w-24 rounded-full bg-muted" />
            <div className="h-8 w-20 rounded-full bg-muted" />
          </div>
        </div>
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-border/40 bg-background/40 px-3.5 py-2.5">
          <div className="size-7 rounded-xl bg-muted" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
          </div>
        </div>
      </section>

      {/* Stats Row skeleton - 3 columns */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card/60 p-4 sm:p-5 animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="size-9 rounded-xl bg-muted" />
              <div className="h-3 w-12 rounded bg-muted" />
            </div>
            <div className="h-8 w-16 rounded bg-muted mb-1" />
            <div className="h-3 w-32 rounded bg-muted mb-3" />
            <div className="h-2 w-full rounded-full bg-muted/40" />
            <div className="h-3 w-24 rounded bg-muted mt-2" />
          </div>
        ))}
      </div>

      {/* Weekly Activity Chart skeleton */}
      <div className="rounded-3xl border border-border/40 bg-card/80 p-5 sm:p-6 animate-pulse">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="size-9 rounded-xl bg-muted" />
          <div className="space-y-1">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
        </div>
        <div className="h-48 w-full rounded-xl bg-muted/40" />
      </div>

      {/* Continue Learning skeleton */}
      <div className="rounded-2xl border border-border/40 bg-card/80 p-5 sm:p-6 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="h-5 w-20 rounded-full bg-muted" />
        </div>
        <div className="h-6 w-48 rounded bg-muted mb-2" />
        <div className="h-4 w-full rounded bg-muted mb-4" />
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-4 w-40 rounded bg-muted" />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-8 w-24 rounded-full bg-muted" />
          <div className="h-8 w-20 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
