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

export type DocumentSummary = {
  id: string;
  originalName: string;
  mimeType: "PDF" | "DOCX";
  size: number;
  pageCount: number | null;
  createdAt: string;
  contentPreview: string;
};

export type ListDocumentsResult =
  | { ok: true; documents: DocumentSummary[] }
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
