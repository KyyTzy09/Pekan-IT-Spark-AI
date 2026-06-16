"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  getStreakBrokenMessage,
  levelFromXp,
  STREAK_MILESTONES,
} from "@/lib/gamification";
import { prisma } from "@/lib/prisma";
import type { Prisma, XpSource } from "../../../generated/prisma/client";

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

async function loadLevelTable() {
  return prisma.level.findMany({
    orderBy: { level: "asc" },
    select: { level: true, name: true, minXp: true },
  });
}

// ============================================================================
// XP
// ============================================================================

export type AddXpResult = {
  amount: number;
  totalXp: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
  previousLevel: number;
};

/**
 * Atomically add XP to a user, record transaction, and update level if changed.
 *
 * Authorization:
 * - Student may add XP to their own account only
 * - Parent/admin/server-script may add to anyone (parent with linked child recommended)
 *
 * Idempotency: caller is responsible for not double-counting.
 */
export async function addXp(
  userId: string,
  amount: number,
  source: XpSource,
  metadata?: Record<string, unknown>,
): Promise<AddXpResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  if (session.user.role === "STUDENT" && session.user.id !== userId) {
    throw new Error("FORBIDDEN");
  }

  if (amount === 0) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { totalXp: true, level: true },
    });
    const levels = await loadLevelTable();
    const info = levelFromXp(profile?.totalXp ?? 0, levels);
    return {
      amount: 0,
      totalXp: profile?.totalXp ?? 0,
      level: info.level,
      levelName: info.name,
      leveledUp: false,
      previousLevel: info.level,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.xpTransaction.create({
      data: {
        userId,
        amount,
        source,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
    const updated = await tx.studentProfile.update({
      where: { userId },
      data: { totalXp: { increment: amount } },
      select: { totalXp: true, level: true },
    });
    return { previousLevel: updated.level, newTotalXp: updated.totalXp };
  });

  const levels = await loadLevelTable();
  const newInfo = levelFromXp(result.newTotalXp, levels);

  if (newInfo.level !== result.previousLevel) {
    await prisma.studentProfile.update({
      where: { userId },
      data: { level: newInfo.level },
    });
  }

  revalidatePath("/dashboard");

  return {
    amount,
    totalXp: result.newTotalXp,
    level: newInfo.level,
    levelName: newInfo.name,
    leveledUp: newInfo.level > result.previousLevel,
    previousLevel: result.previousLevel,
  };
}

// ============================================================================
// Streak
// ============================================================================

export type RecordActivityResult = {
  currentStreak: number;
  longestStreak: number;
  freezeAvailable: number;
  isNewActivity: boolean;
  freezeUsed: boolean;
  brokePreviousStreak: boolean;
  message: string | null;
};

/**
 * Record that a student did an activity today. Updates streak with freeze logic.
 *
 * Rules:
 * - Same day → no change
 * - 1 day after last activity → currentStreak += 1
 * - 2 days after + freezeAvailable > 0 → use freeze, currentStreak += 1, freeze = 0
 * - 2+ days after + no freeze → reset currentStreak to 1 (returns brokePreviousStreak=true)
 *
 * Weekly freeze reset: if lastFreezeResetAt is 7+ days ago, freezeAvailable = 1.
 */
export async function recordActivity(
  userId: string,
): Promise<RecordActivityResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  if (session.user.role === "STUDENT" && session.user.id !== userId) {
    throw new Error("FORBIDDEN");
  }

  const now = new Date();
  const today = startOfDay(now);

  return await prisma.$transaction(async (tx) => {
    let streak = await tx.streak.findUnique({ where: { userId } });
    if (!streak) {
      streak = await tx.streak.create({
        data: {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          freezeAvailable: 1,
          lastFreezeResetAt: now,
        },
      });
    }

    // Same day? No change.
    if (streak.lastActivityAt) {
      const lastDay = startOfDay(streak.lastActivityAt);
      if (lastDay.getTime() === today.getTime()) {
        return {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          freezeAvailable: streak.freezeAvailable,
          isNewActivity: false,
          freezeUsed: false,
          brokePreviousStreak: false,
          message: null,
        };
      }
    }

    // Weekly freeze reset: if last reset was 7+ days ago, refill
    let freezeAvailable = streak.freezeAvailable;
    let lastFreezeResetAt = streak.lastFreezeResetAt;
    if (streak.lastFreezeResetAt) {
      const daysSinceReset = Math.floor(
        (today.getTime() - startOfDay(streak.lastFreezeResetAt).getTime()) /
          DAY_MS,
      );
      if (daysSinceReset >= 7) {
        freezeAvailable = 1;
        lastFreezeResetAt = now;
      }
    } else {
      lastFreezeResetAt = now;
    }

    // Compute new streak
    let newStreak = streak.currentStreak;
    let freezeUsed = false;
    let brokePreviousStreak = false;
    const previousStreak = streak.currentStreak;

    if (streak.lastActivityAt) {
      const lastDay = startOfDay(streak.lastActivityAt);
      const daysDiff = Math.floor(
        (today.getTime() - lastDay.getTime()) / DAY_MS,
      );

      if (daysDiff === 1) {
        newStreak = streak.currentStreak + 1;
      } else if (daysDiff === 2 && freezeAvailable > 0) {
        newStreak = streak.currentStreak + 1;
        freezeAvailable = 0;
        freezeUsed = true;
      } else if (daysDiff >= 2) {
        newStreak = 1;
        brokePreviousStreak = streak.currentStreak > 0;
      }
    } else {
      newStreak = 1;
    }

    const newLongest = Math.max(streak.longestStreak, newStreak);

    const updated = await tx.streak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityAt: now,
        freezeAvailable,
        lastFreezeResetAt,
      },
    });

    // Build celebration message
    let message: string | null = null;
    if (brokePreviousStreak) {
      message = getStreakBrokenMessage(previousStreak);
    } else {
      const milestone = STREAK_MILESTONES.find((m) => m.days === newStreak);
      if (milestone) message = milestone.message;
    }

    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      freezeAvailable: updated.freezeAvailable,
      isNewActivity: true,
      freezeUsed,
      brokePreviousStreak,
      message,
    };
  });
}

