export default function UploadMaterialLoading() {
  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Header skeleton */}
      <div className="rounded-3xl border border-border/40 bg-card/80 p-5 sm:p-7 space-y-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-muted/60" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-muted shrink-0" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-muted/80" />
              <div className="h-6 w-64 rounded bg-muted" />
              <div className="flex gap-2">
                <div className="h-4 w-20 rounded-full bg-muted/60" />
                <div className="h-4 w-20 rounded-full bg-muted/60" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="rounded-2xl border border-border/40 bg-card/85 p-5 sm:p-7 space-y-6 animate-pulse">
        {/* Key Points Section */}
        <div>
          <div className="h-3.5 w-24 rounded bg-muted mb-3" />
          <div className="grid gap-2 sm:grid-cols-2">
            {[1, 2, 3, 4].map((val) => (
              <div key={val} className="h-10 rounded-xl bg-muted/40" />
            ))}
          </div>
        </div>

        <hr className="border-border/40" />

        {/* Content Section */}
        <div>
          <div className="h-3.5 w-24 rounded bg-muted mb-3" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-muted/50" />
            <div className="h-4 w-full rounded bg-muted/50" />
            <div className="h-4 w-3/4 rounded bg-muted/50" />
            <div className="h-4 w-full rounded bg-muted/50" />
            <div className="h-4 w-5/6 rounded bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
