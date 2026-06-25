import "server-only";

import { z } from "zod";
import { chatModel, generateText, safeParseJson } from "@/lib/ai";
import { retryOnZodError } from "@/server/utils/ai-retry";
import { countWords } from "@/server/utils/word-count";

const generatedMaterialSchema = z.object({
  title: z.string().min(1, "Judul tidak boleh kosong"),
  contentMd: z
    .string()
    .min(500, "Konten terlalu pendek, minimal 500 karakter")
    .refine((text) => countWords(text) >= 300, {
      message: "Materi terlalu pendek, minimal 300 kata",
    }),
  keyPoints: z.array(z.string()).min(1, "Minimal 1 key point"),
  estimatedMinutes: z.number().min(1).max(60),
});

export type GeneratedAdaptiveMaterial = z.infer<typeof generatedMaterialSchema>;

export function getMaterialDifficultyInstructions(
  masteryScore: number,
): string {
  if (masteryScore < 0.4) {
    return `EASY - Materi untuk pemula:
- Gunakan bahasa sederhana dan sehari-hari
- Berikan banyak analogi dari kehidupan nyata
- Langkah demi langkah (step-by-step)
- Contoh konkret yang mudah dipahami
- Hindari istilah teknis yang rumit`;
  }
  if (masteryScore < 0.7) {
    return `MEDIUM - Materi menengah:
- Penjelasan teknis yang terstruktur
- Contoh aplikasi di dunia nyata
- Hubungkan dengan konsep lain yang sudah dipelajari
- Gunakan istilah teknis dengan penjelasan
- Sertakan diagram atau tabel jika relevan`;
  }
  return `HARD - Materi lanjutan:
- Analisis mendalam dan komprehensif
- Terminologi advanced dan istilah spesifik
- Studi kasus kompleks
- Perbandingan teori atau pendekatan berbeda
- Tantang pemahaman dengan pertanyaan retoris`;
}

export async function generateAdaptiveMaterial(input: {
  conceptName: string;
  conceptDescription: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  learningStyle: string;
  masteryScore: number;
}): Promise<GeneratedAdaptiveMaterial> {
  return retryOnZodError(() => _generateAdaptiveMaterialInner(input), 2);
}

