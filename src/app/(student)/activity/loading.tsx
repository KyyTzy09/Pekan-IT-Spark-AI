export default function ActivityLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-44 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card/60 p-5 animate-pulse"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
            <div className="h-7 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-muted mb-4" />
        <div className="h-48 w-full rounded-xl bg-muted/40" />
      </div>

      {/* Activity list skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/40 bg-card/60 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
