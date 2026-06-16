"use client";

import { useQuery } from "@tanstack/react-query";
import { LearningPlanView } from "@/components/student/learning-plan-view";
import type { WeeklyPlan } from "@/server/learning-plan";

export const dynamic = "force-dynamic";

function Skeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-7 gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <div key={n} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function PlanPage() {
  const { data, isLoading, error } = useQuery<WeeklyPlan>({
    queryKey: ["plan"],
    queryFn: async () => {
      const res = await fetch("/api/plan");
      if (!res.ok) throw new Error("Gagal memuat rencana belajar");
      return res.json();
    },
  });

  if (isLoading) return <Skeleton />;
  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          Gagal memuat rencana belajar. Coba muat ulang halaman.
        </p>
      </div>
    );
  }

  if (!data) return null;

  return <LearningPlanView initialPlan={data} />;
}