async function _generateAdaptiveMaterialInner(
  input: Parameters<typeof generateAdaptiveMaterial>[0],
): Promise<GeneratedAdaptiveMaterial> {
  const styleInstructions: Record<string, string> = {
    VISUAL: `Gaya belajar siswa adalah VISUAL. WAJIB terapkan format berikut:
- Sertakan minimal 2 diagram Mermaid.js (graph TD/LR) untuk memetakan hubungan konsep, hierarki, atau alur proses
- PENTING: Saat membuat diagram Mermaid.js, pastikan semua label teks di dalam node yang memiliki karakter khusus (seperti tanda kurung (), garis miring /, koma, tanda petik, tanda tanya, atau spasi) WAJIB dibungkus dengan tanda kutip ganda (contoh: A["Verb 1 (Base Form)"], bukan A[Verb 1 (Base Form)]). Jangan gunakan tag HTML di dalam label diagram.
- Gunakan analogi visual yang imajinatif (contoh: "Bayangkan konsep ini seperti pohon, di mana akar adalah...")
- Format data numerik atau perbandingan dalam tabel Markdown
- Gunakan emoji visual (🎯 📊 🔄 💡) sebagai penanda section penting
- Struktur materi dengan heading bertingkat dan bullet points yang jelas`,

    TEXTUAL: `Gaya belajar siswa adalah TEXTUAL. WAJIB terapkan format akademis terstruktur:
- Gunakan heading bertingkat (## untuk section utama, ### untuk subsection)
- Sertakan glosarium istilah teknis di awal atau akhir materi (format: **Istilah**: definisi)
- Penjelasan runtut: Definisi → Teori → Contoh → Kesimpulan
- Gunakan bullet points dan numbered lists untuk langkah-langkah
- Sertakan referensi silang antar konsep jika relevan
- Bahasa formal tapi tetap mudah dipahami`,

    EXAMPLE_HEAVY: `Gaya belajar siswa adalah EXAMPLE_HEAVY. WAJIB fokus pada studi kasus dan contoh:
- Setiap konsep utama WAJIB diikuti minimal 2 contoh konkret dengan pembahasan lengkap
- Struktur: Teori singkat → Contoh 1 + pembahasan step-by-step → Contoh 2 + pembahasan → Ringkasan
- Prioritaskan "cara mengerjakan" atau "cara menerapkan" daripada teori murni
- Gunakan studi kasus nyata dari kehidupan sehari-hari siswa SMA/SMK
- Sertakan perhitungan detail jika ada rumus atau angka`,

    SOCRATIC: `Gaya belajar siswa adalah SOCRATIC. WAJIB sajikan materi dalam bentuk dialog:
- Format: Dialog tanya-jawab antara 'Siswa' dan 'Spark'
- Jangan langsung kasih jawaban lengkap, gunakan pertanyaan retoris untuk menuntun pemahaman
- Contoh struktur:
  **Spark**: "Menurut kamu, apa yang terjadi jika...?"
  **Siswa**: [Jawaban umum/miskonsepsi]
  **Spark**: "Hmm, coba pikirkan lagi. Kalau kita lihat dari sudut pandang X..."
- Gunakan pertanyaan bertingkat dari mudah ke sulit
- Akhiri dengan refleksi: "💭 Sekarang coba jelaskan dengan kata-katamu sendiri..."`,
  };

  const difficultyInstructions = getMaterialDifficultyInstructions(
    input.masteryScore,
  );

  const { text } = await generateText({
    model: chatModel,
    prompt: `Kamu adalah expert pendidikan untuk siswa SMA/SMK Indonesia.

Buatkan materi belajar untuk konsep berikut:

Konsep: ${input.conceptName}
Deskripsi: ${input.conceptDescription}
Difficulty: ${input.difficulty}
Tingkat pemahaman siswa: ${Math.round(input.masteryScore * 100)}%

Instruksi difficulty:
${difficultyInstructions}

Gaya belajar: ${styleInstructions[input.learningStyle] || styleInstructions.VISUAL}

Aturan:
1. Materi dalam format Markdown yang bersih
2. Panjang: 500-1500 kata
3. Sertakan minimal 3 key points
4. Estimasi waktu baca: 10-30 menit
5. Gunakan bahasa Indonesia yang baik dan benar
6. Sertakan contoh yang relevan

STRUKTUR WAJIB (semua di dalam field contentMd JSON):
- Judul dan pengantar (kaitkan dengan kehidupan siswa)
- Penjelasan konsep utama (mendalam, bukan permukaan)
- Contoh soal beserta pembahasan langkah demi langkah
- Ringkasan poin-poin penting

PENTING: Jangan output materi secara terpisah! Seluruh konten markdown WAJIB ada di dalam field contentMd pada JSON.

Output HANYA JSON valid (tanpa markdown code block, tanpa teks lain):
{"title":"Judul Materi","contentMd":"# Judul Materi\n\nIsi materi LENGKAP...","keyPoints":["Point 1","Point 2","Point 3"],"estimatedMinutes":15}`,
    temperature: 0.4,
  });

  let json: unknown;
  try {
    json = safeParseJson(text);
  } catch (parseErr) {
    console.error("[MATERIAL_AI] Failed to parse AI output:", {
      rawText: text.slice(0, 500),
      error: parseErr,
    });
    throw new Error("AI returned invalid JSON for material");
  }

  const parsed = generatedMaterialSchema.safeParse(json);
  if (!parsed.success) {
    console.error("[MATERIAL_AI] Zod validation failed:", {
      issues: parsed.error.issues,
      receivedKeys: json && typeof json === "object" ? Object.keys(json) : [],
    });
    throw new Error(
      `Failed to parse generated material: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
