-- CreateTable
CREATE TABLE "generation_locks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lockType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generation_locks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generation_locks_expiresAt_idx" ON "generation_locks"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "generation_locks_userId_lockType_key" ON "generation_locks"("userId", "lockType");
