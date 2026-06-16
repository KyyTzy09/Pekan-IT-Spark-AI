"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logDocumentEvent } from "@/server/documents/audit";
import { validateEducationalContent } from "@/server/documents/content-check";
import { embedDocumentChunks } from "@/server/documents/embeddings";
import {
  DocumentExtractionError,
  extractFromDocx,
  extractFromPdf,
} from "@/server/documents/extract";
import {
  buildDocumentChatContext,
  type DocumentSummary as GeneratedDocSummary,
  type GeneratedQuiz,
  generateDocumentSummary,
  generateMaterialFromDocument,
  generateQuizFromDocument,
  generateMoreQuestionsForQuiz,
  generateEnhancedMaterialFromDocument,
} from "@/server/documents/features";
import { recordActivity, checkAndUnlockBadges } from "@/server/actions/gamification";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 50;

export type UploadDocumentInput = {
  file: File;
  chatSessionId?: string | null;
};

export type UploadDocumentResult =
  | {
      ok: true;
      document: {
        id: string;
        originalName: string;
        size: number;
        pageCount: number | null;
        createdAt: string;
      };
    }
  | { ok: false; error: string; code: string };

export type DocumentListItem = {
  id: string;
  originalName: string;
  mimeType: "PDF" | "DOCX";
  size: number;
  pageCount: number | null;
  createdAt: string;
  contentPreview: string;
  hasSummary: boolean;
  hasHomework: boolean | null;
  chunkCount: number;
};

export type ListDocumentsResult =
  | { ok: true; documents: DocumentListItem[] }
  | { ok: false; error: string };

async function requireStudent() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "STUDENT") throw new Error("FORBIDDEN");
  return session.user.id;
}

const uploadMetaSchema = z.object({
  chatSessionId: z.string().min(1).max(64).optional().nullable(),
});

