export default function ChallengeLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-52 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Progress bar skeleton */}
      <div className="rounded-2xl border border-border/40 bg-card/60 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted/60" />
        </div>
        <div className="h-3 w-full rounded-full bg-muted/40" />
      </div>

      {/* Challenge cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card/60 p-5 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="h-5 w-36 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted/60" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 w-full rounded bg-muted/40" />
              <div className="h-3 w-3/4 rounded bg-muted/40" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/20">
              <div className="h-4 w-20 rounded bg-muted/60" />
              <div className="h-8 w-20 rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
