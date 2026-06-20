import "server-only";

import { z } from "zod";
import { fastModel, generateText } from "@/lib/ai";

const extractedConceptSchema = z.object({
  name: z.string(),
  description: z.string(),
  importance: z.number().min(1).max(5),
});

const extractedConceptsSchema = z.object({
  concepts: z.array(extractedConceptSchema),
});

export type ExtractedConcept = z.infer<typeof extractedConceptSchema>;

export async function extractConceptsFromDocument(
  content: string,
): Promise<ExtractedConcept[]> {
  const truncated = content.slice(0, 12000);

  const { text } = await generateText({
    model: fastModel,
    prompt: `Ekstrak konsep-konsep kunci dari dokumen berikut.

Dokumen:
${truncated}

Untuk setiap konsep, buatkan:
- Nama konsep (singkat, jelas, maksimal 50 karakter)
- Deskripsi (1-2 kalimat, maksimal 100 karakter)
- Tingkat kepentingan (1-5, 5 = paling penting)

Fokus pada konsep yang bisa diuji dengan soal pilihan ganda.
Ambil maksimal 8 konsep terpenting.

Output JSON:
{
  "concepts": [
    {
      "name": "Nama Konsep",
      "description": "Deskripsi konsep",
      "importance": 5
    }
  ]
}`,
    temperature: 0.3,
  });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("AI returned invalid JSON for concepts");
  }
  const parsed = extractedConceptsSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `Failed to parse extracted concepts: ${parsed.error.message}`,
    );
  }
  return parsed.data.concepts;
}
