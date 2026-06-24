import "server-only";

import { z } from "zod";
import { fastModel, generateText, safeParseJson } from "@/lib/ai";
import { sanitizeForPrompt, sanitizeAiMarkdown } from "@/lib/prompt-sanitize";
import { retryOnZodError } from "@/server/utils/ai-retry";
import { countWords } from "@/server/utils/word-count";
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

export async function generateDocumentSummary(
  content: string,
  originalName: string,
): Promise<DocumentSummary> {
  const truncated = content.slice(0, MAX_SUMMARY_INPUT);
  const { text } = await generateText({
    model: fastModel,
    system: SYSTEM_SUMMARY,
    prompt: `Judul file: "${sanitizeForPrompt(originalName)}"\n\nMateri:\n\n${truncated}\n\nBuat ringkasan yang sangat detail, mendalam, dan komprehensif untuk siswa SMA/SMK. Jelaskan teori dan konsep-konsep di dalamnya secara lengkap agar ringkasan ini bisa dipakai sebagai bahan belajar yang utuh.`,
  });

  const parsedJson = safeParseJson(text);
  const result = summarySchema.parse(parsedJson);
  // BUG-8 FIX: Sanitize AI-generated summary content before storage
  return {
    ...result,
    summary: sanitizeAiMarkdown(result.summary),
  };
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
    prompt: `Judul file: "${sanitizeForPrompt(originalName)}". Buat tepat ${count} soal pilihan ganda berdasarkan materi ini. Pastikan ada variasi difficulty (EASY/MEDIUM/HARD) dan explanation yang jelas.\n\nMateri:\n\n${truncated}`,
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
    .min(7500)
    .refine((text) => countWords(text) >= 1500, {
      message: "Materi terlalu pendek, minimal 1500 kata",
    })
    .describe(
      "Materi belajar lengkap yang mendalam, terstruktur, dan mudah dipahami, ditulis dalam format Markdown. Berisi penjelasan konsep, contoh soal, dan pembahasan.",
    ),
  keyPoints: z
    .array(z.string().min(8).max(200))
    .min(5)
    .max(20)
    .describe("Poin-poin penting dari materi ini"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  estimatedMinutes: z
    .number()
    .int()
    .min(15)
    .max(90)
    .describe("Estimasi waktu membaca materi dalam menit"),
});

export type GeneratedMaterial = z.infer<typeof materialSchema>;

function buildLearningStylePrompt(learningStyle?: string): string {
  switch (learningStyle) {
    case "VISUAL":
      return `
GAYA BELAJAR SISWA: VISUAL. WAJIB terapkan:
- Sertakan minimal 2 diagram Mermaid.js (graph TD/LR) untuk memetakan hubungan konsep
- PENTING: Saat membuat diagram Mermaid.js, pastikan semua label teks di dalam node yang memiliki karakter khusus (seperti tanda kurung (), garis miring /, koma, tanda petik, tanda tanya, atau spasi) WAJIB dibungkus dengan tanda kutip ganda (contoh: A["Verb 1 (Base Form)"], bukan A[Verb 1 (Base Form)]). Jangan gunakan tag HTML di dalam label diagram.
- Gunakan analogi visual imajinatif (contoh: "Bayangkan konsep ini seperti...")
- Format data numerik atau perbandingan dalam tabel Markdown
- Gunakan emoji visual (🎯 📊 🔄 💡) sebagai penanda section penting`;
    case "TEXTUAL":
      return `
GAYA BELAJAR SISWA: TEXTUAL. WAJIB terapkan:
- Format akademis terstruktur: heading bertingkat, glosarium istilah
- Penjelasan runtut: Definisi → Teori → Contoh → Kesimpulan
- Bullet points dan numbered lists untuk langkah-langkah
- Bahasa formal tapi mudah dipahami`;
    case "EXAMPLE_HEAVY":
      return `
GAYA BELAJAR SISWA: EXAMPLE_HEAVY. WAJIB terapkan:
- Setiap konsep utama WAJIB diikuti minimal 2 contoh konkret dengan pembahasan lengkap
- Struktur: Teori singkat → Contoh + pembahasan step-by-step → Ringkasan
- Prioritaskan "cara mengerjakan" daripada teori murni
- Studi kasus nyata dari kehidupan sehari-hari`;
    case "SOCRATIC":
      return `
GAYA BELAJAR SISWA: SOCRATIC. WAJIB terapkan:
- Format dialog tanya-jawab antara 'Siswa' dan 'Spark'
- Jangan langsung kasih jawaban, gunakan pertanyaan retoris untuk menuntun
- Pertanyaan bertingkat dari mudah ke sulit
- Akhiri dengan refleksi: "💭 Sekarang coba jelaskan dengan kata-katamu sendiri..."`;
    default:
      return "";
  }
}

