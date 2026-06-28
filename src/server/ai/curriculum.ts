import "server-only";

import { z } from "zod";
import { chatModel, generateText, safeParseJson } from "@/lib/ai";

const outlineSchema = z.object({
  description: z
    .string()
    .describe("Deskripsi singkat mapel 1-2 kalimat untuk siswa"),
  icon: z
    .string()
    .describe("Satu emoji yang merepresentasikan mapel (contoh: 🎨, ⚽)"),
  color: z
    .string()
    .describe("Warna hex (contoh: #FF6B6B) yang cocok dengan tema mapel"),
  topics: z
    .array(
      z.object({
        name: z.string().describe("Nama topik, max 60 karakter"),
        description: z
          .string()
          .describe("Deskripsi topik 1 kalimat untuk siswa"),
        concepts: z
          .array(
            z.object({
              name: z
                .string()
                .describe("Nama konsep spesifik, max 80 karakter"),
              description: z.string().describe("Penjelasan konsep 1 kalimat"),
            }),
          )
          .min(3)
          .max(6)
          .describe("3-6 konsep inti dalam topik ini"),
      }),
    )
    .min(3)
    .max(6)
    .describe("3-6 topik utama mapel"),
  pretestQuestions: z
    .array(
      z.object({
        topicIndex: z
          .number()
          .int()
          .min(0)
          .describe("Index topik (0-based) yang dirujuk"),
        questionText: z
          .string()
          .describe("Soal pretest lengkap, jelas dan tidak ambigu"),
        options: z
          .array(z.string())
          .length(4)
          .describe("4 pilihan jawaban untuk multiple choice"),
        correctAnswer: z
          .string()
          .describe(
            "Jawaban benar (harus persis sama dengan salah satu options)",
          ),
        explanation: z
          .string()
          .describe("Penjelasan singkat kenapa jawaban itu benar"),
        difficulty: z
          .enum(["EASY", "MEDIUM", "HARD"])
          .describe("Tingkat kesulitan soal"),
      }),
    )
    .min(5)
    .max(8)
    .describe("5-8 soal pretest untuk ukur kemampuan awal siswa"),
});

export type CurriculumOutline = z.infer<typeof outlineSchema>;

export interface CurriculumInput {
  subjectName: string;
  context?: string;
  gradeLevel?: number;
  educationLevel?: "SMA" | "SMK";
}

const SYSTEM_PROMPT = `Kamu adalah perancang kurikulum untuk platform tutor AI Spark Ai (SMA/SMK Indonesia).

Tugasmu: saat siswa menambahkan mata pelajaran CUSTOM (di luar kurikulum nasional resmi), kamu harus:
1. Membuat OUTLINE mapel (3-6 topik, masing-masing 3-6 konsep).
2. Membuat PRETEST 5-8 soal pilihan ganda untuk mengukur kemampuan awal siswa.

ATURAN WAJIB:
- Semua output dalam Bahasa Indonesia.
- Konten edukasi yang aman untuk siswa SMA/SMK.
- Soal pretest harus JELAS, tidak ambigu, dan punya 1 jawaban benar yang pasti.
- correctAnswer HARUS PERSIS sama dengan salah satu string di options (case-sensitive).
- difficulty realistis untuk siswa SMA/SMK yang baru mulai belajar mapel ini.
- Jangan buat soal yang butuh gambar/diagram.
- Topik & konsep harus RELEVAN dengan nama mapel.

PENTING: Outline ini akan dipakai untuk generate soal pretest dan materi belajar personal. Kualitas tinggi = pengalaman belajar yang baik.

═══════════════════════════════════════════════════
⛔ RULES KETAT UNTUK OUTPUT FORMAT — WAJIB DIIKUTI:
═══════════════════════════════════════════════════
1. Output WAJIB berupa JSON mentah SAJA. TIDAK BOLEH ADA TEKS LAIN.
2. JANGAN tulis kalimat pembuka seperti "Berikut adalah", "Ini adalah", atau apapun sebelum JSON.
3. JANGAN tulis kalimat penutup atau kesimpulan setelah JSON.
4. JANGAN pakai markdown code block. Langsung mulai dengan karakter { di baris pertama.
5. Karakter PERTAMA output harus { dan karakter TERAKHIR harus }.
6. Pastikan semua string di-escape dengan benar.
7. Pastikan JSON valid dan bisa di-parse oleh JSON.parse().
═══════════════════════════════════════════════════

Struktur JSON yang HARUS kamu ikuti (mulai dari { sampai }):
{
  "description": "Deskripsi singkat mapel",
  "icon": "🎨",
  "color": "#HEXWarna",
  "topics": [
    {
      "name": "Nama Topik",
      "description": "Deskripsi singkat topik",
      "concepts": [
        {
          "name": "Nama Konsep",
          "description": "Penjelasan singkat konsep"
        }
      ]
    }
  ],
  "pretestQuestions": [
    {
      "topicIndex": 0,
      "questionText": "Soal lengkap",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctAnswer": "Opsi yang benar",
      "explanation": "Penjelasan jawaban benar",
      "difficulty": "EASY"
    }
  ]
}`;

