"use client";

import * as React from "react";
import { MaterialReader } from "@/components/student/materials/material-reader";

type Difficulty = "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
type MaterialSource = "CHALLENGE" | "ON_DEMAND" | "ADAPTIVE";

interface MaterialDetail {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
  difficulty: Difficulty;
  source: MaterialSource;
  createdAt: string;
  read: { completed: boolean; readAt: string; readSeconds: number } | null;
  subject: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
  relatedChallenges: Array<{
    id: string;
    title: string;
    status: "ACTIVE" | "COMPLETED" | "SKIPPED" | "EXPIRED";
  }>;
}

export function MaterialReaderClient({
  material,
  onMarkRead,
}: {
  material: MaterialDetail;
  onMarkRead: (
    materialId: string,
    readSeconds: number,
    completed: boolean,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const handleMarkRead = React.useCallback(
    async (materialId: string, readSeconds: number, completed: boolean) => {
      await onMarkRead(materialId, readSeconds, completed);
    },
    [onMarkRead],
  );

  return <MaterialReader material={material} onMarkRead={handleMarkRead} />;
}
