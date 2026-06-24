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
}

export async function retrieveContext(
  options: SearchOptions,
): Promise<RetrievedDocument[]> {
  aiLog.info(`${EMOJI.start} retrieveContext — "${options.query.slice(0, 50)}..."`);

  // BUG-16 FIX: Use AbortController to cancel inner work on timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const result = await retrieveContextInner(options, controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    aiLog.warn(`${EMOJI.warn} retrieveContext timeout/gagal, pakai keyword search`);
    return keywordSearch(options);
  }
}

async function retrieveContextInner(
  options: SearchOptions,
  signal?: AbortSignal,
): Promise<RetrievedDocument[]> {
  const { query, userId, subjectId, limit = 3 } = options;
  const results: RetrievedDocument[] = [];

  try {
    // Check if already aborted
    if (signal?.aborted) throw new Error("Aborted");

    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    // Check again after potentially slow embedding call
    if (signal?.aborted) throw new Error("Aborted");

    aiLog.info(`${EMOJI.search} Mencari konsep yang relevan...`);
    // 1) Search concepts
    const concepts = await prisma.concept.findMany({
      where: subjectId ? { topic: { subjectId } } : undefined,
      // BUG-17 FIX: Limit concepts to prevent OOM
      take: 200,
      include: {
        topic: { select: { subjectId: true } },
        embeddings: { select: { embedding: true } },
      },
    });
    aiLog.info(`${EMOJI.ok} Ditemukan ${concepts.length} konsep`);

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

    aiLog.info(`${EMOJI.search} Mencari chunk dokumen...`);
    // 2) Search user document chunks directly using the pre-calculated chunk embeddings
    // Limit to 200 chunks max to prevent OOM with large document collections
    const chunks = await prisma.documentEmbedding.findMany({
      where: { document: { userId } },
      select: {
        documentId: true,
        chunkContent: true,
        embedding: true,
        document: { select: { originalName: true } },
      },
      take: 200,
      orderBy: { createdAt: "desc" },
    });
    aiLog.info(`${EMOJI.ok} Ditemukan ${chunks.length} chunk dokumen`);

    if (chunks.length > 0) {
      const chunkScored = chunks
        .map((c) => {
          const chunkVec = parseEmbedding(c.embedding);
          if (chunkVec.length === 0) return null;
          const score = cosineSimilarityVectors(queryEmbedding, chunkVec);
          if (score <= 0.3) return null; // threshold
          return {
            id: c.documentId,
            content: c.chunkContent,
            title: c.document.originalName,
            type: "document" as const,
            score,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      results.push(...chunkScored);
    }

    aiLog.info(`${EMOJI.ok} retrieveContext selesai — ${results.length} item konteks`);
  } catch (e: unknown) {
    aiLog.warn(`${EMOJI.warn} Vector search gagal, pakai keyword search`);
    return keywordSearch(options);
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
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
    const result = await getRelevantConceptsInner(query, subjectId, controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    aiLog.warn(`${EMOJI.warn} getRelevantConcepts timeout, pakai keyword search`);
    return keywordRelevantConcepts(query, subjectId);
  }
}

async function getRelevantConceptsInner(query: string, subjectId?: string, signal?: AbortSignal) {
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
    // BUG-17 FIX: Limit concepts to prevent OOM
    take: 200,
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
