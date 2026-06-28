-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "difficultyScore" DOUBLE PRECISION NOT NULL DEFAULT 50;

-- CreateTable
CREATE TABLE "student_mastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "totalTimeSpent" INTEGER NOT NULL DEFAULT 0,
    "peakScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "lastDecayAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_mastery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conceptsMastered" INTEGER NOT NULL DEFAULT 0,
    "conceptsTotal" INTEGER NOT NULL DEFAULT 0,
    "recommendedDifficulty" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subject_mastery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_mastery_userId_idx" ON "student_mastery"("userId");

-- CreateIndex
CREATE INDEX "student_mastery_score_idx" ON "student_mastery"("score");

-- CreateIndex
CREATE UNIQUE INDEX "student_mastery_userId_conceptId_key" ON "student_mastery"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "subject_mastery_userId_idx" ON "subject_mastery"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subject_mastery_userId_subjectId_key" ON "subject_mastery"("userId", "subjectId");

-- AddForeignKey
ALTER TABLE "student_mastery" ADD CONSTRAINT "student_mastery_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
