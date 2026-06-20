-- DropForeignKey
ALTER TABLE "learning_activities" DROP CONSTRAINT "learning_activities_userId_fkey";

-- DropForeignKey
ALTER TABLE "learning_plans" DROP CONSTRAINT "learning_plans_userId_fkey";

-- AlterTable: add subject selection fields to student_profiles
ALTER TABLE "student_profiles" ADD COLUMN     "challengeSubjectIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weeklyChallengeSubjectIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill: copy focusedSubjects into the new challenge subject selection fields
-- (so existing users get the same behavior they had before)
UPDATE "student_profiles"
SET "challengeSubjectIds" = "focusedSubjects",
    "weeklyChallengeSubjectIds" = "focusedSubjects"
WHERE array_length("focusedSubjects", 1) > 0;

-- DropTable
DROP TABLE "learning_activities";

-- DropTable
DROP TABLE "learning_plans";

-- CreateTable: AI generation quota per user per day
CREATE TABLE "daily_ai_quotas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "questionsCount" INTEGER NOT NULL DEFAULT 0,
    "materialsCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_ai_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_ai_quotas_userId_key" ON "daily_ai_quotas"("userId");

-- CreateIndex
CREATE INDEX "daily_ai_quotas_date_idx" ON "daily_ai_quotas"("date");

-- AddForeignKey
ALTER TABLE "daily_ai_quotas" ADD CONSTRAINT "daily_ai_quotas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