// ============================================================================
// Badges
// ============================================================================

export type BadgeUnlock = {
  badgeId: string;
  badgeName: string;
  badgeDescription: string | null;
  xpReward: number;
  category: string | null;
};

/**
 * Check all badges against user's current stats. Unlock any that are earned but not
 * yet in UserBadge. Returns the list of newly-unlocked badges (for UI notification).
 *
 * Idempotent: re-running won't double-unlock.
 *
 * This is a simple rule-based checker. For complex badge criteria (e.g., "master all
 * Trigonometry concepts"), add an entry to BADGE_RULES below.
 */
type BadgeCheckStats = {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  masteredConcepts: number;
  totalAttempts: number;
  correctAttempts: number;
  challengesCompleted: number;
  materialsRead: number;
  reflectionsSubmitted: number;
};

type BadgeRule = {
  test: (s: BadgeCheckStats) => boolean;
};

const BADGE_RULES: Record<string, BadgeRule> = {
  // Streak badges
  "Streak Master 3 Hari": { test: (s) => s.longestStreak >= 3 },
  "Streak Master 7 Hari": { test: (s) => s.longestStreak >= 7 },
  "Streak Master 30 Hari": { test: (s) => s.longestStreak >= 30 },
  "Streak Master 100 Hari": { test: (s) => s.longestStreak >= 100 },
  "Konsisten 7 Hari": { test: (s) => s.currentStreak >= 7 },
  "Konsisten 30 Hari": { test: (s) => s.currentStreak >= 30 },
  "Pagi yang Produktif": { test: () => false }, // TODO: requires time-of-day tracking

  // XP badges
  "XP 100": { test: (s) => s.totalXp >= 100 },
  "XP 500": { test: (s) => s.totalXp >= 500 },
  "XP 1000": { test: (s) => s.totalXp >= 1000 },
  "XP 5000": { test: (s) => s.totalXp >= 5000 },
  "XP 10000": { test: (s) => s.totalXp >= 10000 },

  // Mastery badges
  "Konsep Pertama Dikuasai": { test: (s) => s.masteredConcepts >= 1 },
  "5 Konsep Dikuasai": { test: (s) => s.masteredConcepts >= 5 },
  "10 Konsep Dikuasai": { test: (s) => s.masteredConcepts >= 10 },
  "25 Konsep Dikuasai": { test: (s) => s.masteredConcepts >= 25 },
  "50 Konsep Dikuasai": { test: (s) => s.masteredConcepts >= 50 },

  // Quiz badges
  "Soal Pertama Dijawab": { test: (s) => s.totalAttempts >= 1 },
  "10 Soal Dijawab": { test: (s) => s.totalAttempts >= 10 },
  "50 Soal Dijawab": { test: (s) => s.totalAttempts >= 50 },
  "100 Soal Dijawab": { test: (s) => s.totalAttempts >= 100 },
  "Akurasi 80% (10+ soal)": {
    test: (s) =>
      s.totalAttempts >= 10 && s.correctAttempts / s.totalAttempts >= 0.8,
  },
  "Akurasi 90% (25+ soal)": {
    test: (s) =>
      s.totalAttempts >= 25 && s.correctAttempts / s.totalAttempts >= 0.9,
  },

  // Activity badges
  "Tantangan Pertama Selesai": { test: (s) => s.challengesCompleted >= 1 },
  "10 Tantangan Selesai": { test: (s) => s.challengesCompleted >= 10 },
  "Materi Pertama Dibaca": { test: (s) => s.materialsRead >= 1 },
  "10 Materi Dibaca": { test: (s) => s.materialsRead >= 10 },
  "Refleksi Pertama": { test: (s) => s.reflectionsSubmitted >= 1 },
  "10 Refleksi Ditulis": { test: (s) => s.reflectionsSubmitted >= 10 },

  // Akademik — subject mastery (placeholders, refined per subject later)
  "Penakluk Trigonometri": { test: (s) => s.masteredConcepts >= 10 },
  "Teman Aljabar": { test: (s) => s.masteredConcepts >= 10 },
  "Penjelajah Tata Bahasa": { test: (s) => s.masteredConcepts >= 5 },

  // Keberanian (curiosity/asking)
  "Penanya Ulung": { test: (s) => s.totalAttempts >= 50 },
  "Pemikir Kritis": { test: (s) => s.correctAttempts >= 50 },
};

