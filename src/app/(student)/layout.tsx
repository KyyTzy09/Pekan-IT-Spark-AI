import type * as React from "react";
import { BadgeUnlockProvider } from "@/components/student/badge-unlock-provider";
import type { NavProfileData } from "@/components/student/student-nav";
import { StudentNav } from "@/components/student/student-nav";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/server/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch profile data once in layout and pass to StudentNav
  // This eliminates the client-side fetch in ProfileWidget
  let profileData: NavProfileData | null = null;
  try {
    const session = await auth();
    if (session?.user?.id && session.user.role === "STUDENT") {
      const summary = await getDashboardSummary(session.user.id);
      profileData = {
        name: summary.student.name,
        school: summary.student.school,
        grade: summary.student.grade,
        levelName: summary.level.name,
        levelLevel: summary.level.level,
        totalXp: summary.level.totalXp,
        xpToNext: summary.level.xpToNext,
        progress: summary.level.progress,
        streak: summary.streak.current,
      };
    }
  } catch (error) {
    // Silently fail - ProfileWidget will show fallback
    console.error("Failed to fetch profile data for nav:", error);
  }

  return (
    <BadgeUnlockProvider>
      <div className="relative flex min-h-screen w-full overflow-x-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10"
          style={{ background: "var(--hero-bg)" }}
        />

        {/* Docked Sidebar (Fixed to Left, Non-scrollable with page) */}
        <aside
          role="navigation"
          aria-label="Menu samping"
          className="fixed bottom-0 left-0 top-0 z-20 hidden h-screen w-[270px] shrink-0 overflow-y-auto border-r border-border bg-card/85 p-5 md:block lg:w-[280px] backdrop-blur-md"
        >
          <StudentNav variant="sidebar" profileData={profileData} />
        </aside>

        {/* Main Content Area with offset for fixed sidebar */}
        <div className="flex flex-1 flex-col min-w-0 md:pl-[270px] lg:pl-[280px]">
          <main
            role="main"
            aria-label="Konten utama"
            id="main-content"
            className="mx-auto w-full max-w-[1120px] p-4 sm:p-6 md:p-8 pb-24 md:pb-8"
          >
            {children}
          </main>
        </div>

        <StudentNav variant="bottom" profileData={profileData} />
      </div>
    </BadgeUnlockProvider>
  );
}
