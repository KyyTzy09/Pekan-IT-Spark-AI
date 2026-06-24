"use server";

import { generateText } from "@/lib/ai";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getProgressTimeline } from "@/server/actions/challenges";
import { getDashboardSummary } from "@/server/actions/dashboard";

/** Get today's date string in local timezone (not UTC). */
function getLocalDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type ParentAlert = {
  id: string;
  type: "inactivity" | "struggle" | "info";
  title: string;
  message: string;
  severity: "info" | "warning";
};

export type HistoryItem = {
  id: string;
  date: string;
  type: "challenge" | "practice" | "chat" | "material";
  title: string;
  subject?: string;
  score?: number;
  duration?: number;
};

export async function getParentHistoryData(
  activeStudentId?: string,
  days = 30,
) {
  const session = await getSession();
  if (!session?.id) {
    return { ok: false, error: "UNAUTHORIZED" };
  }
  if (session.role !== "PARENT") {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parentId = session.id;

  const links = await prisma.parentStudentLink.findMany({
    where: { parentId, status: "ACCEPTED" },
    include: { student: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (links.length === 0) {
    return { ok: true, children: [], activeChild: null, history: [] };
  }

  let activeLink = links[0];
  if (activeStudentId) {
    const found = links.find((l) => l.studentId === activeStudentId);
    if (found) activeLink = found;
  }

  const studentId = activeLink.studentId;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const [challenges, attempts, chatSessions, materials] = await Promise.all([
    prisma.challenge.findMany({
      where: {
        userId: studentId,
        scheduledFor: { gte: cutoffDate },
      },
      select: {
        id: true,
        title: true,
        scheduledFor: true,
        status: true,
        completedAt: true,
        subject: { select: { name: true } },
      },
      orderBy: { scheduledFor: "desc" },
    }),
    prisma.questionAttempt.findMany({
      where: {
        userId: studentId,
        createdAt: { gte: cutoffDate },
      },
      select: {
        id: true,
        isCorrect: true,
        timeSpent: true,
        createdAt: true,
        question: {
          select: {
            concept: {
              select: {
                topic: {
                  select: { subject: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.chatSession.findMany({
      where: {
        userId: studentId,
        createdAt: { gte: cutoffDate },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        subject: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.materialRead.findMany({
      where: {
        userId: studentId,
        readAt: { gte: cutoffDate },
      },
      select: {
        id: true,
        readAt: true,
        readSeconds: true,
        material: {
          select: {
            title: true,
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { readAt: "desc" },
      take: 50,
    }),
  ]);

  const history: HistoryItem[] = [];

  for (const c of challenges) {
    history.push({
      id: `challenge-${c.id}`,
      date: c.scheduledFor.toISOString(),
      type: "challenge",
      title: c.title || "Tantangan Harian",
      subject: c.subject?.name,
      score: c.status === "COMPLETED" ? 100 : 0,
    });
  }

  const attemptsByDate = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const dateKey = a.createdAt.toISOString().split("T")[0];
    const existing = attemptsByDate.get(dateKey) || { correct: 0, total: 0 };
    existing.total++;
    if (a.isCorrect) existing.correct++;
    attemptsByDate.set(dateKey, existing);
  }

  for (const [date, stats] of attemptsByDate) {
    history.push({
      id: `practice-${date}`,
      date,
      type: "practice",
      title: `Latihan Soal (${stats.correct}/${stats.total} benar)`,
      score: Math.round((stats.correct / stats.total) * 100),
    });
  }

  for (const chat of chatSessions) {
    history.push({
      id: `chat-${chat.id}`,
      date: chat.createdAt.toISOString(),
      type: "chat",
      title: chat.title || "Sesi Chat",
      subject: chat.subject?.name,
    });
  }

  for (const m of materials) {
    history.push({
      id: `material-${m.id}`,
      date: m.readAt.toISOString(),
      type: "material",
      title: m.material.title,
      subject: m.material.subject?.name,
      duration: m.readSeconds,
    });
  }

  history.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    ok: true,
    children: links.map((l) => ({ id: l.student.id, name: l.student.name })),
    activeChild: { id: activeLink.student.id, name: activeLink.student.name },
    history: history.slice(0, 100),
  };
}

const TIP_POLL_INTERVAL_MS = 800;
const TIP_POLL_MAX_ATTEMPTS = 8;

function parentTipFallback(studentName: string): string {
  return `
• **Ajak Ngobrol Santai**: Tanyakan kepada ${studentName} pelajaran apa yang paling menarik hari ini tanpa memberi tekanan ujian.
• **Fokus pada Usaha, Bukan Hasil**: Berikan apresiasi pada konsistensi belajar harian ${studentName} dan bantu dia merasa nyaman jika menemui soal yang sulit.
• **Ciptakan Ruang Kondusif**: Sediakan tempat belajar yang tenang dan bebas gangguan agar ${studentName} bisa lebih fokus menyelesaikan misi belajarnya.
`.trim();
}

/** Wait for another request that claimed the generation slot to finish writing. */
async function waitForTipContent(
  studentId: string,
  forDate: string,
  studentName: string,
): Promise<string> {
  for (let i = 0; i < TIP_POLL_MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, TIP_POLL_INTERVAL_MS));
    const entry = await prisma.parentTipCache.findUnique({
      where: { studentId_forDate: { studentId, forDate } },
    });
    if (entry?.content) return entry.content;
  }
  // Timed out — return fallback
  return parentTipFallback(studentName);
}

/** Generate AI tip and persist to cache. */
async function generateAndCacheTip(
  studentId: string,
  studentName: string,
  forDate: string,
  subjects: Array<{ name: string; masteryPct: number }>,
  struggling: Array<{
    concept: {
      name: string;
      topic: { subject: { name: string } };
    };
  }>,
): Promise<string> {
  const subjectsList = subjects
    .map((s) => `${s.name} (${s.masteryPct}% dikuasai)`)
    .join(", ");
  const strugglingList = struggling
    .map(
      (s) =>
        `'${s.concept.name}' (pelajaran ${s.concept.topic.subject.name})`,
    )
    .join(", ");

  const systemPrompt =
    "Anda adalah Spark, AI konsultan pendidikan anak untuk orang tua. Berikan rekomendasi dukungan belajar yang hangat, ramah, dan positif.";
  const userPrompt = `
Nama anak: ${studentName}
Mata pelajaran saat ini: ${subjectsList || "Belum ada mapel terpilih"}
Konsep yang sedang dihadapi kesulitan: ${strugglingList || "Tidak ada kesulitan signifikan saat ini"}

Berikan 3 poin rekomendasi dukungan yang konkret, santun, dan positif bagi orang tua untuk mendampingi anak dalam belajar. Pastikan nada bicaranya optimis, tidak menyalahkan anak, dan fokus pada kolaborasi/dukungan psikologis orang tua. Format output langsung berupa 3 paragraf pendek dengan bullet points.
`;

  try {
    const aiRes = await generateText({
      model: "fast",
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });
    const content = aiRes.text.trim();

    await prisma.parentTipCache.update({
      where: { studentId_forDate: { studentId, forDate } },
      data: { content },
    });

    return content;
  } catch (err) {
    console.error("Gagal generate AI parent tips:", err);
    const fallback = parentTipFallback(studentName);
    // Persist fallback so other concurrent requests also get it
    await prisma.parentTipCache.update({
      where: { studentId_forDate: { studentId, forDate } },
      data: { content: fallback },
    });
    return fallback;
  }
}

export async function getParentDashboardData(activeStudentId?: string) {
  const session = await getSession();
  if (!session?.id) {
    return { ok: false, error: "UNAUTHORIZED" };
  }
  if (session.role !== "PARENT") {
    return { ok: false, error: "FORBIDDEN" };
  }

  const parentId = session.id;

  // 1. Fetch all linked children (ACCEPTED)
  const links = await prisma.parentStudentLink.findMany({
    where: {
      parentId,
      status: "ACCEPTED",
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (links.length === 0) {
    return {
      ok: true,
      children: [],
      activeChild: null,
      summary: null,
      timeline: null,
      alerts: [],
      aiRecommendation: null,
    };
  }

  // 2. Select active child
  let activeLink = links[0];
  if (activeStudentId) {
    const found = links.find((l) => l.studentId === activeStudentId);
    if (found) {
      activeLink = found;
    }
  }

  const studentId = activeLink.studentId;
  const studentName = activeLink.student.name ?? "Anak";

  // 3. Fetch dashboard summary & progress timeline for active child
  const [summary, timeline, _levels] = await Promise.all([
    getDashboardSummary(studentId),
    getProgressTimeline(studentId, 7),
    prisma.level.findMany({
      orderBy: { level: "asc" },
      select: { level: true, name: true, minXp: true },
    }),
  ]);

  // 4. Fetch struggling concepts
  const struggling = await prisma.studentKnowledgeProfile.findMany({
    where: {
      userId: studentId,
      masteryScore: { lt: 0.7 },
    },
    include: {
      concept: {
        select: {
          id: true,
          name: true,
          topic: {
            select: {
              name: true,
              subject: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { masteryScore: "asc" },
    take: 5,
  });

  // 5. Generate notifications / alerts
  const alerts: ParentAlert[] = [];

  // Inactivity check: Check last activity date
  const streak = await prisma.streak.findUnique({
    where: { userId: studentId },
    select: { updatedAt: true, currentStreak: true },
  });

  const now = new Date();
  const lastActive = streak?.updatedAt ? new Date(streak.updatedAt) : null;
  const inactiveDays = lastActive
    ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    : 7; // default to a week if no activity record

  if (
    inactiveDays >= 2 ||
    (streak && streak.currentStreak === 0 && inactiveDays >= 1)
  ) {
    alerts.push({
      id: "inactivity-alert",
      type: "inactivity",
      title: "Pengingat Keaktifan Belajar",
      message: `💡 Pengingat Santai: ${studentName} sudah ${inactiveDays > 0 ? `${inactiveDays} hari` : "beberapa waktu"} belum belajar nih. Yuk, kasih semangat hangat atau ajak ngobrol ringan tentang apa yang sedang dipelajarinya!`,
      severity: "warning",
    });
  }

  // Struggle concept checks
  if (struggling.length > 0) {
    for (const s of struggling.slice(0, 2)) {
      const subjectName = s.concept.topic.subject.name;
      alerts.push({
        id: `struggle-${s.conceptId}`,
        type: "struggle",
        title: "Dukungan Belajar Dibutuhkan",
        message: `💪 Dukungan Belajar: ${studentName} sedang berusaha keras memahami konsep '${s.concept.name}' di pelajaran ${subjectName}. Bunda/Ayah bisa bantu dengan menanyakan apakah ada bagian yang membingungkan atau belajar santai bersama.`,
        severity: "info",
      });
    }
  }

  // If no warning/struggle alerts, push a positive reinforcement alert
  if (alerts.length === 0) {
    alerts.push({
      id: "positive-reinforcement",
      type: "info",
      title: "Perkembangan Bagus!",
      message: `🎉 Keren! ${studentName} konsisten belajar minggu ini dengan streak ${summary.streak.current} hari. Berikan pujian kecil atas usahanya hari ini ya!`,
      severity: "info",
    });
  }

  // 5. Generate AI recommendation (race-condition-safe via DB claim)
  const today = getLocalDateKey();
  let aiRecommendation = "";

  const cachedTip = await prisma.parentTipCache.findUnique({
    where: { studentId_forDate: { studentId, forDate: today } },
  });

  if (cachedTip && cachedTip.content) {
    // Cache hit with real content
    aiRecommendation = cachedTip.content;
  } else if (cachedTip) {
    // Another request already claimed (empty content) — wait & re-read
    aiRecommendation = await waitForTipContent(studentId, today, studentName);
  } else {
    // No entry yet — try to claim the generation slot
    try {
      await prisma.parentTipCache.create({
        data: { studentId, forDate: today, content: "" },
      });

      // We won the race — generate AI
      aiRecommendation = await generateAndCacheTip(
        studentId,
        studentName,
        today,
        summary.subjects,
        struggling,
      );
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        // Unique constraint hit — another request claimed it first
        aiRecommendation = await waitForTipContent(
          studentId,
          today,
          studentName,
        );
      } else {
        console.error("Gagal generate AI parent tips:", err);
        aiRecommendation = parentTipFallback(studentName);
      }
    }
  }

  return {
    ok: true,
    children: links.map((l) => ({
      id: l.student.id,
      name: l.student.name,
      email: l.student.email,
    })),
    activeChild: {
      id: activeLink.student.id,
      name: activeLink.student.name,
      email: activeLink.student.email,
    },
    summary,
    timeline,
    alerts,
    strugglingConcepts: struggling.map((s) => ({
      id: s.conceptId,
      name: s.concept.name,
      subjectName: s.concept.topic.subject.name,
      masteryScore: s.masteryScore,
    })),
    aiRecommendation,
  };
}


