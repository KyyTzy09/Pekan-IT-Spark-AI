"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DocumentExtractionError,
  extractFromDocx,
  extractFromPdf,
} from "@/server/documents/extract";
import { embedDocumentChunks } from "@/server/documents/embeddings";
import {
  type DocumentSummary as GeneratedDocSummary,
  type GeneratedQuiz,
  buildDocumentChatContext,
  generateDocumentSummary,
  generateQuizFromDocument,
} from "@/server/documents/features";

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
  let userId: string;
  try {
    userId = await requireStudent();
  } catch {
    return { ok: false, error: "Login dulu ya", code: "AUTH" };
  }

  const file = input.file;
  if (!file || file.size === 0) {
    return {
      ok: false,
      error: "File kosong. Pilih file lain.",
      code: "EMPTY",
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
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
  if (!isPdf && !isDocx) {
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
      return {
        ok: false,
        error: "Chat session tidak ditemukan.",
        code: "BAD_INPUT",
      };
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let extracted;
  try {
    extracted = isPdf
      ? await extractFromPdf(buffer)
      : await extractFromDocx(buffer);
  } catch (e) {
    if (e instanceof DocumentExtractionError) {
      return { ok: false, error: e.message, code: e.code };
    }
    console.error("Document extraction failed:", e);
    return {
      ok: false,
      error: "Gagal proses file. Coba file lain ya.",
      code: "EXTRACT_FAILED",
    };
  }

  if (extracted.pageCount && extracted.pageCount > MAX_PAGES) {
    return {
      ok: false,
      error: `Doc punya ${extracted.pageCount} halaman. Maksimal ${MAX_PAGES} halaman.`,
      code: "TOO_LARGE",
    };
  }

  const document = await prisma.document.create({
    data: {
      userId,
      originalName: file.name,
      mimeType: isPdf ? "PDF" : "DOCX",
      size: file.size,
      pageCount: extracted.pageCount ?? null,
      content: extracted.text,
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

  revalidatePath("/upload");
  revalidatePath("/chat");

  // Fire-and-forget chunked embeddings so RAG can be used immediately after
  // upload. Errors are logged but don't fail the upload.
  void embedDocumentChunks(document.id, extracted.text).catch((e) => {
    console.warn("embedDocumentChunks failed:", e);
  });

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
    documents: docs.map((d) => ({
      id: d.id,
      originalName: d.originalName,
      mimeType: d.mimeType,
      size: d.size,
      pageCount: d.pageCount,
      createdAt: d.createdAt.toISOString(),
      contentPreview: d.content.slice(0, 220),
      hasSummary: Boolean(d.summary && d.summary.length > 0),
      chunkCount: d._count.embeddings,
    })),
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
    select: { id: true },
  });
  if (!existing) {
    return { ok: false, error: "Dokumen tidak ditemukan." };
  }
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
    const summary = await generateDocumentSummary(doc.content, doc.originalName);
    await prisma.document.update({
      where: { id: doc.id },
      data: { summary: JSON.stringify(summary) },
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
// GeneratedQuiz is imported above; UI can import it from either path.
export type { GeneratedQuiz };

export type GenerateDocumentQuizResult =
  | {
      ok: true;
      documentId: string;
      originalName: string;
      quiz: GeneratedQuiz;
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
    return {
      ok: true,
      documentId: doc.id,
      originalName: doc.originalName,
      quiz,
    };
  } catch (e) {
    console.error("generateDocumentQuiz failed:", e);
    return { ok: false, error: "Gagal bikin latihan. Coba lagi nanti ya." };
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
