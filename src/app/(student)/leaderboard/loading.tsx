export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-44 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Top 3 podium skeleton */}
      <div className="flex items-end justify-center gap-4 py-8">
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-16 w-16 rounded-full bg-muted mb-2" />
          <div className="h-4 w-20 rounded bg-muted/60 mb-1" />
          <div className="h-24 w-20 rounded-t-xl bg-muted/40" />
        </div>
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-20 w-20 rounded-full bg-muted mb-2" />
          <div className="h-4 w-24 rounded bg-muted/60 mb-1" />
          <div className="h-32 w-24 rounded-t-xl bg-muted/40" />
        </div>
        <div className="flex flex-col items-center animate-pulse">
          <div className="h-16 w-16 rounded-full bg-muted mb-2" />
          <div className="h-4 w-20 rounded bg-muted/60 mb-1" />
          <div className="h-20 w-20 rounded-t-xl bg-muted/40" />
        </div>
      </div>

      {/* Leaderboard list skeleton */}
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/40 bg-card/60 p-4 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="h-6 w-8 rounded bg-muted" />
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted/60" />
              </div>
              <div className="h-4 w-16 rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
