"use client";

import dynamic from "next/dynamic";
import type { DocumentListItem } from "@/server/actions/documents";

const UploadView = dynamic(
  () =>
    import("@/components/student/upload-view").then((mod) => mod.UploadView),
  {
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--coral)] border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">
            Memuat fitur upload...
          </p>
        </div>
      </div>
    ),
  },
);

export function UploadPageClient({
  initialDocuments,
}: {
  initialDocuments: DocumentListItem[];
}) {
  return <UploadView initialDocuments={initialDocuments} />;
}