export async function uploadDocument(
  input: UploadDocumentInput,
): Promise<UploadDocumentResult> {
  console.log("[uploadDocument] start", {
    hasFile: !!input.file,
    fileName: input.file?.name,
    fileSize: input.file?.size,
    fileType: input.file?.type,
    chatSessionId: input.chatSessionId,
  });

  let userId: string;
  try {
    userId = await requireStudent();
    console.log("[uploadDocument] auth OK", { userId });
  } catch (e) {
    console.error("[uploadDocument] auth FAILED", e);
    return { ok: false, error: "Login dulu ya", code: "AUTH" };
  }

  const file = input.file;
  if (!file || file.size === 0) {
    console.error("[uploadDocument] EMPTY", {
      hasFile: !!file,
      size: file?.size,
    });
    return {
      ok: false,
      error: "File kosong. Pilih file lain.",
      code: "EMPTY",
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    console.error("[uploadDocument] TOO_LARGE bytes", {
      size: file.size,
      max: MAX_FILE_BYTES,
      mb,
    });
    return {
      ok: false,
      error: `File ${mb} MB kebesaran. Maksimal ${MAX_FILE_BYTES / (1024 * 1024)} MB ya.`,
      code: "TOO_LARGE",
    };
  }

  const mime = file.type || "";
  const name = file.name.toLowerCase();
  const isPdf = mime === "application/pdf" || name.endsWith(".pdf");
  const isDocx =
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx");
  console.log("[uploadDocument] type detect", { mime, name, isPdf, isDocx });
  if (!isPdf && !isDocx) {
    console.error("[uploadDocument] UNSUPPORTED format", { mime, name });
    return {
      ok: false,
      error: "Format gak didukung. Upload PDF atau DOCX aja ya.",
      code: "UNSUPPORTED",
    };
  }

  const parsed = uploadMetaSchema.safeParse({
    chatSessionId: input.chatSessionId,
  });
  if (!parsed.success) {
    console.error("[uploadDocument] BAD_INPUT schema", parsed.error.issues);
    return {
      ok: false,
      error: "chatSessionId tidak valid.",
      code: "BAD_INPUT",
    };
  }

  if (parsed.data.chatSessionId) {
    const owns = await prisma.chatSession.findFirst({
      where: { id: parsed.data.chatSessionId, userId },
      select: { id: true },
    });
    if (!owns) {
      console.error("[uploadDocument] chat session not owned", {
        chatSessionId: parsed.data.chatSessionId,
        userId,
      });
      return {
        ok: false,
        error: "Chat session tidak ditemukan.",
        code: "BAD_INPUT",
      };
    }
  }

  console.log("[uploadDocument] reading buffer...");
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log("[uploadDocument] buffer ready", { bufferBytes: buffer.length });

  let extracted: Awaited<ReturnType<typeof extractFromPdf>>;
  console.log("[uploadDocument] extracting...", { isPdf });
  try {
    extracted = isPdf
      ? await extractFromPdf(buffer)
      : await extractFromDocx(buffer);
    console.log("[uploadDocument] extraction OK", {
      textLength: extracted.text.length,
      pageCount: extracted.pageCount,
      mathRegions: extracted.mathRegions.length,
      tables: extracted.tables.length,
      warnings: extracted.warnings,
    });
  } catch (e) {
    if (e instanceof DocumentExtractionError) {
      console.error("[uploadDocument] extraction DocumentExtractionError", {
        code: e.code,
        message: e.message,
      });
      return { ok: false, error: e.message, code: e.code };
    }
    console.error("[uploadDocument] extraction UNEXPECTED FAILED", e);
    return {
      ok: false,
      error: "Gagal proses file. Coba file lain ya.",
      code: "EXTRACT_FAILED",
    };
  }

  if (extracted.pageCount && extracted.pageCount > MAX_PAGES) {
    console.error("[uploadDocument] TOO_LARGE pages", {
      pageCount: extracted.pageCount,
      max: MAX_PAGES,
    });
    return {
      ok: false,
      error: `Doc punya ${extracted.pageCount} halaman. Maksimal ${MAX_PAGES} halaman.`,
      code: "TOO_LARGE",
    };
  }

  console.log("[uploadDocument] validating content...");
  const contentCheck = validateEducationalContent(extracted.text);
  if (!contentCheck.ok) {
    console.error("[uploadDocument] REJECTED content", {
      reason: contentCheck.reason,
      textLength: extracted.text.length,
      firstChars: extracted.text.slice(0, 200),
    });
    await prisma.documentAuditLog
      .create({
        data: {
          documentId: "PENDING",
          userId,
          action: "REJECTED",
          metadata: {
            reason: contentCheck.reason,
            originalName: file.name,
            size: file.size,
          },
        },
      })
      .catch((e) => console.error("[uploadDocument] audit log failed", e));
    return {
      ok: false,
      error: contentCheck.reason,
      code: "REJECTED",
    };
  }
  console.log("[uploadDocument] content validation OK", {
    warnings: contentCheck.warnings,
  });

  console.log("[uploadDocument] creating document record...");
  let summaryJson: string | null = null;
  try {
    const summaryData = await generateDocumentSummary(
      extracted.text,
      file.name,
    );
    summaryJson = JSON.stringify(summaryData);
    console.log("[uploadDocument] summary auto-generated successfully");
  } catch (e) {
    console.error("[uploadDocument] summary auto-generation failed:", e);
  }

  const document = await prisma.document.create({
    data: {
      userId,
      originalName: file.name,
      mimeType: isPdf ? "PDF" : "DOCX",
      size: file.size,
      pageCount: extracted.pageCount ?? null,
      content: extracted.text,
      summary: summaryJson,
      chatSessionId: parsed.data.chatSessionId ?? null,
    },
    select: {
      id: true,
      originalName: true,
      size: true,
      pageCount: true,
      createdAt: true,
    },
  });
  console.log("[uploadDocument] document created", { id: document.id });

  await logDocumentEvent({
    documentId: document.id,
    userId,
    action: "UPLOAD",
    metadata: {
      size: file.size,
      mimeType: isPdf ? "PDF" : "DOCX",
      pageCount: extracted.pageCount ?? null,
      charCount: extracted.text.length,
      mathRegions: extracted.mathRegions.length,
      tables: extracted.tables.length,
      chatSessionId: parsed.data.chatSessionId ?? null,
    },
  });
  await logDocumentEvent({
    documentId: document.id,
    userId,
    action: "PROCESS",
    metadata: {
      warnings: extracted.warnings,
    },
  });

  revalidatePath("/upload");
  revalidatePath("/chat");

  console.log("[uploadDocument] starting fire-and-forget embedding...");
  void embedDocumentChunks(document.id, extracted.text)
    .then((res) => {
      console.log("[uploadDocument] embedding done", {
        chunks: res.chunks,
        skipped: res.skipped,
      });
      void logDocumentEvent({
        documentId: document.id,
        userId,
        action: "PROCESS",
        metadata: { chunks: res.chunks, skipped: res.skipped, stage: "embed" },
      });
    })
    .catch((e) => {
      console.error("[uploadDocument] embedding FAILED", e);
    });

  console.log("[uploadDocument] SUCCESS", { id: document.id });
  return {
    ok: true,
    document: {
      id: document.id,
      originalName: document.originalName,
      size: document.size,
      pageCount: document.pageCount,
      createdAt: document.createdAt.toISOString(),
    },
  };
}

export async function listDocuments(): Promise<ListDocumentsResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const docs = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      size: true,
      pageCount: true,
      createdAt: true,
      content: true,
      summary: true,
      _count: { select: { embeddings: true } },
    },
  });
  return {
    ok: true,
    documents: docs.map((d) => {
      let hasHomework: boolean | null = null;
      if (d.summary) {
        try {
          const parsed = JSON.parse(d.summary);
          hasHomework =
            typeof parsed.hasHomework === "boolean"
              ? parsed.hasHomework
              : false;
        } catch {
          // ignore
        }
      }
      return {
        id: d.id,
        originalName: d.originalName,
        mimeType: d.mimeType,
        size: d.size,
        pageCount: d.pageCount,
        createdAt: d.createdAt.toISOString(),
        contentPreview: d.content.slice(0, 220),
        hasSummary: Boolean(d.summary && d.summary.length > 0),
        hasHomework,
        chunkCount: d._count.embeddings,
      };
    }),
  };
}

