import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock dependencies
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subject: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    topic: {
      createMany: vi.fn(),
    },
    concept: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    question: {
      createMany: vi.fn(),
    },
    material: {
      createMany: vi.fn(),
    },
    conceptEmbedding: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/server/ai/curriculum", () => ({
  generateCurriculumOutline: vi.fn(),
  generateTopicConceptsContent: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  embedMany: vi.fn(),
  embeddingModel: "test-model",
}));

vi.mock("@/server/actions/gamification", () => ({
  addXp: vi.fn(),
  checkAndUnlockBadges: vi.fn(),
  recordActivity: vi.fn(),
}));

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  generateCurriculumOutline,
  generateTopicConceptsContent,
} from "@/server/ai/curriculum";
import { embedMany } from "@/lib/ai";
import { addCustomSubject } from "@/server/actions/subjects";

describe("addCustomSubject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSession = {
    id: "user-123",
    role: "STUDENT",
  };

  const mockProfile = {
    educationLevel: "SMA",
    grade: 11,
    focusedSubjects: [],
    learningStyle: "VISUAL",
  };

  const mockOutline = {
    description: "Belajar coding dari dasar",
    icon: "💻",
    color: "#4F46E5",
    topics: [
      {
        name: "Pengenalan HTML",
        description: "Dasar-dasar HTML",
        concepts: [
          { name: "Tag HTML", description: "Apa itu tag HTML" },
          { name: "Atribut HTML", description: "Fungsi atribut" },
        ],
      },
      {
        name: "Pengenalan CSS",
        description: "Dasar-dasar CSS",
        concepts: [
          { name: "Selector CSS", description: "Jenis-jenis selector" },
        ],
      },
    ],
    pretestQuestions: [
      {
        topicIndex: 0,
        questionText: "Apa kepanjangan HTML?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Hyper Transfer Markup Language",
          "Home Tool Markup Language",
        ],
        correctAnswer: "Hyper Text Markup Language",
        explanation: "HTML adalah singkatan dari Hyper Text Markup Language",
        difficulty: "EASY",
      },
    ],
  };

  const mockTopicContent = {
    concepts: [
      {
        conceptName: "Tag HTML",
        contentMd:
          "# Tag HTML\n\nTag HTML adalah elemen dasar yang digunakan untuk membuat struktur halaman web. Setiap tag memiliki fungsi tertentu.\n\n## Contoh Tag\n\n- `<h1>` untuk heading\n- `<p>` untuk paragraf\n- `<a>` untuk link\n\nTag HTML biasanya memiliki tag pembuka dan tag penutup.\n\n💭 Coba pikirkan: Apa yang terjadi jika kita tidak menggunakan tag HTML? Ini adalah pertanyaan refleksi yang penting.",
        questions: [
          {
            questionText: "Tag apa yang digunakan untuk heading?",
            options: ["<h1>", "<p>", "<a>", "<div>"],
            correctAnswer: "<h1>",
            explanation: "<h1> digunakan untuk heading level 1",
            hint: "Tag ini biasanya untuk judul utama",
            difficulty: "EASY",
          },
          {
            questionText: "Manakah tag yang benar untuk paragraf?",
            options: ["<p>", "<para>", "<text>", "<paragraph>"],
            correctAnswer: "<p>",
            explanation: "<p> adalah tag standar untuk paragraf",
            hint: "Tag ini singkat, 1 huruf",
            difficulty: "MEDIUM",
          },
          {
            questionText:
              "Apa yang terjadi jika tag HTML tidak ditutup dengan benar?",
            options: [
              "Halaman tetap berfungsi normal",
              "Browser akan error dan tidak menampilkan apapun",
              "Elemen mungkin tidak tampil dengan benar",
              "Tidak ada pengaruh sama sekali",
            ],
            correctAnswer: "Elemen mungkin tidak tampil dengan benar",
            explanation:
              "Browser modern biasanya bisa memperbaiki HTML yang tidak valid, tapi hasilnya mungkin tidak sesuai harapan",
            hint: "Coba bayangkan jika kita tidak menutup kurung saat menulis",
            difficulty: "HARD",
          },
        ],
      },
      {
        conceptName: "Atribut HTML",
        contentMd:
          "# Atribut HTML\n\nAtribut memberikan informasi tambahan tentang elemen HTML. Atribut ditulis di dalam tag pembuka.\n\n## Contoh Atribut\n\n```html\n<a href='https://example.com'>Link</a>\n<img src='gambar.jpg' alt='Deskripsi'>\n```\n\n💭 Coba pikirkan: Mengapa atribut `alt` penting untuk tag `<img>`? Ini pertanyaan bagus untuk dipikirkan.",
        questions: [
          {
            questionText: "Di mana atribut HTML ditulis?",
            options: [
              "Di dalam tag pembuka",
              "Di dalam tag penutup",
              "Di antara tag pembuka dan penutup",
              "Di luar elemen HTML",
            ],
            correctAnswer: "Di dalam tag pembuka",
            explanation: "Atribut selalu ditulis di dalam tag pembuka",
            hint: "Perhatikan contoh: <a href='...'>",
            difficulty: "EASY",
          },
          {
            questionText: "Apa fungsi atribut `href` pada tag `<a>`?",
            options: [
              "Menentukan warna link",
              "Menentukan URL tujuan",
              "Menentukan ukuran teks",
              "Menentukan font",
            ],
            correctAnswer: "Menentukan URL tujuan",
            explanation: "href (hypertext reference) menentukan ke mana link akan mengarah",
            hint: "href singkatan dari hypertext reference",
            difficulty: "MEDIUM",
          },
          {
            questionText:
              "Mengapa atribut `alt` penting pada tag `<img>`?",
            options: [
              "Untuk mempercepat loading gambar",
              "Untuk membuat gambar lebih besar",
              "Untuk aksesibilitas dan SEO",
              "Untuk mengubah format gambar",
            ],
            correctAnswer: "Untuk aksesibilitas dan SEO",
            explanation:
              "Atribut alt membantu screen reader untuk tunanetra dan membantu search engine memahami gambar",
            hint: "Siapa yang tidak bisa melihat gambar?",
            difficulty: "HARD",
          },
        ],
      },
      {
        conceptName: "Selector CSS",
        contentMd:
          "# Selector CSS\n\nSelector CSS digunakan untuk memilih elemen HTML yang akan di-styling. Ada berbagai jenis selector.\n\n## Jenis Selector\n\n- Element selector: `p { color: red; }`\n- Class selector: `.nama { font-size: 16px; }`\n- ID selector: `#judul { font-weight: bold; }`\n\n💭 Coba pikirkan: Kapan kita menggunakan class selector vs ID selector? Ini konsep penting dalam CSS.",
        questions: [
          {
            questionText: "Selector apa yang menggunakan tanda titik (.)?",
            options: ["Element selector", "Class selector", "ID selector", "Universal selector"],
            correctAnswer: "Class selector",
            explanation: "Class selector menggunakan tanda titik (.) di depan nama class",
            hint: "Perhatikan tanda yang digunakan",
            difficulty: "EASY",
          },
          {
            questionText: "Apa perbedaan class dan ID selector?",
            options: [
              "Tidak ada perbedaan",
              "Class bisa dipakai banyak elemen, ID hanya satu",
              "ID lebih cepat dari class",
              "Class untuk warna, ID untuk ukuran",
            ],
            correctAnswer: "Class bisa dipakai banyak elemen, ID hanya satu",
            explanation: "ID harus unik dalam satu halaman, class bisa dipakai berulang",
            hint: "Ingat konsep unik vs berulang",
            difficulty: "MEDIUM",
          },
          {
            questionText: "Manakah selector yang paling spesifik?",
            options: [
              "Element selector",
              "Class selector",
              "ID selector",
              "Universal selector",
            ],
            correctAnswer: "ID selector",
            explanation: "ID selector memiliki specificity tertinggi di antara selector dasar",
            hint: "Spesifikitas menentukan mana yang menang jika ada konflik",
            difficulty: "HARD",
          },
        ],
      },
    ],
  };

  it("should reject unauthenticated user", async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await addCustomSubject({ name: "Coding" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("login");
    }
  });

  it("should reject non-student role", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "user-123",
      role: "PARENT",
    } as any);

    const result = await addCustomSubject({ name: "Coding" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("siswa");
    }
  });

  it("should reject duplicate subject name", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(
      mockProfile as any,
    );
    vi.mocked(prisma.subject.findFirst).mockResolvedValue({
      id: "existing-subject",
      slug: "CODING",
      isCustom: true,
      createdById: "user-123",
    } as any);

    const result = await addCustomSubject({ name: "Coding" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.subjectId).toBe("existing-subject");
    }
  });

  it("should reject national subject name", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(
      mockProfile as any,
    );
    vi.mocked(prisma.subject.findFirst).mockResolvedValue({
      id: "national-subject",
      slug: "MATEMATIKA",
      isCustom: false,
      createdById: null,
    } as any);

    const result = await addCustomSubject({ name: "Matematika" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("nasional");
    }
  });

  it("should create custom subject with all records", async () => {
    // Setup mocks
    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      challengeSubjectIds: [],
    } as any);
    vi.mocked(prisma.subject.findFirst).mockResolvedValue(null);
    vi.mocked(generateCurriculumOutline).mockResolvedValue(mockOutline as any);
    vi.mocked(generateTopicConceptsContent).mockImplementation(async () => {
      // Simulate some delay
      return mockTopicContent as any;
    });
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]],
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        subject: { create: vi.fn().mockResolvedValue({ id: "new-subject" }) },
        topic: { createMany: vi.fn() },
        concept: { createMany: vi.fn() },
        question: { createMany: vi.fn() },
        material: { createMany: vi.fn() },
      };
      return fn(tx);
    });
    vi.mocked(prisma.concept.findMany).mockResolvedValue([
      { id: "concept-1", name: "Tag HTML", description: "Apa itu tag HTML", contentMd: "# Tag HTML content" },
      { id: "concept-2", name: "Atribut HTML", description: "Fungsi atribut", contentMd: "# Atribut HTML content" },
      { id: "concept-3", name: "Selector CSS", description: "Jenis-jenis selector", contentMd: "# Selector CSS content" },
    ] as any);
    vi.mocked(prisma.conceptEmbedding.createMany).mockResolvedValue({
      count: 3,
    } as any);
    vi.mocked(prisma.studentProfile.update).mockResolvedValue({} as any);

    // Execute
    const result = await addCustomSubject({
      name: "Coding",
      context: "Belajar web development",
    });

    // Assert result
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.subjectId).toBeDefined();
    }

    // Verify generateCurriculumOutline was called with correct params
    expect(generateCurriculumOutline).toHaveBeenCalledWith({
      subjectName: "Coding",
      context: "Belajar web development",
      gradeLevel: 11,
      educationLevel: "SMA",
    });

    // Verify generateTopicConceptsContent was called for each topic
    expect(generateTopicConceptsContent).toHaveBeenCalledTimes(2);

    // Verify learningStyle was passed
    const firstCall = vi.mocked(generateTopicConceptsContent).mock.calls[0];
    expect(firstCall[0].learningStyle).toBe("VISUAL");

    // Verify transaction was called
    expect(prisma.$transaction).toHaveBeenCalled();

    // Verify embeddings were generated
    expect(embedMany).toHaveBeenCalled();
    expect(prisma.conceptEmbedding.createMany).toHaveBeenCalled();
  });

  it("should pass learning style to content generation", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      learningStyle: "SOCRATIC",
      challengeSubjectIds: [],
    } as any);
    vi.mocked(prisma.subject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.concept.findMany).mockResolvedValue([
      { id: "c1", name: "Tag HTML", description: "", contentMd: "content" },
    ] as any);
    vi.mocked(generateCurriculumOutline).mockResolvedValue(mockOutline as any);
    vi.mocked(generateTopicConceptsContent).mockResolvedValue(
      mockTopicContent as any,
    );
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [[0.1, 0.2]],
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        subject: { create: vi.fn().mockResolvedValue({ id: "new-subject" }) },
        topic: { createMany: vi.fn() },
        concept: { createMany: vi.fn() },
        question: { createMany: vi.fn() },
        material: { createMany: vi.fn() },
      };
      return fn(tx);
    });
    vi.mocked(prisma.conceptEmbedding.createMany).mockResolvedValue({
      count: 1,
    } as any);
    vi.mocked(prisma.studentProfile.update).mockResolvedValue({} as any);

    await addCustomSubject({ name: "Coding" });

    // Verify learning style SOCRATIC was passed
    const calls = vi.mocked(generateTopicConceptsContent).mock.calls;
    for (const call of calls) {
      expect(call[0].learningStyle).toBe("SOCRATIC");
    }
  });

  it("should create materials for each concept with content", async () => {
    let capturedTx: any;

    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      challengeSubjectIds: [],
    } as any);
    vi.mocked(prisma.subject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.concept.findMany).mockResolvedValue([
      { id: "c1", name: "Tag HTML", description: "", contentMd: "content" },
      { id: "c2", name: "Atribut HTML", description: "", contentMd: "content" },
      { id: "c3", name: "Selector CSS", description: "", contentMd: "content" },
    ] as any);
    vi.mocked(generateCurriculumOutline).mockResolvedValue(mockOutline as any);
    vi.mocked(generateTopicConceptsContent).mockResolvedValue(
      mockTopicContent as any,
    );
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [[0.1, 0.2]],
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        subject: { create: vi.fn().mockResolvedValue({ id: "new-subject" }) },
        topic: { createMany: vi.fn() },
        concept: { createMany: vi.fn() },
        question: { createMany: vi.fn() },
        material: { createMany: vi.fn() },
      };
      capturedTx = tx;
      return fn(tx);
    });
    vi.mocked(prisma.conceptEmbedding.createMany).mockResolvedValue({
      count: 1,
    } as any);
    vi.mocked(prisma.studentProfile.update).mockResolvedValue({} as any);

    await addCustomSubject({ name: "Coding" });

    // Verify materials were created
    expect(capturedTx.material.createMany).toHaveBeenCalled();
    const materialCall = capturedTx.material.createMany.mock.calls[0][0];

    // Should have materials for concepts with content (Tag HTML, Atribut HTML, Selector CSS)
    expect(materialCall.data.length).toBe(3);
    expect(materialCall.skipDuplicates).toBe(true);

    // Verify material structure
    const firstMaterial = materialCall.data[0];
    expect(firstMaterial).toHaveProperty("id");
    expect(firstMaterial).toHaveProperty("userId", "user-123");
    expect(firstMaterial).toHaveProperty("subjectId");
    expect(firstMaterial).toHaveProperty("topicId");
    expect(firstMaterial).toHaveProperty("conceptId");
    expect(firstMaterial).toHaveProperty("title");
    expect(firstMaterial).toHaveProperty("content");
    expect(firstMaterial).toHaveProperty("difficulty", "MEDIUM");
    expect(firstMaterial).toHaveProperty("source", "AI_GENERATED");
    expect(firstMaterial).toHaveProperty("estimatedMinutes");
    expect(firstMaterial.estimatedMinutes).toBeGreaterThanOrEqual(5);
  });

  it("should create practice questions for each concept", async () => {
    let capturedTx: any;

    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      challengeSubjectIds: [],
    } as any);
    vi.mocked(prisma.subject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.concept.findMany).mockResolvedValue([
      { id: "c1", name: "Tag HTML", description: "", contentMd: "content" },
      { id: "c2", name: "Atribut HTML", description: "", contentMd: "content" },
      { id: "c3", name: "Selector CSS", description: "", contentMd: "content" },
    ] as any);
    vi.mocked(generateCurriculumOutline).mockResolvedValue(mockOutline as any);
    vi.mocked(generateTopicConceptsContent).mockResolvedValue(
      mockTopicContent as any,
    );
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [[0.1, 0.2]],
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        subject: { create: vi.fn().mockResolvedValue({ id: "new-subject" }) },
        topic: { createMany: vi.fn() },
        concept: { createMany: vi.fn() },
        question: { createMany: vi.fn() },
        material: { createMany: vi.fn() },
      };
      capturedTx = tx;
      return fn(tx);
    });
    vi.mocked(prisma.conceptEmbedding.createMany).mockResolvedValue({
      count: 1,
    } as any);
    vi.mocked(prisma.studentProfile.update).mockResolvedValue({} as any);

    await addCustomSubject({ name: "Coding" });

    // Verify questions were created
    expect(capturedTx.question.createMany).toHaveBeenCalled();
    const questionCall = capturedTx.question.createMany.mock.calls[0][0];

    // Should have practice questions (3 per concept × 3 concepts) + pretest (1)
    // 3 concepts × 3 questions = 9 practice + 1 pretest = 10 total
    expect(questionCall.data.length).toBe(10);

    // Verify practice questions have correct structure
    const practiceQuestions = questionCall.data.filter((q: any) =>
      q.tags.includes("practice"),
    );
    expect(practiceQuestions.length).toBe(9);

    // Verify difficulty distribution (1 EASY, 1 MEDIUM, 1 HARD per concept)
    for (const q of practiceQuestions) {
      expect(["EASY", "MEDIUM", "HARD"]).toContain(q.difficulty);
      expect(q.type).toBe("MULTIPLE_CHOICE");
      expect(q.isActive).toBe(true);
      expect(q.questionText).toBeTruthy();
      expect(q.options).toHaveLength(4);
      expect(q.correctAnswer).toBeTruthy();
      expect(q.explanation).toBeTruthy();
    }

    // Verify pretest questions
    const pretestQuestions = questionCall.data.filter((q: any) =>
      q.tags.includes("pretest"),
    );
    expect(pretestQuestions.length).toBe(1);
  });

  it("should auto-favorite subject and add to challengeSubjectIds", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      challengeSubjectIds: [],
    } as any);
    vi.mocked(prisma.subject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.concept.findMany).mockResolvedValue([
      { id: "c1", name: "Tag HTML", description: "", contentMd: "content" },
    ] as any);
    vi.mocked(generateCurriculumOutline).mockResolvedValue(mockOutline as any);
    vi.mocked(generateTopicConceptsContent).mockResolvedValue(
      mockTopicContent as any,
    );
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [[0.1, 0.2]],
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        subject: { create: vi.fn().mockResolvedValue({ id: "new-subject" }) },
        topic: { createMany: vi.fn() },
        concept: { createMany: vi.fn() },
        question: { createMany: vi.fn() },
        material: { createMany: vi.fn() },
      };
      return fn(tx);
    });
    vi.mocked(prisma.conceptEmbedding.createMany).mockResolvedValue({
      count: 1,
    } as any);
    vi.mocked(prisma.studentProfile.update).mockResolvedValue({} as any);

    await addCustomSubject({ name: "Coding" });

    // Verify profile was updated with both focusedSubjects and challengeSubjectIds
    expect(prisma.studentProfile.update).toHaveBeenCalled();
    const updateCall = vi.mocked(prisma.studentProfile.update).mock.calls[0][0];
    expect(updateCall.data.focusedSubjects).toBeDefined();
    expect(updateCall.data.challengeSubjectIds).toBeDefined();
  });

  it("should handle AI generation failure gracefully", async () => {
    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(
      mockProfile as any,
    );
    vi.mocked(prisma.subject.findFirst).mockResolvedValue(null);
    vi.mocked(generateCurriculumOutline).mockRejectedValue(
      new Error("AI service unavailable"),
    );

    const result = await addCustomSubject({ name: "Coding" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Gagal membuat outline");
    }
  });

  it("should not create materials for concepts without content", async () => {
    const contentWithoutMd = {
      concepts: [
        {
          conceptName: "Tag HTML",
          contentMd: "Short content", // Less than 50 chars
          questions: [],
        },
      ],
    };

    let capturedTx: any;

    vi.mocked(getSession).mockResolvedValue(mockSession as any);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      ...mockProfile,
      challengeSubjectIds: [],
    } as any);
    vi.mocked(prisma.subject.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.concept.findMany).mockResolvedValue([
      { id: "c1", name: "Tag HTML", description: "", contentMd: "Short" },
    ] as any);
    vi.mocked(generateCurriculumOutline).mockResolvedValue(mockOutline as any);
    vi.mocked(generateTopicConceptsContent).mockResolvedValue(
      contentWithoutMd as any,
    );
    vi.mocked(embedMany).mockResolvedValue({
      embeddings: [[0.1, 0.2]],
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        subject: { create: vi.fn().mockResolvedValue({ id: "new-subject" }) },
        topic: { createMany: vi.fn() },
        concept: { createMany: vi.fn() },
        question: { createMany: vi.fn() },
        material: { createMany: vi.fn() },
      };
      capturedTx = tx;
      return fn(tx);
    });
    vi.mocked(prisma.conceptEmbedding.createMany).mockResolvedValue({
      count: 1,
    } as any);
    vi.mocked(prisma.studentProfile.update).mockResolvedValue({} as any);

    await addCustomSubject({ name: "Coding" });

    // Materials should be empty because contentMd is too short
    // material.createMany might not be called if materialsData is empty
    if (capturedTx.material.createMany.mock.calls.length > 0) {
      const materialCall = capturedTx.material.createMany.mock.calls[0][0];
      expect(materialCall.data.length).toBe(0);
    } else {
      // If materialsData is empty, createMany is not called at all (which is correct)
      expect(capturedTx.material.createMany).not.toHaveBeenCalled();
    }
  });
});
