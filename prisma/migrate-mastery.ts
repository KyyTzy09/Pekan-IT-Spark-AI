/**
 * ═══════════════════════════════════════════════════════════════
 * MIGRATION SCRIPT — Old Mastery (0-1) → New Mastery (0-100)
 * ═══════════════════════════════════════════════════════════════
 *
 * Run with: bun run prisma/migrate-mastery.ts
 *
 * What this script does:
 * 1. Convert StudentKnowledgeProfile.masteryScore (0-1) → StudentMastery.score (0-100)
 * 2. Set confidence based on attempt count
 * 3. Populate difficultyScore for existing questions
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Starting mastery migration...\n");

  // ═══════════════════════════════════════════════════════════════
  // Step 1: Migrate StudentKnowledgeProfile → StudentMastery
  // ═══════════════════════════════════════════════════════════════

  console.log("📊 Step 1: Migrating mastery scores...");

  const oldProfiles = await prisma.studentKnowledgeProfile.findMany({
    select: {
      userId: true,
      conceptId: true,
      masteryScore: true,
      attemptCount: true,
      lastAttemptAt: true,
    },
  });

  console.log(`   Found ${oldProfiles.length} existing mastery profiles`);

  let migrated = 0;
  let skipped = 0;

  for (const old of oldProfiles) {
    try {
      // Convert mastery: 0-1 → 0-100
      const newScore = Math.round(old.masteryScore * 100);

      // Calculate confidence based on attempt count
      // 0 attempts = 0 confidence, 30+ attempts = 100 confidence
      const confidence = Math.min(
        Math.round((old.attemptCount / 30) * 100),
        100,
      );

      await prisma.studentMastery.upsert({
        where: {
          userId_conceptId: {
            userId: old.userId,
            conceptId: old.conceptId,
          },
        },
        create: {
          userId: old.userId,
          conceptId: old.conceptId,
          score: newScore,
          confidence,
          attemptCount: old.attemptCount,
          correctCount: 0, // unknown from old data
          totalTimeSpent: 0, // unknown from old data
          peakScore: newScore,
          lastAttemptAt: old.lastAttemptAt,
        },
        update: {
          score: newScore,
          confidence,
          attemptCount: old.attemptCount,
          peakScore: { set: newScore },
          lastAttemptAt: old.lastAttemptAt,
        },
      });

      migrated++;
    } catch (err) {
      console.error(
        `   ❌ Failed to migrate ${old.userId}/${old.conceptId}:`,
        err,
      );
      skipped++;
    }
  }

  console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}\n`);

  // ═══════════════════════════════════════════════════════════════
  // Step 2: Populate difficultyScore for existing questions
  // ═══════════════════════════════════════════════════════════════

  console.log("📝 Step 2: Populating difficulty scores for questions...");

  const difficultyMap: Record<string, number> = {
    EASY: 20,
    MEDIUM: 45,
    HARD: 70,
    ADVANCED: 90,
  };

  const questions = await prisma.question.findMany({
    where: { difficultyScore: 50 }, // default value = not yet migrated
    select: { id: true, difficulty: true },
  });

  console.log(`   Found ${questions.length} questions to update`);

  let updated = 0;

  for (const q of questions) {
    const score = difficultyMap[q.difficulty] ?? 50;
    await prisma.question.update({
      where: { id: q.id },
      data: { difficultyScore: score },
    });
    updated++;
  }

  console.log(`   ✅ Updated: ${updated} questions\n`);

  // ═══════════════════════════════════════════════════════════════
  // Step 3: Aggregate SubjectMastery
  // ═══════════════════════════════════════════════════════════════

  console.log("📚 Step 3: Aggregating subject mastery...");

  // Get all unique user-subject pairs
  const userSubjects = await prisma.studentMastery.findMany({
    select: {
      userId: true,
      concept: {
        select: {
          topic: {
            select: { subjectId: true },
          },
        },
      },
    },
    distinct: ["userId"],
  });

  // Group by user
  const userSubjectMap = new Map<string, Set<string>>();
  for (const us of userSubjects) {
    const subjectId = us.concept.topic.subjectId;
    if (!userSubjectMap.has(us.userId)) {
      userSubjectMap.set(us.userId, new Set());
    }
    userSubjectMap.get(us.userId)!.add(subjectId);
  }

  // For each user-subject pair, aggregate mastery
  let subjectMasteriesCreated = 0;

  for (const [userId, subjectIds] of userSubjectMap) {
    for (const subjectId of subjectIds) {
      // Get all concept masteries for this subject
      const concepts = await prisma.concept.findMany({
        where: { topic: { subjectId } },
        select: { id: true },
      });
      const conceptIds = concepts.map((c) => c.id);

      const masteries = await prisma.studentMastery.findMany({
        where: {
          userId,
          conceptId: { in: conceptIds },
        },
        select: { score: true, confidence: true },
      });

      if (masteries.length === 0) continue;

      // Calculate weighted average
      let totalWeightedScore = 0;
      let totalWeight = 0;
      let conceptsMastered = 0;

      for (const m of masteries) {
        const weight = Math.max(m.confidence / 100, 0.1);
        totalWeightedScore += m.score * weight;
        totalWeight += weight;
        if (m.score >= 89) conceptsMastered++;
      }

      const score = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
      const avgConfidence =
        masteries.reduce((sum, m) => sum + m.confidence, 0) / masteries.length;

      await prisma.subjectMastery.upsert({
        where: {
          userId_subjectId: { userId, subjectId },
        },
        create: {
          userId,
          subjectId,
          score: Math.round(score * 100) / 100,
          confidence: Math.round(avgConfidence),
          conceptsMastered,
          conceptsTotal: masteries.length,
          recommendedDifficulty: Math.min(Math.round(score * 1.1), 100),
        },
        update: {
          score: Math.round(score * 100) / 100,
          confidence: Math.round(avgConfidence),
          conceptsMastered,
          conceptsTotal: masteries.length,
          recommendedDifficulty: Math.min(Math.round(score * 1.1), 100),
        },
      });

      subjectMasteriesCreated++;
    }
  }

  console.log(
    `   ✅ Created/updated: ${subjectMasteriesCreated} subject masteries\n`,
  );

  // ═══════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════

  console.log("═══════════════════════════════════════════════════════");
  console.log("✅ Migration complete!");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`   Migrated profiles: ${migrated}`);
  console.log(`   Updated questions: ${updated}`);
  console.log(`   Subject masteries: ${subjectMasteriesCreated}`);
  console.log("═══════════════════════════════════════════════════════\n");
}

main()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
