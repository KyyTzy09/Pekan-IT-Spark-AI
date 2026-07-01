import "server-only";

import { embed, embeddingModel } from "@/lib/ai";
import { aiLog, EMOJI } from "@/lib/ai-logger";
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
  queryEmbedding?: number[];
}

export async function retrieveContext(
  options: SearchOptions,
): Promise<RetrievedDocument[]> {
  aiLog.info(
    `${EMOJI.start} retrieveContext — "${options.query.slice(0, 50)}..."`,
  );

  // BUG-16 FIX: Use AbortController to cancel inner work on timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const result = await retrieveContextInner(options, controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    aiLog.warn(
      `${EMOJI.warn} retrieveContext timeout/gagal, pakai keyword search`,
    );
    return keywordSearch(options);
  }
}

async function retrieveContextInner(
  options: SearchOptions,
  signal?: AbortSignal,
): Promise<RetrievedDocument[]> {
  const { query, userId, subjectId, limit = 3 } = options;

  // Check if already aborted
  if (signal?.aborted) throw new Error("Aborted");

  // Reuse pre-computed embedding if available (avoids double embedding)
  const queryEmbedding =
    options.queryEmbedding ??
    (await embed({ model: embeddingModel, value: query })).embedding;

  // Check again after potentially slow embedding call
  if (signal?.aborted) throw new Error("Aborted");

  // Parallel: fetch concepts + document chunks at the same time
  const [concepts, chunks] = await Promise.all([
    prisma.concept.findMany({
      where: subjectId ? { topic: { subjectId } } : undefined,
      take: 50,
      include: {
        topic: { select: { subjectId: true } },
        embeddings: { select: { embedding: true } },
      },
    }),
    prisma.documentEmbedding.findMany({
      where: { document: { userId } },
      select: {
        documentId: true,
        chunkContent: true,
        embedding: true,
        document: { select: { originalName: true } },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (signal?.aborted) throw new Error("Aborted");

  // Score concepts
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
        content: (content || c.name).substring(0, 2000),
        title: c.name,
        type: "concept" as const,
        score,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Score document chunks
  const chunkScored = chunks
    .map((c) => {
      const chunkVec = parseEmbedding(c.embedding);
      if (chunkVec.length === 0) return null;
      const score = cosineSimilarityVectors(queryEmbedding, chunkVec);
      if (score <= 0.3) return null;
      return {
        id: c.documentId,
        content: c.chunkContent.substring(0, 2000),
        title: c.document.originalName,
        type: "document" as const,
        score,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Merge and return top results
  return [...conceptScored, ...chunkScored]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function keywordSearch(
  options: SearchOptions,
): Promise<RetrievedDocument[]> {
  const { query, userId, subjectId, limit = 3 } = options;
  const queryTokens = simpleTokenize(query);
  const results: RetrievedDocument[] = [];

  const concepts = await prisma.concept.findMany({
    where: subjectId
      ? { topic: { subjectId } }
      : {
          topic: {
            subject: {
              OR: [{ createdById: null }, { createdById: userId }],
            },
          },
        },
    include: {
      topic: { select: { name: true, subject: { select: { name: true } } } },
    },
    take: 100,
  });

  for (const c of concepts) {
    const conceptText = `${c.name} ${c.description || ""} ${c.contentMd || ""}`;
    const conceptTokens = simpleTokenize(conceptText);
    const score = cosineSimilarity(queryTokens, conceptTokens);

    if (score > 0.05) {
      results.push({
        id: c.id,
        content: conceptText.substring(0, 2000),
        title: c.name,
        type: "concept",
        score,
      });
    }
  }

  const documents = await prisma.document.findMany({
    where: { userId },
    select: { id: true, content: true, originalName: true },
    // BUG-14 FIX: Limit documents to prevent OOM with large collections
    take: 20,
    orderBy: { createdAt: "desc" },
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
  aiLog.info(`${EMOJI.start} getRelevantConcepts — "${query.slice(0, 50)}..."`);
  // BUG-16 FIX: Use AbortController instead of Promise.race
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const result = await getRelevantConceptsInner(
      query,
      subjectId,
      controller.signal,
    );
    clearTimeout(timeoutId);
    return result;
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    aiLog.warn(
      `${EMOJI.warn} getRelevantConcepts timeout, pakai keyword search`,
    );
    return keywordRelevantConcepts(query, subjectId);
  }
}

async function getRelevantConceptsInner(
  query: string,
  subjectId?: string,
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw new Error("Aborted");

  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  if (signal?.aborted) throw new Error("Aborted");

  const concepts = await prisma.concept.findMany({
    where: subjectId ? { topic: { subjectId } } : undefined,
    select: {
      id: true,
      name: true,
      description: true,
      topicId: true,
      embeddings: { select: { embedding: true } },
    },
    take: 50,
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
