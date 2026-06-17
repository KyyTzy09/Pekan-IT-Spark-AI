export default function SubjectsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
      </div>

      {/* Subjects grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card/60 p-5 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted/60" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-muted/40" />
              <div className="flex justify-between">
                <div className="h-3 w-12 rounded bg-muted/60" />
                <div className="h-3 w-8 rounded bg-muted/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
