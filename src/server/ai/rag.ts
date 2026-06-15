import "server-only";

import { prisma } from "@/lib/prisma";

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

export async function retrieveContext(
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
  const queryTokens = simpleTokenize(query);

  const where = subjectId ? { topic: { subjectId } } : {};

  const concepts = await prisma.concept.findMany({
    where,
    include: { topic: true },
    take: 50,
  });

  const scored = concepts
    .map((c) => {
      const text = `${c.name} ${c.description || ""} ${c.contentMd || ""}`;
      const tokens = simpleTokenize(text);
      return { concept: c, score: cosineSimilarity(queryTokens, tokens) };
    })
    .filter((c) => c.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored;
}
