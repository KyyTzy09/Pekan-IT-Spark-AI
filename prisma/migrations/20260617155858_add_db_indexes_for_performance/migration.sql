-- CreateIndex
CREATE INDEX "chat_messages_sessionId_createdAt_idx" ON "chat_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_updatedAt_idx" ON "chat_sessions"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "learning_activities_userId_createdAt_idx" ON "learning_activities"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "learning_activities_userId_type_idx" ON "learning_activities"("userId", "type");

-- CreateIndex
CREATE INDEX "learning_activities_createdAt_idx" ON "learning_activities"("createdAt");

-- CreateIndex
CREATE INDEX "question_attempts_userId_idx" ON "question_attempts"("userId");

-- CreateIndex
CREATE INDEX "question_attempts_questionId_idx" ON "question_attempts"("questionId");

-- CreateIndex
CREATE INDEX "question_attempts_userId_questionId_idx" ON "question_attempts"("userId", "questionId");

-- CreateIndex
CREATE INDEX "questions_conceptId_idx" ON "questions"("conceptId");

-- CreateIndex
CREATE INDEX "questions_difficulty_bloomTaxonomy_idx" ON "questions"("difficulty", "bloomTaxonomy");

-- CreateIndex
CREATE INDEX "questions_isActive_idx" ON "questions"("isActive");

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_idx" ON "quiz_attempts"("userId");

-- CreateIndex
CREATE INDEX "quiz_attempts_quizId_idx" ON "quiz_attempts"("quizId");

-- CreateIndex
CREATE INDEX "quiz_attempts_userId_quizId_idx" ON "quiz_attempts"("userId", "quizId");

-- CreateIndex
CREATE INDEX "student_knowledge_profiles_userId_idx" ON "student_knowledge_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_knowledge_profiles_status_idx" ON "student_knowledge_profiles"("status");

-- CreateIndex
CREATE INDEX "xp_transactions_userId_createdAt_idx" ON "xp_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "xp_transactions_userId_source_idx" ON "xp_transactions"("userId", "source");
