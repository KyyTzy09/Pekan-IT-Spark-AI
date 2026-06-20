export default function UserProfileDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back Button skeleton */}
      <div className="h-4 w-32 bg-muted/60 rounded" />

      {/* Hero section skeleton */}
      <div className="rounded-3xl border border-border/40 bg-card/85 p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 rounded-full bg-muted/60" />
            <div className="h-7 w-48 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted/60" />
            <div className="flex gap-2">
              <div className="h-6 w-24 rounded-xl bg-muted/60" />
              <div className="h-6 w-28 rounded-xl bg-muted/60" />
            </div>
          </div>
          <div className="flex flex-col items-center sm:items-end justify-center space-y-2 shrink-0">
            <div className="h-3 w-16 bg-muted/60 rounded" />
            <div className="h-10 w-28 bg-muted rounded" />
            <div className="h-3.5 w-32 bg-muted/60 rounded" />
          </div>
        </div>
      </div>

      {/* Stats summary row skeleton */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 bg-card/60 p-4 space-y-2"
          >
            <div className="h-3 w-20 bg-muted/60 rounded" />
            <div className="h-6 w-12 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Content grid skeleton */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-6 md:col-span-8">
          <div className="rounded-3xl border border-border/40 bg-card/60 p-5 space-y-4">
            <div className="h-5 w-48 bg-muted rounded" />
            <div className="h-32 w-full bg-muted/40 rounded-xl" />
            <div className="h-4 w-full bg-muted/20 rounded" />
          </div>
          <div className="rounded-3xl border border-border/40 bg-card/60 p-5 space-y-4">
            <div className="h-5 w-44 bg-muted rounded" />
            <div className="h-48 w-full bg-muted/40 rounded-xl" />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6 md:col-span-4">
          <div className="rounded-3xl border border-border/40 bg-card/60 p-5 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted/60 rounded-xl" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-3 rounded-2xl border border-border/20"
                >
                  <div className="h-10 w-10 bg-muted rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-24 bg-muted rounded" />
                    <div className="h-3 w-36 bg-muted/60 rounded" />
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
