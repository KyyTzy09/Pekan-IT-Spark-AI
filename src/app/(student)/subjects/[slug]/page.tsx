"use client";

export const dynamic = "force-dynamic";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { SubjectDetailView } from "@/components/student/subjects-view";

const SLUG_MAP: Record<string, string> = {
  matematika: "MATEMATIKA",
  bahasa: "BAHASA_INDONESIA",
  "bahasa-indonesia": "BAHASA_INDONESIA",
  "b-indonesia": "BAHASA_INDONESIA",
  inggris: "BAHASA_INGGRIS",
  "bahasa-inggris": "BAHASA_INGGRIS",
  "b-inggris": "BAHASA_INGGRIS",
  ipa: "IPA",
  sains: "IPA",
};

function normalizeSlug(raw: string): string {
  const key = raw.toLowerCase().trim();
  return SLUG_MAP[key] ?? raw.toUpperCase();
}

type TopicSummary = {
  id: string;
  name: string;
  slug: string;
  conceptCount: number;
  masteredConcepts: number;
  averageMastery: number;
  questionsAnswered: number;
};

type ConceptHeatmapItem = {
  id: string;
  name: string;
  mastery: number;
  topicId: string;
};

type SubjectSummaryResponse = {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalConcepts: number;
  masteredConcepts: number;
  averageMastery: number;
  topics: TopicSummary[];
  heatmap: ConceptHeatmapItem[];
};

type SubjectExplorerSummary = {
  subject: {
    id: string;
    slug: string;
    name: string;
    icon: string | null;
    color: string | null;
    description: string | null;
    isCustom: boolean;
    source: "OFFICIAL" | "AI_GENERATED" | "USER_CREATED";
  };
  topics: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    order: number;
    totalConcepts: number;
    masteredConcepts: number;
    averageMastery: number;
  }>;
  totalConcepts: number;
  masteredConcepts: number;
};

function mapToSubjectExplorer(
  data: SubjectSummaryResponse,
  slug: string,
): SubjectExplorerSummary {
  return {
    subject: {
      id: data.id,
      slug,
      name: data.name,
      icon: data.icon,
      color: data.color,
      description: null,
      isCustom: false,
      source: "OFFICIAL",
    },
    topics: data.topics.map((t, i) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: null,
      order: i,
      totalConcepts: t.conceptCount,
      masteredConcepts: t.masteredConcepts,
      averageMastery: t.averageMastery,
    })),
    totalConcepts: data.totalConcepts,
    masteredConcepts: data.masteredConcepts,
  };
}

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="size-14 shrink-0 rounded-2xl bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-8 w-48 rounded bg-muted" />
          </div>
          <div className="h-8 w-32 rounded-full bg-muted" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="h-20 rounded-2xl bg-muted" />
          <div className="h-20 rounded-2xl bg-muted" />
          <div className="h-20 rounded-2xl bg-muted" />
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-2xl bg-muted" />
        <div className="h-28 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export default function SubjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const normalized = normalizeSlug(params.slug);

  const { data, isLoading, error } = useQuery<SubjectSummaryResponse>({
    queryKey: ["subject-detail", normalized],
    queryFn: async () => {
      const res = await fetch(`/api/subjects/${normalized}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Subject not found");
        throw new Error("Failed to fetch subject");
      }
      return res.json();
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return <SkeletonCard />;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {error?.message === "Subject not found"
            ? "Mata pelajaran tidak ditemukan."
            : "Gagal memuat data. Coba lagi nanti."}
        </p>
      </div>
    );
  }

  const summary = mapToSubjectExplorer(data, normalized);
  return <SubjectDetailView summary={summary} />;
}
