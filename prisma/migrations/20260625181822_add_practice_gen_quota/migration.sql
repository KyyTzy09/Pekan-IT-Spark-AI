-- AlterTable
ALTER TABLE "daily_ai_quotas" ADD COLUMN     "practiceGenCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "topicGenCount" INTEGER NOT NULL DEFAULT 0;