export type DeleteDocumentResult = { ok: true } | { ok: false; error: string };

export async function deleteDocument(
  documentId: string,
): Promise<DeleteDocumentResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const existing = await prisma.document.findFirst({
    where: { id: documentId, userId },
    select: { id: true, originalName: true },
  });
  if (!existing) {
    return { ok: false, error: "Dokumen tidak ditemukan." };
  }
  await logDocumentEvent({
    documentId: existing.id,
    userId,
    action: "DELETE",
    metadata: { originalName: existing.originalName },
  });
  await prisma.document.delete({ where: { id: documentId } });
  revalidatePath("/upload");
  return { ok: true };
}

async function loadOwnedDocument(userId: string, documentId: string) {
  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId },
    select: {
      id: true,
      originalName: true,
      content: true,
      summary: true,
    },
  });
  return doc;
}

export type GetDocumentSummaryResult =
  | {
      ok: true;
      documentId: string;
      originalName: string;
      summary: GeneratedDocSummary;
      cached: boolean;
    }
  | { ok: false; error: string };

export async function getDocumentSummary(
  documentId: string,
  options: { forceRegenerate?: boolean } = {},
): Promise<GetDocumentSummaryResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const doc = await loadOwnedDocument(userId, documentId);
  if (!doc) return { ok: false, error: "Dokumen tidak ditemukan." };

  if (doc.summary && !options.forceRegenerate) {
    try {
      const cached = JSON.parse(doc.summary) as GeneratedDocSummary;
      return {
        ok: true,
        documentId: doc.id,
        originalName: doc.originalName,
        summary: cached,
        cached: true,
      };
    } catch {
      // fall through to regenerate
    }
  }

  try {
    const summary = await generateDocumentSummary(
      doc.content,
      doc.originalName,
    );
    await prisma.document.update({
      where: { id: doc.id },
      data: { summary: JSON.stringify(summary) },
    });
    await logDocumentEvent({
      documentId: doc.id,
      userId,
      action: "SUMMARY_GENERATED",
      metadata: {
        cached: false,
        hasHomework: summary.hasHomework,
      },
    });
    return {
      ok: true,
      documentId: doc.id,
      originalName: doc.originalName,
      summary,
      cached: false,
    };
  } catch (e) {
    console.error("generateDocumentSummary failed:", e);
    return {
      ok: false,
      error: "Gagal bikin ringkasan. Coba lagi nanti ya.",
    };
  }
}
export type GenerateDocumentQuizResult =
  | {
      ok: true;
      documentId: string;
      originalName: string;
      quiz: {
        id: string;
        title: string;
        questions: any[];
        attempts: any[];
      };
    }
  | { ok: false; error: string };

