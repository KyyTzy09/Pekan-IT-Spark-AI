import type * as React from "react";

import { QueryProviders } from "@/components/providers/query-client";
import { StudentNav } from "@/components/student/student-nav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full overflow-x-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--hero-bg)" }}
      />

      {/* Docked Sidebar (Fixed to Left, Non-scrollable with page) */}
      <aside className="fixed bottom-0 left-0 top-0 z-20 hidden h-screen w-[240px] shrink-0 overflow-y-auto border-r border-border bg-card/85 p-5 md:block lg:w-[256px] backdrop-blur-md">
        <StudentNav variant="sidebar" />
      </aside>

      {/* Main Content Area with offset for fixed sidebar */}
      <div className="flex flex-1 flex-col min-w-0 md:pl-[240px] lg:pl-[256px]">
        <main className="mx-auto w-full max-w-[1120px] p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <QueryProviders>{children}</QueryProviders>
        </main>
      </div>

      <StudentNav variant="bottom" />
    </div>
  );
}
