import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const STUDENT_EMAIL = "siswa@sparkai.id";
const STUDENT_PASSWORD = "siswa123";
const STUDENT_NAME = "Siswa Demo";
const STUDENT_SCHOOL = "SMA Negeri 1 Demo";
const FOCUSED_SUBJECT_SLUGS = ["MATEMATIKA", "IPA"] as const;

const DEMO_TOTAL_XP = 350;
const DEMO_LEVEL = 3;
const DEMO_STREAK_CURRENT = 5;
const DEMO_STREAK_LONGEST = 12;
const DEMO_BUDDY_TYPE = "bunga";
const DEMO_BUDDY_STAGE = 1;
const DEMO_AVATAR_COLOR = "default";

const daysAgo = (n: number): Date =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);

type ConceptPick = { id: string; name: string };

type KnowledgeSeed = {
  concept: ConceptPick | undefined;
  mastery: number;
  status: "MASTERED" | "LEARNING" | "STRUGGLING";
  attempts: number;
};

async function main() {
  const passwordHash = await bcrypt.hash(STUDENT_PASSWORD, 12);

  const subjects = await prisma.subject.findMany({
    where: { slug: { in: [...FOCUSED_SUBJECT_SLUGS] } },
    select: { id: true, slug: true, name: true },
  });
  if (subjects.length !== FOCUSED_SUBJECT_SLUGS.length) {
    const found = new Set(subjects.map((s) => s.slug));
    const missing = FOCUSED_SUBJECT_SLUGS.filter((s) => !found.has(s));
    throw new Error(
      `Subject belum ada di DB, jalankan \`bun run db:seed\` dulu. Missing: ${missing.join(", ")}`,
    );
  }
  const focusedSubjectIds = subjects.map((s) => s.id);

  const user = await prisma.user.upsert({
    where: { email: STUDENT_EMAIL },
    update: {
      name: STUDENT_NAME,
      passwordHash,
      role: "STUDENT",
      isOnboarded: true,
    },
    create: {
      email: STUDENT_EMAIL,
      name: STUDENT_NAME,
      passwordHash,
      role: "STUDENT",
      isOnboarded: true,
    },
  });

  const profileFields = {
    educationLevel: "SMA" as const,
    grade: 11,
    school: STUDENT_SCHOOL,
    focusedSubjects: focusedSubjectIds,
    learningStyle: "VISUAL" as const,
    reminderEnabled: false,
    reminderTime: null,
    totalXp: DEMO_TOTAL_XP,
    level: DEMO_LEVEL,
  };

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: profileFields,
    create: { userId: user.id, ...profileFields },
  });

  await prisma.streak.upsert({
    where: { userId: user.id },
    update: {
      currentStreak: DEMO_STREAK_CURRENT,
      longestStreak: DEMO_STREAK_LONGEST,
      lastActivityAt: new Date(),
      freezeAvailable: 1,
    },
    create: {
      userId: user.id,
      currentStreak: DEMO_STREAK_CURRENT,
      longestStreak: DEMO_STREAK_LONGEST,
      lastActivityAt: new Date(),
      freezeAvailable: 1,
    },
  });

  await prisma.studyBuddy.upsert({
    where: { userId: user.id },
    update: { type: DEMO_BUDDY_TYPE, stage: DEMO_BUDDY_STAGE },
    create: {
      userId: user.id,
      type: DEMO_BUDDY_TYPE,
      stage: DEMO_BUDDY_STAGE,
    },
  });

  await prisma.avatarCustomization.upsert({
    where: { userId: user.id },
    update: { color: DEMO_AVATAR_COLOR },
    create: { userId: user.id, color: DEMO_AVATAR_COLOR },
  });

  const concepts = await prisma.concept.findMany({
    where: { topic: { subjectId: { in: focusedSubjectIds } } },
    select: { id: true, name: true, topic: { select: { order: true } } },
    orderBy: [{ topic: { order: "asc" } }, { order: "asc" }],
    take: 8,
  });

  const knowledgeSeed: KnowledgeSeed[] = [
    { concept: concepts[0], mastery: 88, status: "MASTERED", attempts: 8 },
    { concept: concepts[1], mastery: 75, status: "MASTERED", attempts: 6 },
    { concept: concepts[2], mastery: 55, status: "LEARNING", attempts: 5 },
    { concept: concepts[3], mastery: 42, status: "LEARNING", attempts: 4 },
    { concept: concepts[4], mastery: 20, status: "STRUGGLING", attempts: 3 },
    { concept: concepts[5], mastery: 65, status: "LEARNING", attempts: 5 },
  ];

  for (const seed of knowledgeSeed) {
    if (!seed.concept) continue;
    
    // Old table (backward compat)
    const oldData = {
      masteryScore: seed.mastery / 100, // convert to 0-1
      status: seed.status,
      attemptCount: seed.attempts,
      lastAttemptAt: new Date(),
    };
    await prisma.studentKnowledgeProfile.upsert({
      where: {
        userId_conceptId: { userId: user.id, conceptId: seed.concept.id },
      },
      update: oldData,
      create: { userId: user.id, conceptId: seed.concept.id, ...oldData },
    });

    // New mastery table
    const confidence = Math.min(Math.round((seed.attempts / 30) * 100), 100);
    const newData = {
      score: seed.mastery, // already 0-100
      confidence,
      attemptCount: seed.attempts,
      correctCount: Math.round(seed.attempts * 0.7), // assume 70% correct
      totalTimeSpent: seed.attempts * 35, // avg 35 sec per attempt
      peakScore: seed.mastery,
      lastAttemptAt: new Date(),
    };
    await prisma.studentMastery.upsert({
      where: {
        userId_conceptId: { userId: user.id, conceptId: seed.concept.id },
      },
      update: newData,
      create: { userId: user.id, conceptId: seed.concept.id, ...newData },
    });
  }

  // Seed SubjectMastery (aggregated)
  for (const subjectId of focusedSubjectIds) {
    const subjectConcepts = await prisma.concept.findMany({
      where: { topic: { subjectId } },
      select: { id: true },
    });
    const conceptIds = subjectConcepts.map(c => c.id);
    
    const masteries = await prisma.studentMastery.findMany({
      where: { userId: user.id, conceptId: { in: conceptIds } },
      select: { score: true, confidence: true },
    });

    if (masteries.length > 0) {
      const avgScore = masteries.reduce((sum, m) => sum + m.score, 0) / masteries.length;
      const avgConfidence = masteries.reduce((sum, m) => sum + m.confidence, 0) / masteries.length;
      const conceptsMastered = masteries.filter(m => m.score >= 89).length;

      await prisma.subjectMastery.upsert({
        where: {
          userId_subjectId: { userId: user.id, subjectId },
        },
        update: {
          score: Math.round(avgScore * 100) / 100,
          confidence: Math.round(avgConfidence),
          conceptsMastered,
          conceptsTotal: masteries.length,
          recommendedDifficulty: Math.min(Math.round(avgScore * 1.1), 100),
        },
        create: {
          userId: user.id,
          subjectId,
          score: Math.round(avgScore * 100) / 100,
          confidence: Math.round(avgConfidence),
          conceptsMastered,
          conceptsTotal: masteries.length,
          recommendedDifficulty: Math.min(Math.round(avgScore * 1.1), 100),
        },
      });
    }
  }

  const questions = await prisma.question.findMany({
    where: {
      isActive: true,
      concept: { topic: { subjectId: { in: focusedSubjectIds } } },
    },
    take: 18,
    select: { id: true },
  });

  if (questions.length > 0) {
    const letters = ["A", "B", "C", "D"] as const;
    await prisma.questionAttempt.createMany({
      data: questions.map((q, i) => ({
        userId: user.id,
        questionId: q.id,
        answer: letters[i % 4] ?? "A",
        isCorrect: i % 3 !== 0,
        timeSpent: 25 + ((i * 7) % 50),
      })),
    });
  }

  const xpEntries: Array<{
    userId: string;
    source: "ANSWER_CORRECT" | "STREAK" | "CONCEPT_MASTERED" | "DAILY_QUEST";
    amount: number;
    createdAt: Date;
  }> = [
    {
      userId: user.id,
      source: "ANSWER_CORRECT",
      amount: 10,
      createdAt: daysAgo(7),
    },
    {
      userId: user.id,
      source: "ANSWER_CORRECT",
      amount: 10,
      createdAt: daysAgo(6),
    },
    {
      userId: user.id,
      source: "ANSWER_CORRECT",
      amount: 10,
      createdAt: daysAgo(5),
    },
    { userId: user.id, source: "STREAK", amount: 20, createdAt: daysAgo(5) },
    {
      userId: user.id,
      source: "ANSWER_CORRECT",
      amount: 10,
      createdAt: daysAgo(4),
    },
    {
      userId: user.id,
      source: "ANSWER_CORRECT",
      amount: 10,
      createdAt: daysAgo(3),
    },
    {
      userId: user.id,
      source: "ANSWER_CORRECT",
      amount: 10,
      createdAt: daysAgo(2),
    },
    {
      userId: user.id,
      source: "ANSWER_CORRECT",
      amount: 10,
      createdAt: daysAgo(1),
    },
    {
      userId: user.id,
      source: "CONCEPT_MASTERED",
      amount: 50,
      createdAt: daysAgo(1),
    },
    {
      userId: user.id,
      source: "ANSWER_CORRECT",
      amount: 10,
      createdAt: daysAgo(0),
    },
    { userId: user.id, source: "STREAK", amount: 20, createdAt: daysAgo(0) },
  ];
  await prisma.xpTransaction.createMany({ data: xpEntries });

  const knowledgeCount = await prisma.studentKnowledgeProfile.count({
    where: { userId: user.id },
  });
  const attemptCount = await prisma.questionAttempt.count({
    where: { userId: user.id },
  });

  console.log(`✓ Akun siswa dibuat: ${STUDENT_EMAIL} / ${STUDENT_PASSWORD}`);
  console.log(`  - isOnboarded: true`);
  console.log(`  - Profile: SMA kelas 11, ${STUDENT_SCHOOL}`);
  console.log(`  - Fokus: ${FOCUSED_SUBJECT_SLUGS.join(", ")}`);
  console.log(`  - Learning style: VISUAL`);
  console.log(
    `  - Level/XP: ${DEMO_LEVEL} (${DEMO_TOTAL_XP} XP) — ${profileFields.learningStyle}`,
  );
  console.log(
    `  - Streak: ${DEMO_STREAK_CURRENT} hari aktif (rekor ${DEMO_STREAK_LONGEST}, 1 freeze)`,
  );
  console.log(
    `  - Knowledge profiles: ${knowledgeCount} konsep (mastered/learning/struggling)`,
  );
  console.log(`  - Study buddy: ${DEMO_BUDDY_TYPE} stage ${DEMO_BUDDY_STAGE}`);
  console.log(`  - Avatar: ${DEMO_AVATAR_COLOR}`);
  console.log(
    `  - Total soal dijawab (termasuk seed sebelumnya): ${attemptCount}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