export async function generateDocumentQuizAction(
  documentId: string,
  count: 3 | 5 | 8 = 5,
): Promise<GenerateDocumentQuizResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const doc = await loadOwnedDocument(userId, documentId);
  if (!doc) return { ok: false, error: "Dokumen tidak ditemukan." };
  try {
    const quiz = await generateQuizFromDocument(
      doc.content,
      doc.originalName,
      count,
    );

    // Save to DB
    const quizRecord = await prisma.documentQuiz.create({
      data: {
        documentId,
        title: `Latihan: ${doc.originalName} (${quiz.quiz.length} Soal)`,
        questions: quiz.quiz,
      },
    });

    await logDocumentEvent({
      documentId: doc.id,
      userId,
      action: "QUIZ_GENERATED",
      metadata: { count: quiz.quiz.length, quizId: quizRecord.id },
    });

    return {
      ok: true,
      documentId: doc.id,
      originalName: doc.originalName,
      quiz: {
        id: quizRecord.id,
        title: quizRecord.title,
        questions: quizRecord.questions as any[],
        attempts: quizRecord.attempts as any[],
      },
    };
  } catch (e) {
    console.error("generateDocumentQuiz failed:", e);
    return { ok: false, error: "Gagal bikin latihan. Coba lagi nanti ya." };
  }
}

export type AppendQuestionsToDocumentQuizResult =
  | {
      ok: true;
      quiz: {
        id: string;
        title: string;
        questions: any[];
        attempts: any[];
      };
    }
  | { ok: false; error: string };

export async function appendQuestionsToDocumentQuizAction(
  quizId: string,
  count: number,
): Promise<AppendQuestionsToDocumentQuizResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }

  const quizRecord = await prisma.documentQuiz.findUnique({
    where: { id: quizId },
    include: { document: true },
  });

  if (!quizRecord || quizRecord.document.userId !== userId) {
    return { ok: false, error: "Latihan tidak ditemukan." };
  }

  try {
    const existingQuestions = (quizRecord.questions as any[]) || [];
    const generated = await generateMoreQuestionsForQuiz(
      quizRecord.document.content,
      quizRecord.document.originalName,
      existingQuestions,
      count,
    );

    const updatedQuestions = [...existingQuestions, ...generated.quiz];
    const updated = await prisma.documentQuiz.update({
      where: { id: quizId },
      data: {
        questions: updatedQuestions,
        title: `Latihan: ${quizRecord.document.originalName} (${updatedQuestions.length} Soal)`,
      },
    });

    return {
      ok: true,
      quiz: {
        id: updated.id,
        title: updated.title,
        questions: updated.questions as any[],
        attempts: updated.attempts as any[],
      },
    };
  } catch (e) {
    console.error("appendQuestionsToDocumentQuiz failed:", e);
    return { ok: false, error: "Gagal menambahkan soal baru." };
  }
}

export type SubmitDocumentQuizAttemptResult =
  | {
      ok: true;
      attempts: any[];
      unlockedBadges?: any[];
    }
  | { ok: false; error: string };

