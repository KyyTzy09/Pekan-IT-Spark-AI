-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Alter embedding columns to use pgvector type
ALTER TABLE "concept_embeddings" ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding"::vector(1536);
ALTER TABLE "document_embeddings" ALTER COLUMN "embedding" TYPE vector(1536) USING "embedding"::vector(1536);

-- Create HNSW indexes for fast similarity search
CREATE INDEX CONCURRENTLY IF NOT EXISTS "concept_embeddings_vector_idx" ON "concept_embeddings" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "document_embeddings_vector_idx" ON "document_embeddings" USING hnsw ("embedding" vector_cosine_ops);
