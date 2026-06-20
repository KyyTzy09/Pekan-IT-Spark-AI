import "server-only";

import { z } from "zod";
import { chatModel, generateText } from "@/lib/ai";
import { retryOnZodError } from "@/server/utils/ai-retry";
import { countWords } from "@/server/utils/word-count";

const generatedMaterialSchema = z.object({
  title: z.string(),
  contentMd: z
    .string()
    .min(5000)
    .refine((text) => countWords(text) >= 1000, {
      message: "Materi terlalu pendek, minimal 1000 kata",
    }),
  keyPoints: z.array(z.string()),
  estimatedMinutes: z.number(),
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
  return retryOnZodError(() => _generateAdaptiveMaterialInner(input));
}

async function _generateAdaptiveMaterialInner(
  input: Parameters<typeof generateAdaptiveMaterial>[0],
): Promise<GeneratedAdaptiveMaterial> {
  const styleInstructions: Record<string, string> = {
    VISUAL: `Gaya belajar siswa adalah VISUAL. WAJIB terapkan format berikut:
- Sertakan minimal 2 diagram Mermaid.js (graph TD/LR) untuk memetakan hubungan konsep, hierarki, atau alur proses
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
2. Panjang: 1000-2000 kata (WAJIB minimal 1000 kata)
3. Sertakan minimal 3 key points
4. Estimasi waktu baca: 10-30 menit
5. Gunakan bahasa Indonesia yang baik dan benar
6. Sertakan contoh yang relevan

STRUKTUR WAJIB:
- Judul dan pengantar (kaitkan dengan kehidupan siswa)
- Penjelasan konsep utama (mendalam, bukan permukaan)
- Contoh soal beserta pembahasan langkah demi langkah
- Studi kasus atau aplikasi dunia nyata
- Ringkasan poin-poin penting
- Callout refleksi: "💭 Coba pikirkan: <pertanyaan>"

Output JSON:
{
  "title": "Judul Materi",
  "contentMd": "Isi materi dalam Markdown...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "estimatedMinutes": 15
}`,
    temperature: 0.5,
  });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid JSON for material");
  }
  const parsed = generatedMaterialSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Failed to parse generated material: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