export function computeDifficultyDistribution(
  masteryScore: number,
  totalCount: number,
): { easy: number; medium: number; hard: number } {
  if (totalCount <= 0) return { easy: 0, medium: 0, hard: 0 };

  let easyRatio: number;
  let mediumRatio: number;
  let hardRatio: number;

  if (masteryScore < 0.4) {
    easyRatio = 0.6;
    mediumRatio = 0.3;
    hardRatio = 0.1;
  } else if (masteryScore < 0.7) {
    easyRatio = 0.2;
    mediumRatio = 0.5;
    hardRatio = 0.3;
  } else {
    easyRatio = 0.1;
    mediumRatio = 0.3;
    hardRatio = 0.6;
  }

  // Guarantee at least 1 per tier, distribute remainder proportionally
  if (totalCount <= 3) {
    const arr = [0, 0, 0];
    for (let i = 0; i < totalCount; i++) arr[i] = 1;
    return { easy: arr[0], medium: arr[1], hard: arr[2] };
  }

  const remaining = totalCount - 3; // 1 each already accounted for
  let easy = 1 + Math.round(remaining * easyRatio);
  let medium = 1 + Math.round(remaining * mediumRatio);
  let hard = totalCount - easy - medium;

  // Safety: if rounding pushes hard to 0, nudge from the largest bin
  if (hard < 1) {
    hard = 1;
    if (easy > medium) {
      easy -= 1;
    } else {
      medium -= 1;
    }
  }

  return { easy, medium, hard };
}

