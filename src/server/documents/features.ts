import "server-only";

import { generateObject } from "ai";
import { z } from "zod";
import { fastModel } from "@/lib/ai";
import { retrieveDocumentChunks } from "./embeddings";

const MAX_SUMMARY_INPUT = 12_000;
const MAX_QUIZ_INPUT = 18_000;

const summarySchema = z.object({
  title: z.string().max(120).describe("Judul singkat materi"),
  summary: z
    .string()
    .min(80)
    .max(1400)
    .describe("Ringkasan padat (3-5 paragraf) untuk siswa SMA/SMK"),
  keyPoints: z
    .array(z.string().min(8).max(140))
    .min(3)
    .max(7)
    .describe("Poin-poin kunci yang harus diingat"),
  hasHomework: z
    .boolean()
    .describe("True kalau dokumen berisi soal/tugas/PR/latihan"),
  homeworkTopic: z
    .string()
    .max(140)
    .optional()
    .describe("Topik PR kalau ada (kalau ga ada, kosong)"),
});

export type DocumentSummary = z.infer<typeof summarySchema>;

const quizQuestionSchema = z.object({
  question: z.string().min(10).max(280),
  options: z.array(z.string().min(2).max(140)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  explanation: z.string().min(10).max(400),
});

const quizSchema = z.object({
  quiz: z
    .array(quizQuestionSchema)
    .min(3)
    .max(8)
    .describe("3-8 soal pilihan ganda berdasarkan dokumen"),
});

export type GeneratedQuiz = z.infer<typeof quizSchema>;

const SYSTEM_SUMMARY = `Kamu adalah Spark, asisten belajar untuk siswa SMA/SMK Indonesia.
Tugas kamu: baca materi yang diberikan, lalu hasilkan ringkasan padat + poin kunci yang gampang diingat.
- Pakai bahasa Indonesia kasual tapi rapi (boleh emoji secukupnya).
- Jangan tambahin info yang ga ada di dokumen.
- Kalau dokumen terlihat seperti PR/soal/tugas, set hasHomework=true.`;

const SYSTEM_QUIZ = `Kamu adalah Spark, asisten belajar.
Dari materi yang diberikan, BUAT soal pilihan ganda (3-8 soal) untuk latihan siswa SMA/SMK.
- Setiap soal harus punya tepat 4 opsi.
- correctIndex harus 0..3.
- explanation harus jelas kenapa jawaban itu benar.
- Jangan keluar dari isi dokumen.`;

export async function generateDocumentSummary(
  content: string,
  originalName: string,
): Promise<DocumentSummary> {
  const truncated = content.slice(0, MAX_SUMMARY_INPUT);
  const { object } = await generateObject({
    model: fastModel,
    schema: summarySchema,
    system: SYSTEM_SUMMARY,
    prompt: `Judul file: "${originalName}"\n\nMateri:\n\n${truncated}\n\nBuat ringkasan padat untuk siswa SMA/SMK. Kalau ga ada poin penting minimal, isi dengan 3 poin terbaik yang bisa kamu ekstrak.`,
  });
  return object;
}

export async function generateQuizFromDocument(
  content: string,
  originalName: string,
  count: 3 | 5 | 8 = 5,
): Promise<GeneratedQuiz> {
  const truncated = content.slice(0, MAX_QUIZ_INPUT);
  const { object } = await generateObject({
    model: fastModel,
    schema: quizSchema,
    system: SYSTEM_QUIZ,
    prompt: `Judul file: "${originalName}". Buat tepat ${count} soal pilihan ganda berdasarkan materi ini. Pastikan ada variasi difficulty (EASY/MEDIUM/HARD) dan explanation yang jelas.\n\nMateri:\n\n${truncated}`,
  });
  return object;
}

export async function detectHomeworkAndSuggest(
  content: string,
): Promise<{ isHomework: boolean; topic: string | null }> {
  const truncated = content.slice(0, 6_000);
  const { object } = await generateObject({
    model: fastModel,
    schema: z.object({
      isHomework: z
        .boolean()
        .describe("True kalau dokumen berisi soal/tugas/PR yang harus dijawab"),
      topic: z
        .string()
        .max(120)
        .nullable()
        .describe("Topik utama PR (null kalau bukan PR)"),
    }),
    system: "Deteksi apakah dokumen adalah PR/tugas/latihan. Jawab ringkas.",
    prompt: truncated,
  });
  return { isHomework: object.isHomework, topic: object.topic };
}

export async function buildDocumentChatContext(
  documentId: string,
  query: string,
  topK: number = 4,
): Promise<{ context: string; hasContext: boolean }> {
  const chunks = await retrieveDocumentChunks(documentId, query, topK);
  if (chunks.length === 0) {
    return { context: "", hasContext: false };
  }
  const trimmed = chunks
    .filter((c) => c.score > 0.18)
    .map((c, i) => `[Cuplikan ${i + 1}]\n${c.content}`)
    .join("\n\n---\n\n");
  if (trimmed.length === 0) {
    return { context: "", hasContext: false };
  }
  return { context: trimmed, hasContext: true };
}

export const _internal = { SYSTEM_SUMMARY, SYSTEM_QUIZ };
