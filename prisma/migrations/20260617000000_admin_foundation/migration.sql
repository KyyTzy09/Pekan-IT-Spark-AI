-- AlterTable: add isActive to users (for ban/suspend)
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: add isActive to subjects (for soft delete on reject)
ALTER TABLE "subjects" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "subjects_isVerified_idx" ON "subjects"("isVerified");

-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM (
  'CUSTOM_SUBJECT_APPROVE',
  'CUSTOM_SUBJECT_REJECT',
  'USER_BAN',
  'USER_UNBAN',
  'USER_SUSPEND',
  'USER_UNSUSPEND',
  'CONTENT_DELETE'
);

-- CreateTable: admin audit log
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" "AdminAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_log_adminId_createdAt_idx" ON "admin_audit_log"("adminId", "createdAt");
CREATE INDEX "admin_audit_log_targetType_targetId_idx" ON "admin_audit_log"("targetType", "targetId");
CREATE INDEX "admin_audit_log_action_idx" ON "admin_audit_log"("action");

-- AddForeignKey
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
