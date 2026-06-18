export default function PracticeLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-44 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card/60 p-5 animate-pulse"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-6 w-6 rounded bg-muted/60" />
            </div>
            <div className="h-7 w-12 rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Question area skeleton */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 w-24 rounded bg-muted/60" />
          <div className="space-y-2">
            <div className="h-5 w-full rounded bg-muted" />
            <div className="h-5 w-3/4 rounded bg-muted" />
          </div>
          <div className="space-y-3 pt-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl border border-border/40 bg-muted/40"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
