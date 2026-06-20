import "server-only";

import { randomUUID } from "node:crypto";
import { embed, embeddingModel, embedMany } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 200;
const MAX_CHUNKS_PER_DOC = 80;
const TOP_K_CHUNKS = 4;

export type DocumentChunk = {
  index: number;
  content: string;
  charStart: number;
  charEnd: number;
};

export function chunkDocument(text: string): DocumentChunk[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (normalized.length === 0) return [];
  if (normalized.length <= CHUNK_SIZE) {
    return [
      {
        index: 0,
        content: normalized,
        charStart: 0,
        charEnd: normalized.length,
      },
    ];
  }

  const chunks: DocumentChunk[] = [];
  let cursor = 0;
  let index = 0;
  while (cursor < normalized.length && chunks.length < MAX_CHUNKS_PER_DOC) {
    const end = Math.min(cursor + CHUNK_SIZE, normalized.length);
    let sliceEnd = end;
    if (end < normalized.length) {
      const breakPoint = findBreakPoint(normalized, end);
      if (breakPoint > cursor + CHUNK_SIZE * 0.5) {
        sliceEnd = breakPoint;
      }
    }
    const content = normalized.slice(cursor, sliceEnd).trim();
    if (content.length > 0) {
      chunks.push({
        index,
        content,
        charStart: cursor,
        charEnd: sliceEnd,
      });
      index++;
    }
    if (sliceEnd >= normalized.length) break;
    cursor = Math.max(sliceEnd - CHUNK_OVERLAP, cursor + 1);
  }
  return chunks;
}

function findBreakPoint(text: string, endPos: number): number {
  const tail = text.slice(endPos - 200, endPos);
  const sentenceMatch = /[.!?\n][\s\n]+(?!.*[.!?\n])/g.exec(tail);
  if (sentenceMatch) {
    return endPos - 200 + sentenceMatch.index + 1;
  }
  const space = tail.lastIndexOf(" ");
  if (space > 0) {
    return endPos - 200 + space;
  }
  return endPos;
}

export async function embedDocumentChunks(
  documentId: string,
  content: string,
): Promise<{ chunks: number; skipped: boolean }> {
  const existing = await prisma.documentEmbedding.count({
    where: { documentId },
  });
  if (existing > 0) {
    return { chunks: existing, skipped: true };
  }
  const chunks = chunkDocument(content);
  if (chunks.length === 0) {
    return { chunks: 0, skipped: true };
  }
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks.map((c) => c.content),
  });
  await prisma.documentEmbedding.createMany({
    data: chunks.map((c, i) => ({
      id: randomUUID(),
      documentId,
      chunkIndex: c.index,
      chunkContent: c.content,
      embedding: JSON.stringify(embeddings[i]),
    })),
  });
  return { chunks: chunks.length, skipped: false };
}

export type RetrievedChunk = {
  chunkIndex: number;
  content: string;
  score: number;
};

export async function retrieveDocumentChunks(
  documentId: string,
  query: string,
  topK: number = TOP_K_CHUNKS,
): Promise<RetrievedChunk[]> {
  if (!query.trim()) return [];
  const rows = await prisma.documentEmbedding.findMany({
    where: { documentId },
    select: { chunkIndex: true, chunkContent: true, embedding: true },
  });
  if (rows.length === 0) return [];

  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  });
  const queryVec = queryEmbedding;
  const scored: RetrievedChunk[] = rows.map((r) => {
    let docVec: number[];
    try {
      docVec = JSON.parse(r.embedding);
    } catch {
      docVec = [];
    }
    return {
      chunkIndex: r.chunkIndex,
      content: r.chunkContent,
      score: cosineSimilarity(queryVec, docVec),
    };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

function cosineSimilarity(a: number[], b: number[]): number {
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
