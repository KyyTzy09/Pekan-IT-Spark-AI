import "server-only";

import { prisma } from "@/lib/prisma";
import { embedMany, embed } from "ai";
import { embeddingModel } from "@/lib/ai";

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
  const { query, userId, subjectId, limit = 3 } = options;
  const results: RetrievedDocument[] = [];

  try {
    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    const embeddingStr = JSON.stringify(queryEmbedding);

    if (subjectId) {
      const conceptResults = await prisma.$queryRawUnsafe<
        Array<{ id: string; name: string; content: string; distance: number }>
      >(
        `SELECT c.id, c.name, COALESCE(c.description, '') || ' ' || COALESCE(c."contentMd", '') AS content, ce.embedding <=> $1::vector AS distance
         FROM concepts c
         JOIN concept_embeddings ce ON ce."conceptId" = c.id
         JOIN topics t ON t.id = c."topicId"
         WHERE t."subjectId" = $2
         ORDER BY distance
         LIMIT $3`,
        embeddingStr,
        subjectId,
        limit,
      );

      for (const r of conceptResults) {
        results.push({
          id: r.id,
          content: r.content.substring(0, 2000),
          title: r.name,
          type: "concept",
          score: 1 - r.distance,
        });
      }
    } else {
      const conceptResults = await prisma.$queryRawUnsafe<
        Array<{ id: string; name: string; content: string; distance: number }>
      >(
        `SELECT c.id, c.name, COALESCE(c.description, '') || ' ' || COALESCE(c."contentMd", '') AS content, ce.embedding <=> $1::vector AS distance
         FROM concepts c
         JOIN concept_embeddings ce ON ce."conceptId" = c.id
         ORDER BY distance
         LIMIT $2`,
        embeddingStr,
        limit,
      );

      for (const r of conceptResults) {
        results.push({
          id: r.id,
          content: r.content.substring(0, 2000),
          title: r.name,
          type: "concept",
          score: 1 - r.distance,
        });
      }
    }

    const userDocuments = await prisma.document.findMany({
      where: { userId },
      select: { id: true, content: true, originalName: true },
    });

    if (userDocuments.length > 0) {
      const docEmbeddings = userDocuments.filter((d) => d.content.length > 0);
      if (docEmbeddings.length > 0) {
        const texts = docEmbeddings.map((d) => d.content.substring(0, 8000));
        const { embeddings } = await embedMany({
          model: embeddingModel,
          values: texts,
          maxRetries: 0,
        });

        for (let i = 0; i < docEmbeddings.length; i++) {
          const docEmbedding = JSON.stringify(embeddings[i]);
          const docResults = await prisma.$queryRawUnsafe<
            Array<{ id: string; distance: number }>
          >(
            `SELECT id, embedding <=> $1::vector AS distance
             FROM document_embeddings
             WHERE "documentId" = $2
             ORDER BY distance
             LIMIT 1`,
            docEmbedding,
            docEmbeddings[i].id,
          );

          if (docResults.length > 0) {
            const score = 1 - docResults[0].distance;
            if (score > 0.3) {
              results.push({
                id: docEmbeddings[i].id,
                content: docEmbeddings[i].content.substring(0, 2000),
                title: docEmbeddings[i].originalName,
                type: "document",
                score,
              });
            }
          }
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
  const { query, userId, subjectId, limit = 3 } = options;
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
  try {
    const { embedding: queryEmbedding } = await embed({
      model: embeddingModel,
      value: query,
    });

    const embeddingStr = JSON.stringify(queryEmbedding);

    if (subjectId) {
      const results = await prisma.$queryRawUnsafe<
        Array<{
          id: string;
          name: string;
          description: string | null;
          topicId: string;
          distance: number;
        }>
      >(
        `SELECT c.id, c.name, c.description, c."topicId", ce.embedding <=> $1::vector AS distance
         FROM concepts c
         JOIN concept_embeddings ce ON ce."conceptId" = c.id
         JOIN topics t ON t.id = c."topicId"
         WHERE t."subjectId" = $2
         ORDER BY distance
         LIMIT 5`,
        embeddingStr,
        subjectId,
      );

      return results.map((r) => ({
        concept: {
          id: r.id,
          name: r.name,
          description: r.description,
          topicId: r.topicId,
        },
        score: 1 - r.distance,
      }));
    }

    const results = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        description: string | null;
        topicId: string;
        distance: number;
      }>
    >(
      `SELECT c.id, c.name, c.description, c."topicId", ce.embedding <=> $1::vector AS distance
       FROM concepts c
       JOIN concept_embeddings ce ON ce."conceptId" = c.id
       ORDER BY distance
       LIMIT 5`,
      embeddingStr,
    );

    return results.map((r) => ({
      concept: {
        id: r.id,
        name: r.name,
        description: r.description,
        topicId: r.topicId,
      },
      score: 1 - r.distance,
    }));
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
