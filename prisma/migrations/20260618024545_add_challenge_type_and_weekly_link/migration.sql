-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('DAILY', 'WEEKLY');

-- AlterEnum
ALTER TYPE "ChallengeSource" ADD VALUE 'AUTO_WEEKLY';

-- AlterTable
ALTER TABLE "challenges" ADD COLUMN     "type" "ChallengeType" NOT NULL DEFAULT 'DAILY';

-- AlterTable
ALTER TABLE "weekly_challenges" ADD COLUMN     "challengeId" TEXT;

-- CreateIndex
CREATE INDEX "challenges_userId_type_idx" ON "challenges"("userId", "type");

-- CreateIndex
CREATE INDEX "weekly_challenges_challengeId_idx" ON "weekly_challenges"("challengeId");

-- AddForeignKey
ALTER TABLE "weekly_challenges" ADD CONSTRAINT "weekly_challenges_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
