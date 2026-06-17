export default function ChatLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-56 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Chat list skeleton */}
      <div className="grid gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card/60 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted/60" />
              </div>
              <div className="h-3 w-12 rounded bg-muted/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
