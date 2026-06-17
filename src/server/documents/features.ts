import "server-only";

import { z } from "zod";
import { fastModel, generateText } from "@/lib/ai";
import { retrieveDocumentChunks } from "./embeddings";

const MAX_SUMMARY_INPUT = 12_000;
const MAX_QUIZ_INPUT = 18_000;

const summarySchema = z.object({
  title: z.string().max(120).describe("Judul singkat materi"),
  summary: z
    .string()
    .min(150)
    .max(12000)
    .describe(
      "Ringkasan lengkap, mendalam, dan komprehensif untuk siswa SMA/SMK",
    ),
  keyPoints: z
    .array(z.string().min(8).max(280))
    .min(3)
    .max(15)
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
  options: z.array(z.string().min(2).max(280)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  explanation: z.string().min(10).max(400),
});

const quizSchema = z.object({
  quiz: z
    .array(quizQuestionSchema)
    .min(1)
    .max(15)
    .describe("Soal pilihan ganda berdasarkan dokumen"),
});

export type GeneratedQuiz = z.infer<typeof quizSchema>;

const SYSTEM_SUMMARY = `Kamu adalah Spark, asisten belajar untuk siswa SMA/SMK Indonesia.
Tugas kamu: baca materi yang diberikan, lalu hasilkan ringkasan yang SANGAT DETAIL, LENGKAP, MENDALAM, DAN KOMPREHENSIF (berupa rangkuman belajar menyeluruh, bukan ringkasan pendek).
- Jelaskan konsep-konsep penting, definisi, langkah-langkah, atau teori yang ada di dokumen secara gamblang agar siswa benar-benar paham.
- Pakai bahasa Indonesia kasual tapi rapi (boleh emoji secukupnya).
- Jangan tambahin info yang ga ada di dokumen.
- Kalau dokumen terlihat seperti PR/soal/tugas, set hasHomework=true.

Format output harus JSON valid dengan struktur:
{
  "title": "Judul singkat materi (maksimal 120 karakter)",
  "summary": "Ringkasan lengkap dan detail (antara 150 sampai 12000 karakter)",
  "keyPoints": ["Poin 1", "Poin 2", "Poin 3"], // Hasilkan antara 3 sampai 15 poin penting (maksimal 15)
  "hasHomework": true | false,
  "homeworkTopic": "Topik PR jika hasHomework=true, kosongkan jika false (maksimal 140 karakter)"
}`;

const SYSTEM_QUIZ = `Kamu adalah Spark, asisten belajar.
Dari materi yang diberikan, BUAT soal pilihan ganda (1-15 soal) untuk latihan siswa SMA/SMK.
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
    prompt: `Judul file: "${originalName}"\n\nMateri:\n\n${truncated}\n\nBuat ringkasan yang sangat detail, mendalam, dan komprehensif untuk siswa SMA/SMK. Jelaskan teori dan konsep-konsep di dalamnya secara lengkap agar ringkasan ini bisa dipakai sebagai bahan belajar yang utuh.`,
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

const materialSchema = z.object({
  title: z.string().max(120).describe("Judul materi belajar"),
  content: z
    .string()
    .min(300)
    .describe(
      "Materi belajar lengkap yang mendalam, terstruktur, dan mudah dipahami, ditulis dalam format Markdown. Berisi penjelasan konsep, contoh soal, dan pembahasan.",
    ),
  keyPoints: z
    .array(z.string().min(8).max(200))
    .min(3)
    .max(20)
    .describe("Poin-poin penting dari materi ini"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  estimatedMinutes: z
    .number()
    .int()
    .min(2)
    .max(60)
    .describe("Estimasi waktu membaca materi dalam menit"),
});

export type GeneratedMaterial = z.infer<typeof materialSchema>;

const SYSTEM_MATERIAL = `Kamu adalah Spark, asisten belajar tingkat lanjut untuk siswa SMA/SMK Indonesia.
Tugas kamu adalah membuat materi pembelajaran (materi edukasi) yang mendalam, komprehensif, dan relevan berdasarkan dokumen soal/latihan/tugas yang diberikan.
- Karena dokumen aslinya berupa kumpulan soal/tugas, buatlah penjelasan materi teori yang mendasari soal-soal tersebut secara lengkap agar siswa paham cara menyelesaikannya.
- Tulis isi materi belajar (content) dalam format Markdown yang rapi, terstruktur (gunakan heading, list, bold, dll).
- Sertakan contoh pembahasan/cara menyelesaikan tipe soal seperti yang ada di dokumen.
- Gunakan bahasa Indonesia yang bersahabat, jelas, dan mudah dipahami anak SMA/SMK (boleh pakai emoji secukupnya).
- Gunakan KaTeX ($...$ atau $$...$$) untuk rumus matematika atau fisika/kimia jika ada.
- PENTING: Batasi jumlah poin penting (keyPoints) antara 3 sampai 15 poin saja.
- PENTING: Estimasi waktu membaca (estimatedMinutes) harus berkisar antara 5 sampai 45 menit saja.

Format output harus JSON valid dengan struktur:
{
  "title": "Judul materi pembelajaran",
  "content": "Materi pembelajaran lengkap dalam format Markdown...",
  "keyPoints": ["Poin penting 1", "Poin penting 2", "Poin penting 3"],
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "estimatedMinutes": 10
}`;

export async function generateMaterialFromDocument(
  content: string,
  originalName: string,
): Promise<GeneratedMaterial> {
  const truncated = content.slice(0, MAX_QUIZ_INPUT);
  const { text } = await generateText({
    model: fastModel,
    system: SYSTEM_MATERIAL,
    prompt: `Judul file: "${originalName}". Buat penjelasan materi teori belajar yang lengkap, mendalam, dan relevan berdasarkan soal-soal/tugas yang ada di dokumen ini.\n\nDokumen Soal/Tugas:\n\n${truncated}`,
  });

  const parsedJson = safeParseJson(text);
  return materialSchema.parse(parsedJson);
}

export async function generateMoreQuestionsForQuiz(
  content: string,
  originalName: string,
  existingQuestions: Array<{ question: string }>,
  count: number,
): Promise<GeneratedQuiz> {
  const truncated = content.slice(0, MAX_QUIZ_INPUT);
  const formattedExisting = existingQuestions
    .map((q, idx) => `[Soal ${idx + 1}]: ${q.question}`)
    .join("\n");

  const { text } = await generateText({
    model: fastModel,
    system: SYSTEM_QUIZ,
    prompt: `Judul file: "${originalName}". Buat TEPAT ${count} soal baru pilihan ganda berdasarkan materi ini.
PENTING: Jangan buat soal yang sama atau mirip dengan soal-soal yang sudah ada di bawah ini. Soal-soal baru harus menguji topik yang berbeda atau tingkat pemahaman yang berbeda dari dokumen.

Soal-soal yang sudah ada:
${formattedExisting}

Materi dokumen:
${truncated}`,
  });

  const parsedJson = safeParseJson(text);
  return quizSchema.parse(parsedJson);
}

export async function generateEnhancedMaterialFromDocument(
  content: string,
  originalName: string,
  existingContent: string,
): Promise<GeneratedMaterial> {
  const truncated = content.slice(0, MAX_QUIZ_INPUT);
  const { text } = await generateText({
    model: fastModel,
    system: SYSTEM_MATERIAL,
    prompt: `Judul file: "${originalName}".
Tugas kamu adalah menulis ulang dan meningkatkan materi belajar teori yang sudah ada di bawah ini agar menjadi JAUH LEBIH BERBOBOT, LEBIH MENDALAM, DAN KOMPREHENSIF.
- Tambahkan penjelasan konsep-konsep teoritis yang lebih detail dan terperinci.
- Tambahkan lebih banyak contoh soal beserta pembahasan langkah demi langkah (step-by-step).
- Perbaiki struktur penjelasan menggunakan heading, tabel, list, dan visualisasi teks agar lebih menarik dan mudah diingat.
- Gunakan KaTeX untuk semua notasi rumus.

Materi belajar saat ini:
${existingContent}

Dokumen asli/soal:
${truncated}`,
  });

  const parsedJson = safeParseJson(text);
  return materialSchema.parse(parsedJson);
}

export const _internal = { SYSTEM_SUMMARY, SYSTEM_QUIZ, SYSTEM_MATERIAL };
