/*
  Warnings:

  - You are about to alter the column `embedding` on the `concept_embeddings` table. The data in that column could be lost. The data in that column will be cast from `vector(1536)` to `Text`.
  - You are about to alter the column `embedding` on the `document_embeddings` table. The data in that column could be lost. The data in that column will be cast from `vector(1536)` to `Text`.

*/
-- CreateEnum
CREATE TYPE "SubjectSource" AS ENUM ('OFFICIAL', 'AI_GENERATED', 'USER_CREATED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubjectSlug" ADD VALUE 'SEJARAH';
ALTER TYPE "SubjectSlug" ADD VALUE 'GEOGRAFI';
ALTER TYPE "SubjectSlug" ADD VALUE 'EKONOMI';
ALTER TYPE "SubjectSlug" ADD VALUE 'SOSIOLOGI';
ALTER TYPE "SubjectSlug" ADD VALUE 'PPKN';
ALTER TYPE "SubjectSlug" ADD VALUE 'SENI_BUDAYA';
ALTER TYPE "SubjectSlug" ADD VALUE 'PJOK';
ALTER TYPE "SubjectSlug" ADD VALUE 'PRAKARYA';
ALTER TYPE "SubjectSlug" ADD VALUE 'BAHASA_DAERAH';
ALTER TYPE "SubjectSlug" ADD VALUE 'CODING';
ALTER TYPE "SubjectSlug" ADD VALUE 'CUSTOM';

-- DropIndex
DROP INDEX "concept_embeddings_vector_idx";

-- DropIndex
DROP INDEX "document_embeddings_vector_idx";

-- AlterTable
ALTER TABLE "concept_embeddings" ALTER COLUMN "embedding" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "concepts" ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "document_embeddings" ALTER COLUMN "embedding" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "parent_student_links" ALTER COLUMN "parentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN     "focusedSubjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderTime" TEXT;

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "source" "SubjectSource" NOT NULL DEFAULT 'OFFICIAL';

-- AlterTable
ALTER TABLE "topics" ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "subjects_isCustom_idx" ON "subjects"("isCustom");

-- CreateIndex
CREATE INDEX "subjects_source_idx" ON "subjects"("source");

-- CreateIndex
CREATE INDEX "subjects_createdById_idx" ON "subjects"("createdById");

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