export async function submitDocumentQuizAttemptAction(
  quizId: string,
  answers: number[],
  score: number,
): Promise<SubmitDocumentQuizAttemptResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }

  const quizRecord = await prisma.documentQuiz.findUnique({
    where: { id: quizId },
    include: { document: true },
  });

  if (!quizRecord || quizRecord.document.userId !== userId) {
    return { ok: false, error: "Latihan tidak ditemukan." };
  }

  try {
    const attempts = Array.isArray(quizRecord.attempts)
      ? quizRecord.attempts
      : [];
    const newAttempt = {
      answers,
      score,
      completedAt: new Date().toISOString(),
    };

    const updatedAttempts = [...attempts, newAttempt];
    const updated = await prisma.documentQuiz.update({
      where: { id: quizId },
      data: {
        attempts: updatedAttempts,
      },
    });

    await recordActivity(userId).catch(console.error);
    const unlockedBadges = await checkAndUnlockBadges(userId).catch(() => []);

    return {
      ok: true,
      attempts: updated.attempts as any[],
      unlockedBadges,
    };
  } catch (e) {
    console.error("submitDocumentQuizAttempt failed:", e);
    return { ok: false, error: "Gagal menyimpan jawaban." };
  }
}

export type GetDocumentQuizResult =
  | {
      ok: true;
      quiz: {
        id: string;
        title: string;
        questions: any[];
        attempts: any[];
      };
    }
  | { ok: false; error: string };

export async function getDocumentQuizAction(
  quizId: string,
): Promise<GetDocumentQuizResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }

  const quiz = await prisma.documentQuiz.findUnique({
    where: { id: quizId },
    include: { document: true },
  });

  if (!quiz || quiz.document.userId !== userId) {
    return { ok: false, error: "Latihan tidak ditemukan." };
  }

  return {
    ok: true,
    quiz: {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions as any[],
      attempts: quiz.attempts as any[],
    },
  };
}

export type DocumentHistoryResult =
  | {
      ok: true;
      quizzes: Array<{
        id: string;
        title: string;
        questionsCount: number;
        attemptsCount: number;
        lastScore: number | null;
        createdAt: string;
      }>;
      materials: Array<{
        id: string;
        title: string;
        difficulty: string;
        estimatedMinutes: number;
        createdAt: string;
      }>;
    }
  | { ok: false; error: string };

export async function getDocumentHistoryAction(
  documentId: string,
): Promise<DocumentHistoryResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!doc) {
    return { ok: false, error: "Dokumen tidak ditemukan." };
  }

  try {
    const quizzes = await prisma.documentQuiz.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });

    const materials = await prisma.material.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });

    return {
      ok: true,
      quizzes: quizzes.map((q) => {
        const questionsList = (q.questions as any[]) || [];
        const attemptsList = (q.attempts as any[]) || [];
        const lastAttempt = attemptsList[attemptsList.length - 1];
        return {
          id: q.id,
          title: q.title,
          questionsCount: questionsList.length,
          attemptsCount: attemptsList.length,
          lastScore: lastAttempt ? (lastAttempt.score as number) : null,
          createdAt: q.createdAt.toISOString(),
        };
      }),
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        difficulty: m.difficulty,
        estimatedMinutes: m.estimatedMinutes,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch (e) {
    console.error("getDocumentHistory failed:", e);
    return { ok: false, error: "Gagal mengambil riwayat dokumen." };
  }
}

export type GenerateDocumentMaterialResult =
  | {
      ok: true;
      documentId: string;
      originalName: string;
      material: {
        id: string;
        title: string;
        content: string;
        keyPoints: string[];
        difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
        estimatedMinutes: number;
      };
    }
  | { ok: false; error: string };

