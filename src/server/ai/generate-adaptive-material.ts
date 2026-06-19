import "server-only";

import { z } from "zod";
import { chatModel, generateText } from "@/lib/ai";

const generatedMaterialSchema = z.object({
  title: z.string(),
  contentMd: z.string(),
  keyPoints: z.array(z.string()),
  estimatedMinutes: z.number(),
});

export type GeneratedAdaptiveMaterial = z.infer<typeof generatedMaterialSchema>;

export function getMaterialDifficultyInstructions(masteryScore: number): string {
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
  const styleInstructions: Record<string, string> = {
    VISUAL: "Sertakan diagram Mermaid.js dan visualisasi data.",
    TEXTUAL: "Gunakan format teks terstruktur dengan heading dan bullet points.",
    EXAMPLE_HEAVY: "Sertakan banyak contoh nyata dan studi kasus.",
    SOCRATIC: "Gunakan dialog tanya-jawab untuk menjelaskan konsep.",
  };

  const difficultyInstructions = getMaterialDifficultyInstructions(input.masteryScore);

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
2. Panjang: 300-800 kata
3. Sertakan minimal 3 key points
4. Estimasi waktu baca: 3-15 menit
5. Gunakan bahasa Indonesia yang baik dan benar
6. Sertakan contoh yang relevan

Output JSON:
{
  "title": "Judul Materi",
  "contentMd": "Isi materi dalam Markdown...",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "estimatedMinutes": 5
}`,
    temperature: 0.5,
  });

  const parsed = generatedMaterialSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    throw new Error(`Failed to parse generated material: ${parsed.error.message}`);
  }
  return parsed.data;
}
