-- CreateEnum
CREATE TYPE "DocumentAuditAction" AS ENUM (
  'UPLOAD',
  'PROCESS',
  'SUMMARY_GENERATED',
  'QUIZ_GENERATED',
  'SHARE_TO_CHAT',
  'CHAT_REFERENCED',
  'RAG_QUERY',
  'DELETE',
  'REJECTED'
);

-- CreateTable
CREATE TABLE "document_audit_logs" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "DocumentAuditAction" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_audit_logs_documentId_idx" ON "document_audit_logs"("documentId");

-- CreateIndex
CREATE INDEX "document_audit_logs_userId_idx" ON "document_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "document_audit_logs_action_idx" ON "document_audit_logs"("action");

-- AddForeignKey
ALTER TABLE "document_audit_logs" ADD CONSTRAINT "document_audit_logs_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_audit_logs" ADD CONSTRAINT "document_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