const SYSTEM_MATERIAL = `Kamu adalah Spark, asisten belajar tingkat lanjut untuk siswa SMA/SMK Indonesia.
Tugas kamu adalah membuat materi pembelajaran (materi edukasi) yang mendalam, komprehensif, dan relevan berdasarkan dokumen soal/latihan/tugas yang diberikan.
- Karena dokumen aslinya berupa kumpulan soal/tugas, buatlah penjelasan materi teori yang mendasari soal-soal tersebut secara lengkap agar siswa paham cara menyelesaikannya.
- Tulis isi materi belajar (content) dalam format Markdown yang rapi, terstruktur (gunakan heading, list, bold, dll).
- Sertakan contoh pembahasan/cara menyelesaikan tipe soal seperti yang ada di dokumen.
- Gunakan bahasa Indonesia yang bersahabat, jelas, dan mudah dipahami anak SMA/SMK (boleh pakai emoji secukupnya).
- Gunakan KaTeX ($...$ atau $$...$$) untuk rumus matematika atau fisika/kimia jika ada.
- PENTING: Panjang materi WAJIB 1500-3000 kata (minimal 1500 kata). Materi harus BERBOBOT dan MENDALAM, bukan ringkasan singkat.
- PENTING: Batasi jumlah poin penting (keyPoints) antara 5 sampai 20 poin saja.
- PENTING: Estimasi waktu membaca (estimatedMinutes) harus berkisar antara 15 sampai 90 menit saja.

STRUKTUR WAJIB:
- Judul dan pengantar (kaitkan dengan kehidupan siswa)
- Penjelasan konsep utama secara mendalam dan komprehensif
- Contoh soal beserta pembahasan langkah demi langkah
- Studi kasus atau aplikasi dunia nyata
- Ringkasan poin-poin penting
- Callout refleksi: "💭 Coba pikirkan: <pertanyaan>"

Format output harus JSON valid dengan struktur:
{
  "title": "Judul materi pembelajaran",
  "content": "Materi pembelajaran lengkap dalam format Markdown...",
  "keyPoints": ["Poin penting 1", "Poin penting 2", "Poin penting 3"],
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "estimatedMinutes": 30
}`;

export async function generateMaterialFromDocument(
  content: string,
  originalName: string,
  learningStyle?: string,
): Promise<GeneratedMaterial> {
  return retryOnZodError(() =>
    _generateMaterialFromDocumentInner(content, originalName, learningStyle),
  );
}

async function _generateMaterialFromDocumentInner(
  content: string,
  originalName: string,
  learningStyle?: string,
): Promise<GeneratedMaterial> {
  const truncated = content.slice(0, MAX_QUIZ_INPUT);
  const stylePrompt = buildLearningStylePrompt(learningStyle);
  const { text } = await generateText({
    model: fastModel,
    system: SYSTEM_MATERIAL + stylePrompt,
    prompt: `Judul file: "${sanitizeForPrompt(originalName)}". Buat penjelasan materi teori belajar yang lengkap, mendalam, dan relevan berdasarkan soal-soal/tugas yang ada di dokumen ini.\n\nDokumen Soal/Tugas:\n\n${truncated}`,
  });

  const parsedJson = safeParseJson(text);
  const result = materialSchema.parse(parsedJson);
  // BUG-8 FIX: Sanitize AI-generated material content before storage
  return {
    ...result,
    content: sanitizeAiMarkdown(result.content),
  };
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
    prompt: `Judul file: "${sanitizeForPrompt(originalName)}". Buat TEPAT ${count} soal baru pilihan ganda berdasarkan materi ini.
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
  learningStyle?: string,
): Promise<GeneratedMaterial> {
  return retryOnZodError(() =>
    _generateEnhancedMaterialFromDocumentInner(
      content,
      originalName,
      existingContent,
      learningStyle,
    ),
  );
}

async function _generateEnhancedMaterialFromDocumentInner(
  content: string,
  originalName: string,
  existingContent: string,
  learningStyle?: string,
): Promise<GeneratedMaterial> {
  const truncated = content.slice(0, MAX_QUIZ_INPUT);
  const stylePrompt = buildLearningStylePrompt(learningStyle);
  const { text } = await generateText({
    model: fastModel,
    system: SYSTEM_MATERIAL + stylePrompt,
    prompt: `Judul file: "${sanitizeForPrompt(originalName)}".
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
  const result = materialSchema.parse(parsedJson);
  // BUG-8 FIX: Sanitize AI-generated enhanced material content before storage
  return {
    ...result,
    content: sanitizeAiMarkdown(result.content),
  };
}

export const _internal = { SYSTEM_SUMMARY, SYSTEM_QUIZ, SYSTEM_MATERIAL };
