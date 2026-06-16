import "server-only";

import { embed, embeddingModel, embedMany } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

function parseEmbedding(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as number[]) : [];
  } catch {
    return [];
  }
}

function cosineSimilarityVectors(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

interface RetrievedDocument {
  id: string;
  content: string;
  title: string;
  type: "concept" | "document";
  score: number;
}

interface SearchOptions {
  userId: string;
  query: string;
  subjectId?: string;
  topicId?: string;
  limit?: number;
}

export async function retrieveContext(
  options: SearchOptions,
): Promise<RetrievedDocument[]> {
  console.log("[AI_SERVICE] retrieveContext start", {
    query: options.query,
  });
  const { query, userId, subjectId, limit = 3 } = options;
  const results: RetrievedDocument[] = [];

  try {
    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    // 1) Search concepts (Prisma + JS cosine similarity, since embedding
    //    column is @db.Text, not pgvector)
    const concepts = await prisma.concept.findMany({
      where: subjectId ? { topic: { subjectId } } : undefined,
      include: {
        topic: { select: { subjectId: true } },
        embeddings: { select: { embedding: true } },
      },
    });

    const conceptScored = concepts
      .map((c) => {
        const raw = c.embeddings[0]?.embedding;
        if (!raw) return null;
        const docVec = parseEmbedding(raw);
        const score = cosineSimilarityVectors(queryEmbedding, docVec);
        if (score <= 0) return null;
        const content = `${c.description ?? ""} ${c.contentMd ?? ""}`.trim();
        return {
          id: c.id,
          name: c.name,
          content: content || c.name,
          score,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    for (const r of conceptScored) {
      results.push({
        id: r.id,
        content: r.content.substring(0, 2000),
        title: r.name,
        type: "concept",
        score: r.score,
      });
    }

    // 2) Search user document chunks
    const userDocuments = await prisma.document.findMany({
      where: { userId },
      select: { id: true, content: true, originalName: true },
    });

    const docEmbeddings = userDocuments.filter((d) => d.content.length > 0);
    if (docEmbeddings.length > 0) {
      const texts = docEmbeddings.map((d) => d.content.substring(0, 8000));
      const { embeddings: docVecs } = await embedMany({
        model: embeddingModel,
        values: texts,
        maxRetries: 0,
      });

      for (let i = 0; i < docEmbeddings.length; i++) {
        const docVec = docVecs[i] ?? [];
        if (docVec.length === 0) continue;
        const chunks = await prisma.documentEmbedding.findMany({
          where: { documentId: docEmbeddings[i].id },
          select: { chunkContent: true, embedding: true },
        });
        let bestScore = 0;
        for (const chunk of chunks) {
          const chunkVec = parseEmbedding(chunk.embedding);
          if (chunkVec.length === 0) continue;
          const s = cosineSimilarityVectors(docVec, chunkVec);
          if (s > bestScore) bestScore = s;
        }
        if (bestScore > 0.3) {
          results.push({
            id: docEmbeddings[i].id,
            content: docEmbeddings[i].content.substring(0, 2000),
            title: docEmbeddings[i].originalName,
            type: "document",
            score: bestScore,
          });
        }
      }
    }
  } catch (e: unknown) {
    console.warn(
      "Vector search failed, falling back to keyword search:",
      e instanceof Error ? e.message : String(e),
    );
    return keywordSearch(options);
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

async function keywordSearch(
  options: SearchOptions,
): Promise<RetrievedDocument[]> {
  const { query, userId, limit = 3 } = options;
  const queryTokens = simpleTokenize(query);
  const results: RetrievedDocument[] = [];

  const userKnowledgeProfiles = await prisma.studentKnowledgeProfile.findMany({
    where: { userId },
    include: {
      concept: {
        include: { topic: true },
      },
    },
  });

  for (const profile of userKnowledgeProfiles) {
    const conceptText = `${profile.concept.name} ${profile.concept.description || ""} ${profile.concept.contentMd || ""}`;
    const conceptTokens = simpleTokenize(conceptText);
    const score = cosineSimilarity(queryTokens, conceptTokens);

    if (score > 0.05) {
      results.push({
        id: profile.concept.id,
        content: conceptText.substring(0, 2000),
        title: profile.concept.name,
        type: "concept",
        score,
      });
    }
  }

  const documents = await prisma.document.findMany({
    where: { userId },
    select: { id: true, content: true, originalName: true },
  });

  for (const doc of documents) {
    const docTokens = simpleTokenize(doc.content);
    const score = cosineSimilarity(queryTokens, docTokens);

    if (score > 0.05) {
      results.push({
        id: doc.id,
        content: doc.content.substring(0, 2000),
        title: doc.originalName,
        type: "document",
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function getRelevantConcepts(query: string, subjectId?: string) {
  console.log("[AI_SERVICE] getRelevantConcepts start", { query });
  try {
    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    const concepts = await prisma.concept.findMany({
      where: subjectId ? { topic: { subjectId } } : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        topicId: true,
        embeddings: { select: { embedding: true } },
      },
    });

    const scored = concepts
      .map((c) => {
        const raw = c.embeddings[0]?.embedding;
        if (!raw) return null;
        const docVec = parseEmbedding(raw);
        const score = cosineSimilarityVectors(queryEmbedding, docVec);
        if (score <= 0) return null;
        return {
          concept: {
            id: c.id,
            name: c.name,
            description: c.description,
            topicId: c.topicId,
          },
          score,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return scored;
  } catch (e: unknown) {
    console.warn(
      "Vector search failed, falling back to keyword search:",
      e instanceof Error ? e.message : String(e),
    );
    return keywordRelevantConcepts(query, subjectId);
  }
}

async function keywordRelevantConcepts(query: string, subjectId?: string) {
  const queryTokens = simpleTokenize(query);

  const where = subjectId ? { topic: { subjectId } } : {};

  const concepts = await prisma.concept.findMany({
    where,
    include: { topic: true },
    take: 50,
  });

  return concepts
    .map((c) => {
      const text = `${c.name} ${c.description || ""} ${c.contentMd || ""}`;
      const tokens = simpleTokenize(text);
      return { concept: c, score: cosineSimilarity(queryTokens, tokens) };
    })
    .filter((c) => c.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function simpleTokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function cosineSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  const setB = new Set(b);
  const intersection = a.filter((t) => setB.has(t)).length;
  const magnitude = Math.sqrt(a.length) * Math.sqrt(b.length);
  return magnitude === 0 ? 0 : intersection / magnitude;
}
