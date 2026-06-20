import "server-only";

import { z } from "zod";
import { chatModel, generateText } from "@/lib/ai";

const generatedQuestionSchema = z.object({
  questionText: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

const generatedQuestionsSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;

export async function generateQuestionsForConcept(input: {
  conceptName: string;
  conceptDescription: string;
  contentMd: string;
  learningStyle: string;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}): Promise<GeneratedQuestion[]> {
  const totalCount = input.easyCount + input.mediumCount + input.hardCount;

  const styleInstructions: Record<string, string> = {
    VISUAL: "Gunakan analogi visual dan contoh konkret dalam soal.",
    TEXTUAL: "Buatkan soal berbasis teks dan definisi formal.",
    EXAMPLE_HEAVY: "Buatkan soal berbasis studi kasus dan contoh nyata.",
    SOCRATIC: "Buatkan soal yang mendorong pemikiran kritis dan analisis.",
  };

  const { text } = await generateText({
    model: chatModel,
    prompt: `Kamu adalah expert pendidikan untuk siswa SMA/SMK Indonesia.

Buatkan ${totalCount} soal latihan pilihan ganda untuk konsep berikut:

Konsep: ${input.conceptName}
Deskripsi: ${input.conceptDescription}
Materi: ${input.contentMd.slice(0, 3000)}

Distribusi soal:
- EASY: ${input.easyCount} soal (pemahaman dasar, definisi, identifikasi)
- MEDIUM: ${input.mediumCount} soal (aplikasi, contoh soal, interpretasi)
- HARD: ${input.hardCount} soal (analisis, soal cerita kompleks, evaluasi)

Gaya belajar: ${styleInstructions[input.learningStyle] || styleInstructions.VISUAL}

Aturan:
1. Setiap soal punya 4 opsi (A, B, C, D)
2. correctAnswer harus persis sama dengan salah satu opsi (termasuk huruf awal)
3. Sertakan penjelasan jawaban
4. Sesuaikan kesulitan dengan label yang diminta
5. Gunakan bahasa Indonesia yang baik dan benar

Output JSON:
{
  "questions": [
    {
      "questionText": "Pertanyaan...",
      "options": ["A. Jawaban1", "B. Jawaban2", "C. Jawaban3", "D. Jawaban4"],
      "correctAnswer": "A. Jawaban1",
      "explanation": "Penjelasan...",
      "difficulty": "EASY"
    }
  ]
}`,
    temperature: 0.5,
  });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid JSON for questions");
  }
  const parsed = generatedQuestionsSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Failed to parse generated questions: ${parsed.error.message}`,
    );
  }
  return parsed.data.questions;
}
