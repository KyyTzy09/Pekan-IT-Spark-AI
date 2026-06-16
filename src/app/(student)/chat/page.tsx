"use client";

import { useQuery } from "@tanstack/react-query";
import { ChatListView } from "@/components/student/chat-list-view";
import type { ChatSessionSummary } from "@/server/actions/chat";

export const dynamic = "force-dynamic";

type SubjectOption = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
};

type ChatPageData = {
  subjects: SubjectOption[];
  sessions: ChatSessionSummary[];
  userName: string;
};

export default function ChatListPage() {
  const { data, isLoading, error } = useQuery<ChatPageData>({
    queryKey: ["chat-page"],
    queryFn: async () => {
      const res = await fetch("/api/chat");
      if (!res.ok) throw new Error("Gagal memuat data chat.");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-5 sm:space-y-7">
        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-5 shadow-[0_10px_30px_rgba(80,20,50,0.08)] backdrop-blur-xl sm:p-7">
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-muted" />
            <div className="mt-4 flex gap-1.5">
              <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-8 w-18 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-[88px] w-full animate-pulse rounded-2xl bg-muted" />
            <div className="flex justify-end">
              <div className="h-9 w-28 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/70 p-3.5"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded-lg bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
              <div className="size-7 shrink-0 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-destructive/30 bg-destructive/8 p-10 text-center">
        <p className="text-sm font-medium text-destructive">
          Gagal memuat data chat. Coba muat ulang halaman.
        </p>
      </div>
    );
  }

  return (
    <ChatListView
      userName={data?.userName ?? "Teman"}
      subjects={data?.subjects ?? []}
      sessions={data?.sessions ?? []}
    />
  );
}
