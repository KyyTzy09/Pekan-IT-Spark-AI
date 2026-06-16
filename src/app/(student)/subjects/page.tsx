"use client";

import { useQuery } from "@tanstack/react-query";
import { AddSubjectDialog } from "@/components/student/add-subject-dialog";
import {
  type SubjectListItem,
  SubjectsListView,
} from "@/components/student/subjects-view";

export default function SubjectsPage() {
  const { data, isLoading } = useQuery<{
    subjects: SubjectListItem[];
    focusedIds: string[];
  }>({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5 sm:space-y-7">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <SubjectsListView
        subjects={data?.subjects ?? []}
        focusedIds={data?.focusedIds ?? []}
        addAction={<AddSubjectDialog />}
      />
    </div>
  );
}
