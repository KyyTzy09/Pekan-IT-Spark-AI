-- AlterTable
ALTER TABLE "documents" ADD COLUMN "chatSessionId" TEXT;

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- CreateIndex
CREATE INDEX "documents_chatSessionId_idx" ON "documents"("chatSessionId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "chat_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