export async function checkAndUnlockBadges(
  userId: string,
): Promise<BadgeUnlock[]> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  if (session.user.role === "STUDENT" && session.user.id !== userId) {
    throw new Error("FORBIDDEN");
  }

  // Load user stats in parallel
  const [
    profile,
    skpCounts,
    attempts,
    streak,
    challengesCompleted,
    materialsRead,
    reflections,
  ] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId },
      select: { totalXp: true },
    }),
    prisma.studentKnowledgeProfile.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.questionAttempt.groupBy({
      by: ["isCorrect"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.streak.findUnique({
      where: { userId },
      select: { currentStreak: true, longestStreak: true },
    }),
    prisma.challenge.count({
      where: { userId, status: "COMPLETED" },
    }),
    prisma.materialRead.count({
      where: { userId, completed: true },
    }),
    prisma.reflection.count({ where: { userId } }),
  ]);

  const stats: BadgeCheckStats = {
    totalXp: profile?.totalXp ?? 0,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    masteredConcepts:
      skpCounts.find((c) => c.status === "MASTERED")?._count._all ?? 0,
    totalAttempts: attempts.reduce((acc, a) => acc + a._count._all, 0),
    correctAttempts: attempts.find((a) => a.isCorrect)?._count._all ?? 0,
    challengesCompleted,
    materialsRead,
    reflectionsSubmitted: reflections,
  };

  // Get all badges the user already has
  const owned = new Set(
    (
      await prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      })
    ).map((b) => b.badgeId),
  );

  // Get all badges, check rules
  const allBadges = await prisma.badge.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      xpReward: true,
      category: true,
    },
  });

  const newlyUnlocked: BadgeUnlock[] = [];
  for (const badge of allBadges) {
    if (owned.has(badge.id)) continue;
    const rule = BADGE_RULES[badge.name];
    if (!rule) continue;
    if (rule.test(stats)) {
      newlyUnlocked.push({
        badgeId: badge.id,
        badgeName: badge.name,
        badgeDescription: badge.description,
        xpReward: badge.xpReward,
        category: badge.category,
      });
    }
  }

  if (newlyUnlocked.length === 0) return [];

  // Insert UserBadge rows + award XP per badge (BADGE_UNLOCK source)
  await prisma.$transaction(async (tx) => {
    await tx.userBadge.createMany({
      data: newlyUnlocked.map((b) => ({
        userId,
        badgeId: b.badgeId,
      })),
    });
    for (const b of newlyUnlocked) {
      if (b.xpReward > 0) {
        await tx.xpTransaction.create({
          data: {
            userId,
            amount: b.xpReward,
            source: "BADGE_UNLOCK",
            metadata: {
              badgeId: b.badgeId,
              badgeName: b.badgeName,
            } as Prisma.InputJsonValue,
          },
        });
      }
    }
    const totalBadgeXp = newlyUnlocked.reduce((acc, b) => acc + b.xpReward, 0);
    if (totalBadgeXp > 0) {
      const updated = await tx.studentProfile.update({
        where: { userId },
        data: { totalXp: { increment: totalBadgeXp } },
        select: { totalXp: true, level: true },
      });
      const levels = await tx.level.findMany({
        orderBy: { level: "asc" },
        select: { level: true, name: true, minXp: true },
      });
      const newInfo = levelFromXp(updated.totalXp, levels);
      if (newInfo.level !== updated.level) {
        await tx.studentProfile.update({
          where: { userId },
          data: { level: newInfo.level },
        });
      }
    }
  });

  revalidatePath("/dashboard");
  return newlyUnlocked;
}

