import "server-only";

import { generateText } from "ai";
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
- Kalau dokumen terlihat seperti PR/soal/tugas, set hasHomework=true.

Format output harus JSON valid dengan struktur:
{
  "title": "Judul singkat materi",
  "summary": "Ringkasan padat 3-5 paragraf",
  "keyPoints": ["Poin 1", "Poin 2", "Poin 3"],
  "hasHomework": true | false,
  "homeworkTopic": "Topik PR jika hasHomework=true, kosongkan jika false"
}`;

const SYSTEM_QUIZ = `Kamu adalah Spark, asisten belajar.
Dari materi yang diberikan, BUAT soal pilihan ganda (3-8 soal) untuk latihan siswa SMA/SMK.
- Setiap soal harus punya tepat 4 opsi.
- correctIndex harus 0..3.
- explanation harus jelas kenapa jawaban itu benar.
- Jangan keluar dari isi dokumen.

Format output harus JSON valid dengan struktur:
{
  "quiz": [
    {
      "question": "Soal latihan",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctIndex": 0,
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "explanation": "Penjelasan"
    }
  ]
}`;

function safeParseJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch (_e) {}
    }
    throw err;
  }
}

export async function generateDocumentSummary(
  content: string,
  originalName: string,
): Promise<DocumentSummary> {
  const truncated = content.slice(0, MAX_SUMMARY_INPUT);
  const { text } = await generateText({
    model: fastModel,
    system: SYSTEM_SUMMARY,
    prompt: `Judul file: "${originalName}"\n\nMateri:\n\n${truncated}\n\nBuat ringkasan padat untuk siswa SMA/SMK. Kalau ga ada poin penting minimal, isi dengan 3 poin terbaik yang bisa kamu ekstrak.`,
  });

  const parsedJson = safeParseJson(text);
  return summarySchema.parse(parsedJson);
}

export async function generateQuizFromDocument(
  content: string,
  originalName: string,
  count: 3 | 5 | 8 = 5,
): Promise<GeneratedQuiz> {
  const truncated = content.slice(0, MAX_QUIZ_INPUT);
  const { text } = await generateText({
    model: fastModel,
    system: SYSTEM_QUIZ,
    prompt: `Judul file: "${originalName}". Buat tepat ${count} soal pilihan ganda berdasarkan materi ini. Pastikan ada variasi difficulty (EASY/MEDIUM/HARD) dan explanation yang jelas.\n\nMateri:\n\n${truncated}`,
  });

  const parsedJson = safeParseJson(text);
  return quizSchema.parse(parsedJson);
}

export async function detectHomeworkAndSuggest(
  content: string,
): Promise<{ isHomework: boolean; topic: string | null }> {
  const truncated = content.slice(0, 6_000);
  const { text } = await generateText({
    model: fastModel,
    system:
      'Deteksi apakah dokumen adalah PR/tugas/latihan. Jawab ringkas dalam format JSON:\n{\n  "isHomework": true | false,\n  "topic": "Nama topik atau null"\n}',
    prompt: truncated,
  });

  const parsedJson = safeParseJson(text) as Record<string, unknown>;
  const isHomework =
    typeof parsedJson.isHomework === "boolean" ? parsedJson.isHomework : false;
  const topic = typeof parsedJson.topic === "string" ? parsedJson.topic : null;

  return { isHomework, topic };
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