export async function generateDocumentMaterialAction(
  documentId: string,
  enhance: boolean = false,
): Promise<GenerateDocumentMaterialResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const doc = await loadOwnedDocument(userId, documentId);
  if (!doc) return { ok: false, error: "Dokumen tidak ditemukan." };
  try {
    let materialData;

    if (enhance) {
      // Find latest material for this document to enhance it
      const existing = await prisma.material.findFirst({
        where: { documentId, userId },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        materialData = await generateEnhancedMaterialFromDocument(
          doc.content,
          doc.originalName,
          existing.content,
        );
      } else {
        materialData = await generateMaterialFromDocument(
          doc.content,
          doc.originalName,
        );
      }
    } else {
      materialData = await generateMaterialFromDocument(
        doc.content,
        doc.originalName,
      );
    }

    // Save material to DB
    const m = await prisma.material.create({
      data: {
        userId,
        documentId,
        title: materialData.title,
        content: materialData.content,
        keyPoints: materialData.keyPoints,
        difficulty: materialData.difficulty,
        estimatedMinutes: materialData.estimatedMinutes,
        source: "ON_DEMAND",
      },
    });

    await logDocumentEvent({
      documentId: doc.id,
      userId,
      action: "PROCESS",
      metadata: {
        stage: "material_generated",
        materialId: m.id,
        title: m.title,
        enhanced: enhance,
      },
    });

    return {
      ok: true,
      documentId: doc.id,
      originalName: doc.originalName,
      material: {
        id: m.id,
        title: m.title,
        content: m.content,
        keyPoints: m.keyPoints as string[],
        difficulty: m.difficulty as "EASY" | "MEDIUM" | "HARD" | "ADVANCED",
        estimatedMinutes: m.estimatedMinutes,
      },
    };
  } catch (e) {
    console.error("generateDocumentMaterial failed:", e);
    return { ok: false, error: "Gagal bikin materi. Coba lagi nanti ya." };
  }
}

export type ReembedDocumentResult =
  | { ok: true; documentId: string; chunks: number; skipped: boolean }
  | { ok: false; error: string };

export async function reembedDocument(
  documentId: string,
): Promise<ReembedDocumentResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const doc = await loadOwnedDocument(userId, documentId);
  if (!doc) return { ok: false, error: "Dokumen tidak ditemukan." };
  try {
    const result = await embedDocumentChunks(doc.id, doc.content);
    revalidatePath("/upload");
    return {
      ok: true,
      documentId: doc.id,
      chunks: result.chunks,
      skipped: result.skipped,
    };
  } catch (e) {
    console.error("reembedDocument failed:", e);
    return { ok: false, error: "Gagal reindex dokumen." };
  }
}

export type DocumentRagContextResult =
  | {
      ok: true;
      documentId: string;
      query: string;
      context: string;
    }
  | { ok: false; error: string };

export async function getDocumentRagContext(
  documentId: string,
  query: string,
): Promise<DocumentRagContextResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const doc = await loadOwnedDocument(userId, documentId);
  if (!doc) return { ok: false, error: "Dokumen tidak ditemukan." };
  const { context, hasContext } = await buildDocumentChatContext(
    doc.id,
    query,
    4,
  );
  if (!hasContext) {
    return { ok: true, documentId: doc.id, query, context: "" };
  }
  return { ok: true, documentId: doc.id, query, context };
}

export type ShareDocumentResult =
  | { ok: true; documentId: string; chatSessionId: string }
  | { ok: false; error: string };

export async function shareDocumentToChatSession(
  documentId: string,
  chatSessionId: string,
): Promise<ShareDocumentResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const [doc, session] = await Promise.all([
    prisma.document.findFirst({
      where: { id: documentId, userId },
      select: { id: true, originalName: true },
    }),
    prisma.chatSession.findFirst({
      where: { id: chatSessionId, userId },
      select: { id: true },
    }),
  ]);
  if (!doc) return { ok: false, error: "Dokumen tidak ditemukan." };
  if (!session) return { ok: false, error: "Chat session tidak ditemukan." };
  await prisma.document.update({
    where: { id: doc.id },
    data: { chatSessionId: session.id },
  });
  await logDocumentEvent({
    documentId: doc.id,
    userId,
    action: "SHARE_TO_CHAT",
    metadata: { chatSessionId: session.id, originalName: doc.originalName },
  });
  revalidatePath("/upload");
  revalidatePath("/chat");
  revalidatePath(`/chat/${session.id}`);
  return { ok: true, documentId: doc.id, chatSessionId: session.id };
}

export type ListOwnedChatsResult =
  | {
      ok: true;
      sessions: Array<{
        id: string;
        title: string;
        subjectName: string | null;
      }>;
    }
  | { ok: false; error: string };

export async function listOwnedChats(
  limit = 20,
): Promise<ListOwnedChatsResult> {
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya" };
  }
  const sessions = await prisma.chatSession.findMany({
    where: { userId, isActive: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      subject: { select: { name: true } },
    },
  });
  return {
    ok: true,
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      subjectName: s.subject?.name ?? null,
    })),
  };
}
