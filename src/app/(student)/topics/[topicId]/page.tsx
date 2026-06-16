"use client";

import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import { TopicDetailView } from "@/components/student/subjects-view";

export const dynamic = "force-dynamic";

interface TopicDetailData {
  topic: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    subjectName: string;
    subjectSlug: string;
    subjectColor: string | null;
    subjectIcon: string | null;
  };
  concepts: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: "NOT_STARTED" | "LEARNING" | "MASTERED" | "STRUGGLING";
    masteryScore: number;
  }>;
  totalConcepts: number;
  masteredConcepts: number;
  averageMastery: number;
}

function TopicDetailSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-7">
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4 flex items-center gap-4">
          <div className="size-12 animate-pulse rounded-2xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="h-3 w-64 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-2xl border border-border/40 bg-card/60"
          />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl border border-border/40 bg-card/60"
          />
        ))}
      </div>
    </div>
  );
}

export default function TopicDetailPage() {
  const params = useParams<{ topicId: string }>();
  const { topicId } = params;

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery<TopicDetailData>({
    queryKey: ["topicDetail", topicId],
    queryFn: async () => {
      const res = await fetch(`/api/topics/${topicId}`);
      if (!res.ok) throw new Error("Failed to fetch topic");
      return res.json();
    },
  });

  if (isLoading) return <TopicDetailSkeleton />;
  if (error || !summary) notFound();

  return (
    <TopicDetailView
      topic={{
        id: summary.topic.id,
        name: summary.topic.name,
        slug: summary.topic.slug,
        description: summary.topic.description,
        subjectName: summary.topic.subjectName,
        subjectSlug: summary.topic.subjectSlug.toLowerCase(),
        subjectColor: summary.topic.subjectColor,
        subjectIcon: summary.topic.subjectIcon,
        totalConcepts: summary.totalConcepts,
        masteredConcepts: summary.masteredConcepts,
        averageMastery: summary.averageMastery,
        concepts: summary.concepts,
      }}
    />
  );
}
