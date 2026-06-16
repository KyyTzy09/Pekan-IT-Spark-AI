import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LeaderboardView } from "@/components/student/leaderboard-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Papan Juara Spark — Spark AI",
  description:
    "Lihat klasemen belajar, kumpulkan XP, dan raih prestasi bersama teman-teman.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch top 50 student profiles ordered by total XP
  const leaderboardRaw = await prisma.studentProfile.findMany({
    take: 50,
    orderBy: {
      totalXp: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarCustomization: {
            select: {
              color: true,
              accessory: true,
              background: true,
            },
          },
          streak: {
            select: {
              currentStreak: true,
            },
          },
          userBadges: {
            include: {
              badge: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  xpReward: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Safe mapping of the schema to the component props type
  const leaderboard = leaderboardRaw.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    totalXp: entry.totalXp,
    level: entry.level,
    school: entry.school,
    grade: entry.grade,
    user: {
      id: entry.user.id,
      name: entry.user.name,
      avatarCustomization: entry.user.avatarCustomization,
      streak: entry.user.streak
        ? { current: entry.user.streak.currentStreak }
        : null,
      userBadges: entry.user.userBadges.map((ub) => ({
        id: ub.id,
        badge: {
          id: ub.badge.id,
          name: ub.badge.name,
          description: ub.badge.description,
          xpReward: ub.badge.xpReward,
        },
      })),
    },
  }));

  return (
    <LeaderboardView
      leaderboard={leaderboard}
      currentUserId={session.user.id}
    />
  );
}