export async function generateCurriculumOutline(
  input: CurriculumInput,
): Promise<CurriculumOutline> {
  console.log("[AI_SERVICE] generateCurriculumOutline start", {
    subjectName: input.subjectName,
  });
  const userPrompt = `Buat outline mata pelajaran custom untuk siswa ${
    input.educationLevel ?? "SMA/SMK"
  }${input.gradeLevel ? ` kelas ${input.gradeLevel}` : ""}.

Nama mapel: ${input.subjectName}
${input.context ? `Konteks tambahan dari siswa: ${input.context}` : ""}

Generate outline lengkap sesuai instruksi.

INGAT: Output HARUS JSON mentah saja. Mulai dengan { di karakter pertama, akhir dengan } di karakter terakhir. Tidak boleh ada teks lain.`;

  // Retry up to 3 times — AI kadang return teks biasa bukan JSON
  const maxRetries = 3;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const retrySuffix =
      attempt > 1
        ? `\n\n⛔ KAMU GAGAL. Output sebelumnya BUKAN JSON. Kamu menulis teks pembuka yang SALAH.\nOUTPUT HANYA JSON MENTAH. Mulai dengan { di karakter pertama. Akhir dengan } di karakter terakhir. TIDAK BOLEH ADA TEKS LAIN. Coba lagi.`
        : "";

    try {
      const { text } = await generateText({
        model: chatModel,
        system: SYSTEM_PROMPT,
        prompt: userPrompt + retrySuffix,
        temperature: attempt > 1 ? 0.1 : 0.4,
      });

      const parsedJson = safeParseJson(text);
      const validated = outlineSchema.parse(parsedJson);
      validateOutline(validated);
      return validated;
    } catch (err) {
      lastErr = err;
      console.warn(
        `[AI_SERVICE] generateCurriculumOutline attempt ${attempt}/${maxRetries} failed for ${input.subjectName}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  throw lastErr;
}

function validateOutline(outline: CurriculumOutline): void {
  for (const q of outline.pretestQuestions) {
    if (!outline.topics[q.topicIndex]) {
      throw new Error(
        `Outline tidak valid: pretest question merujuk topicIndex ${q.topicIndex} yang tidak ada`,
      );
    }
    if (!q.options.includes(q.correctAnswer)) {
      throw new Error(
        `Outline tidak valid: correctAnswer "${q.correctAnswer}" bukan salah satu dari options [${q.options.join(", ")}]`,
      );
    }
  }
}

export interface TopicConceptsInput {
  topicName: string;
  topicDescription: string;
  concepts: Array<{ name: string; description: string }>;
  learningStyle?: "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC" | null;
}

const CONCEPTS_SYSTEM_PROMPT_BASE = `Kamu adalah pakar edukasi dan pembuat konten pembelajaran untuk platform tutor AI Spark Ai (SMA/SMK Indonesia).
Tugasmu adalah membuat materi belajar Markdown mendalam dan soal latihan pilihan ganda untuk konsep-konsep di bawah suatu topik.

ATURAN WAJIB:
1. Materi belajar (contentMd) WAJIB mendalam dan komprehensif:
   - Minimal 300 kata per konsep
   - Gunakan heading (##) untuk section utama
   - Sertakan contoh konkret/analogi sehari-hari yang relevan dengan kehidupan siswa SMA/SMK
   - Gunakan bahasa Indonesia yang kasual tapi edukatif (pake "kamu", bukan formal)
   - Sertakan emoji untuk penanda section (🎯 📊 💡)
   -akhiri dengan refleksi: "💭 Coba pikirkan: <pertanyaan>"
2. Setiap konsep HARUS dibuatkan tepat 3 soal latihan pilihan ganda (1 EASY, 1 MEDIUM, 1 HARD).
3. Soal harus memiliki 4 opsi jawaban, dan correctAnswer HARUS persis sama dengan salah satu opsi (case-sensitive).
4. Berikan explanation (penjelasan jawaban) yang jelas dan edukatif.
5. Berikan hint (petunjuk) berupa pertanyaan panduan/Sokratik singkat yang memicu pemikiran siswa (bukan langsung membocorkan jawaban).

KONTEN YANG BAIK:
- Definisi konsep dengan bahasa sederhana
- Penjelasan "mengapa" konsep ini penting
- Contoh nyata dari kehidupan sehari-hari
- Step-by-step jika ada proses/langkah
- Tips atau trik untuk mengingat
- Hubungan dengan konsep lain yang sudah dipelajari

═══════════════════════════════════════════════════
⛔ RULES KETAT UNTUK OUTPUT FORMAT — WAJIB DIIKUTI:
═══════════════════════════════════════════════════
1. Output WAJIB berupa JSON mentah SAJA. TIDAK BOLEH ADA TEKS LAIN.
2. JANGAN tulis kalimat pembuka seperti "Berikut adalah", "Ini adalah", atau apapun sebelum JSON.
3. JANGAN tulis kalimat penutup atau kesimpulan setelah JSON.
4. JANGAN pakai markdown code block. Langsung mulai dengan karakter { di baris pertama.
5. Karakter PERTAMA output harus { dan karakter TERAKHIR harus }.
6. Pastikan semua string di-escape dengan benar.
7. Pastikan JSON valid dan bisa di-parse oleh JSON.parse().
═══════════════════════════════════════════════════`;

function getStyleInstructions(learningStyle?: string | null): string {
  switch (learningStyle) {
    case "VISUAL":
      return `
7. Gaya belajar VISUAL: WAJIB terapkan format berikut:
   - Sertakan minimal 1 diagram Mermaid.js (graph TD/LR) untuk memetakan hubungan konsep atau alur proses
   - PENTING: Label node dengan karakter khusus WAJIB dibungkus tanda kutip ganda (contoh: A["Verb 1 (Base Form)"])
   - Gunakan analogi visual yang imajinatif (contoh: "Bayangkan konsep ini seperti pohon...")
   - Format data numerik atau perbandingan dalam tabel Markdown
   - Gunakan emoji visual (🎯 📊 🔄 💡) sebagai penanda section`;
    case "EXAMPLE_HEAVY":
      return `
7. Gaya belajar EXAMPLE_HEAVY: WAJIB fokus pada studi kasus dan contoh:
   - Setiap konsep utama WAJIB diikuti minimal 2 contoh konkret dengan pembahasan lengkap
   - Struktur: Teori singkat → Contoh 1 + pembahasan step-by-step → Contoh 2 + pembahasan → Ringkasan
   - Prioritaskan "cara mengerjakan" daripada teori murni
   - Gunakan studi kasus nyata dari kehidupan sehari-hari siswa SMA/SMK`;
    case "SOCRATIC":
      return `
7. Gaya belajar SOCRATIC: WAJIB sajikan materi dalam bentuk dialog:
   - Format: Dialog tanya-jawab antara 'Siswa' dan 'Spark'
   - Jangan langsung kasih jawaban lengkap, gunakan pertanyaan retoris untuk menuntun pemahaman
   - Contoh: **Spark**: "Menurut kamu, apa yang terjadi jika...?" → **Siswa**: [Jawaban] → **Spark**: "Hmm, coba pikirkan lagi..."
   - Gunakan pertanyaan bertingkat dari mudah ke sulit
   - Akhiri dengan refleksi: "💭 Sekarang coba jelaskan dengan kata-katamu sendiri..."`;
    case "TEXTUAL":
      return `
7. Gaya belajar TEXTUAL: WAJIB berikan penjelasan akademis terstruktur:
   - Gunakan heading bertingkat (## untuk section utama, ### untuk subsection)
   - Sertakan glosarium istilah teknis (format: **Istilah**: definisi)
   - Penjelasan runtut: Definisi → Teori → Contoh → Kesimpulan
   - Gunakan bullet points dan numbered lists untuk langkah-langkah
   - Bahasa formal tapi tetap mudah dipahami`;
    default:
      return "";
  }
}

export async function generateTopicConceptsContent(
  input: TopicConceptsInput,
): Promise<any> {
  console.log("[AI_SERVICE] generateTopicConceptsContent start", {
    topicName: input.topicName,
    learningStyle: input.learningStyle,
  });

  const styleInstructions = getStyleInstructions(input.learningStyle);
  const systemPrompt = CONCEPTS_SYSTEM_PROMPT_BASE + styleInstructions;

  const userPrompt = `Buat materi belajar dan soal latihan untuk konsep-konsep di dalam topik berikut:
Topik: ${input.topicName}
Deskripsi Topik: ${input.topicDescription}
${input.learningStyle ? `Gaya belajar siswa: ${input.learningStyle}` : ""}

Konsep yang harus dibuatkan kontennya:
${input.concepts.map((c, i) => `${i + 1}. ${c.name} (${c.description})`).join("\n")}

INGAT: Output HARUS JSON mentah saja. Jangan ada teks lain sebelum atau sesudah JSON.
Karakter pertama harus { dan karakter terakhir harus }.

Struktur JSON:
{
  "concepts": [
    {
      "conceptName": "Nama Konsep",
      "contentMd": "Materi belajar lengkap Markdown...",
      "questions": [
        {
          "questionText": "Soal...",
          "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
          "correctAnswer": "Opsi yang benar",
          "explanation": "Penjelasan...",
          "hint": "Petunjuk...",
          "difficulty": "EASY"
        }
      ]
    }
  ]
}`;

  // Retry up to 3 times — AI kadang return teks biasa bukan JSON
  const maxRetries = 3;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const retrySuffix =
      attempt > 1
        ? `\n\n⛔ KAMU GAGAL. Output sebelumnya BUKAN JSON. Kamu menulis teks pembuka yang SALAH.\nOUTPUT HANYA JSON MENTAH. Mulai dengan { di karakter pertama. Akhir dengan } di karakter terakhir. TIDAK BOLEH ADA TEKS LAIN. Coba lagi.`
        : "";

    try {
      const { text } = await generateText({
        model: chatModel,
        system: systemPrompt,
        prompt: userPrompt + retrySuffix,
        temperature: attempt > 1 ? 0.1 : 0.5, // Very low temp on retry
      });

      return safeParseJson(text);
    } catch (err) {
      lastErr = err;
      console.warn(
        `[AI_SERVICE] generateTopicConceptsContent attempt ${attempt}/${maxRetries} failed for ${input.topicName}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  throw lastErr;
}
