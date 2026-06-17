export default function UploadLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded bg-muted/60 animate-pulse" />
      </div>

      {/* Upload area skeleton */}
      <div className="rounded-3xl border-2 border-dashed border-border/40 bg-card/40 p-12 animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted" />
          <div className="space-y-2 text-center">
            <div className="h-5 w-48 rounded bg-muted" />
            <div className="h-4 w-64 rounded bg-muted/60" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-muted" />
        </div>
      </div>

      {/* Documents list skeleton */}
      <div className="space-y-4">
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        <div className="grid gap-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/40 bg-card/60 p-4 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted/60" />
                </div>
                <div className="h-8 w-8 rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
