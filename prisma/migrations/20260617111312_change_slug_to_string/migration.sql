/*
  Warnings:

  - Changed the type of `slug` on the `subjects` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'SKIPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChallengeItemKind" AS ENUM ('QUESTION', 'MATERIAL', 'REFLECTION');

-- CreateEnum
CREATE TYPE "ChallengeItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ChallengeSource" AS ENUM ('AUTO_DAILY', 'ON_DEMAND');

-- CreateEnum
CREATE TYPE "MaterialSource" AS ENUM ('CHALLENGE', 'ON_DEMAND', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "ReflectionSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "ReflectionDepth" AS ENUM ('SURFACE', 'MODERATE', 'DEEP');

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "slug",
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "ChallengeSource" NOT NULL DEFAULT 'AUTO_DAILY',
    "scheduledFor" DATE NOT NULL,
    "mixConfig" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_items" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" "ChallengeItemKind" NOT NULL,
    "questionId" TEXT,
    "materialId" TEXT,
    "prompt" TEXT,
    "status" "ChallengeItemStatus" NOT NULL DEFAULT 'PENDING',
    "points" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "answer" TEXT,
    "isCorrect" BOOLEAN,

    CONSTRAINT "challenge_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "topicId" TEXT,
    "conceptId" TEXT,
    "documentId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keyPoints" JSONB,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 5,
    "source" "MaterialSource" NOT NULL DEFAULT 'CHALLENGE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_reads" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readSeconds" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "material_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "sentiment" "ReflectionSentiment" NOT NULL DEFAULT 'NEUTRAL',
    "depth" "ReflectionDepth" NOT NULL DEFAULT 'SURFACE',
    "suggestions" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_challenge_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalActive" INTEGER NOT NULL DEFAULT 0,
    "totalCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "pointsByKind" JSONB NOT NULL,
    "questionsCompleted" INTEGER NOT NULL DEFAULT 0,
    "materialsCompleted" INTEGER NOT NULL DEFAULT 0,
    "reflectionsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_challenge_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_quizzes" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "attempts" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_tip_cache" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "forDate" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_tip_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "challenges_userId_scheduledFor_idx" ON "challenges"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "challenges_userId_status_idx" ON "challenges"("userId", "status");

-- CreateIndex
CREATE INDEX "challenges_userId_subjectId_idx" ON "challenges"("userId", "subjectId");

-- CreateIndex
CREATE INDEX "challenge_items_challengeId_order_idx" ON "challenge_items"("challengeId", "order");

-- CreateIndex
CREATE INDEX "materials_userId_subjectId_idx" ON "materials"("userId", "subjectId");

-- CreateIndex
CREATE INDEX "materials_userId_createdAt_idx" ON "materials"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "materials_userId_source_idx" ON "materials"("userId", "source");

-- CreateIndex
CREATE INDEX "materials_documentId_idx" ON "materials"("documentId");

-- CreateIndex
CREATE INDEX "material_reads_userId_readAt_idx" ON "material_reads"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "material_reads_userId_materialId_key" ON "material_reads"("userId", "materialId");

-- CreateIndex
CREATE INDEX "reflections_userId_challengeId_idx" ON "reflections"("userId", "challengeId");

-- CreateIndex
CREATE INDEX "reflections_userId_submittedAt_idx" ON "reflections"("userId", "submittedAt");

-- CreateIndex
CREATE INDEX "user_challenge_progress_userId_date_idx" ON "user_challenge_progress"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "user_challenge_progress_userId_date_key" ON "user_challenge_progress"("userId", "date");

-- CreateIndex
CREATE INDEX "document_quizzes_documentId_idx" ON "document_quizzes"("documentId");

-- CreateIndex
CREATE INDEX "parent_tip_cache_studentId_idx" ON "parent_tip_cache"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "parent_tip_cache_studentId_forDate_key" ON "parent_tip_cache"("studentId", "forDate");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_slug_key" ON "subjects"("slug");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_items" ADD CONSTRAINT "challenge_items_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_items" ADD CONSTRAINT "challenge_items_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_items" ADD CONSTRAINT "challenge_items_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_reads" ADD CONSTRAINT "material_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_reads" ADD CONSTRAINT "material_reads_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reflections" ADD CONSTRAINT "reflections_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_quizzes" ADD CONSTRAINT "document_quizzes_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