// ============================================================================
// Study Buddy
// ============================================================================

export async function getStudyBuddyAction() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Login dulu ya" };
  const userId = session.user.id;

  let buddy = await prisma.studyBuddy.findUnique({
    where: { userId },
  });

  if (!buddy) {
    buddy = await prisma.studyBuddy.create({
      data: {
        userId,
        type: "bunga",
        stage: 1,
      },
    });
  }

  return { ok: true, buddy };
}

export async function updateStudyBuddyAction(type: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Login dulu ya" };
  const userId = session.user.id;

  await prisma.studyBuddy.upsert({
    where: { userId },
    create: {
      userId,
      type,
      stage: 1,
    },
    update: {
      type,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

// ============================================================================
// Avatar Customization
// ============================================================================

export async function getAvatarCustomizationAction() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Login dulu ya" };
  const userId = session.user.id;

  let avatar = await prisma.avatarCustomization.findUnique({
    where: { userId },
  });

  if (!avatar) {
    avatar = await prisma.avatarCustomization.create({
      data: {
        userId,
        color: "default",
        accessory: "none",
        background: "default",
      },
    });
  }

  return { ok: true, avatar };
}

export async function updateAvatarCustomizationAction(
  color: string,
  accessory: string | null,
  background: string | null,
) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Login dulu ya" };
  const userId = session.user.id;

  // Fetch student profile to validate XP unlock requirement
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { totalXp: true },
  });
  const xp = profile?.totalXp ?? 0;

  // Color limits
  if (color === "green" && xp < 200)
    return { ok: false, error: "Butuh 200 XP untuk warna Hijau" };
  if (color === "purple" && xp < 400)
    return { ok: false, error: "Butuh 400 XP untuk warna Ungu" };
  if (color === "gold" && xp < 800)
    return { ok: false, error: "Butuh 800 XP untuk warna Emas" };

  // Accessory limits
  if (accessory === "glasses" && xp < 300)
    return { ok: false, error: "Butuh 300 XP untuk Kacamata" };
  if (accessory === "hat" && xp < 500)
    return { ok: false, error: "Butuh 500 XP untuk Topi Wisuda" };
  if (accessory === "crown" && xp < 1000)
    return { ok: false, error: "Butuh 1000 XP untuk Mahkota Emas" };
  if (accessory === "ribbon" && xp < 400)
    return { ok: false, error: "Butuh 400 XP untuk Pita Lucu" };

  // Background limits
  if (background === "aurora" && xp < 250)
    return { ok: false, error: "Butuh 250 XP untuk background Aurora" };
  if (background === "space" && xp < 500)
    return { ok: false, error: "Butuh 500 XP untuk background Space" };
  if (background === "neon" && xp < 750)
    return { ok: false, error: "Butuh 750 XP untuk background Neon" };

  await prisma.avatarCustomization.upsert({
    where: { userId },
    create: {
      userId,
      color,
      accessory: accessory || "none",
      background: background || "default",
    },
    update: {
      color,
      accessory: accessory || "none",
      background: background || "default",
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
