"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.id) throw new Error("UNAUTHORIZED");
  if (session.role !== "ADMIN") throw new Error("FORBIDDEN");
  return session.id;
}

async function logAdminAction(
  adminId: string,
  action: "CUSTOM_SUBJECT_APPROVE" | "CUSTOM_SUBJECT_REJECT",
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>,
  note?: string,
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      note,
    },
  });
}

// ============================================================================
// Stats (admin dashboard overview)
// ============================================================================

export type AdminStats = {
  totalUsers: number;
  totalStudents: number;
  totalParents: number;
  totalAdmins: number;
  activeUsers: number;
  pendingCustomSubjects: number;
  verifiedCustomSubjects: number;
  totalSubjects: number;
  totalQuestions: number;
  totalDocuments: number;
  totalChallengesToday: number;
  totalMaterials: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const [
    totalUsers,
    totalStudents,
    totalParents,
    totalAdmins,
    activeUsers,
    pendingCustomSubjects,
    verifiedCustomSubjects,
    totalSubjects,
    totalQuestions,
    totalDocuments,
    totalChallengesToday,
    totalMaterials,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.subject.count({
      where: { isCustom: true, isVerified: false, isActive: true },
    }),
    prisma.subject.count({
      where: { isCustom: true, isVerified: true, isActive: true },
    }),
    prisma.subject.count(),
    prisma.question.count({ where: { isActive: true } }),
    prisma.document.count(),
    prisma.challenge.count({
      where: { scheduledFor: { gte: today, lt: tomorrow } },
    }),
    prisma.material.count(),
  ]);

  return {
    totalUsers,
    totalStudents,
    totalParents,
    totalAdmins,
    activeUsers,
    pendingCustomSubjects,
    verifiedCustomSubjects,
    totalSubjects,
    totalQuestions,
    totalDocuments,
    totalChallengesToday,
    totalMaterials,
  };
}

// ============================================================================
// Custom Subject Review
// ============================================================================

export type CustomSubjectListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  topicCount: number;
  conceptCount: number;
  pretestQuestionCount: number;
};

export type CustomSubjectFilter = "pending" | "verified" | "rejected" | "all";

export async function listCustomSubjects(input: {
  filter?: CustomSubjectFilter;
  limit?: number;
  offset?: number;
}): Promise<{ items: CustomSubjectListItem[]; total: number }> {
  await requireAdmin();
  const filter = input.filter ?? "pending";
  const limit = input.limit ?? 20;
  const offset = input.offset ?? 0;

  const where: Prisma.SubjectWhereInput = { isCustom: true };
  if (filter === "pending") {
    where.isVerified = false;
    where.isActive = true;
  } else if (filter === "verified") {
    where.isVerified = true;
    where.isActive = true;
  } else if (filter === "rejected") {
    where.isActive = false;
  }

  const [rows, total] = await Promise.all([
    prisma.subject.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { topics: true } },
      },
    }),
    prisma.subject.count({ where }),
  ]);

  // Batch query: count concepts & questions per subject via topic grouping
  const subjectIds = rows.map((r) => r.id);
  const topicsWithSubjects = await prisma.topic.findMany({
    where: { subjectId: { in: subjectIds } },
    select: { id: true, subjectId: true },
  });
  const topicIdsBySubject = new Map<string, string[]>();
  for (const t of topicsWithSubjects) {
    const arr = topicIdsBySubject.get(t.subjectId) ?? [];
    arr.push(t.id);
    topicIdsBySubject.set(t.subjectId, arr);
  }
  const allTopicIds = topicsWithSubjects.map((t) => t.id);

  const [conceptCounts, questionCounts] = await Promise.all([
    prisma.concept.groupBy({
      by: ["topicId"],
      where: { topicId: { in: allTopicIds } },
      _count: { _all: true },
    }),
    prisma.question.groupBy({
      by: ["conceptId"],
      where: { concept: { topicId: { in: allTopicIds } } },
      _count: { _all: true },
    }),
  ]);

  // Map conceptCount by topicId
  const conceptCountByTopic = new Map<string, number>();
  for (const c of conceptCounts) {
    conceptCountByTopic.set(c.topicId, c._count._all);
  }

  // Map questionCount by conceptId, then aggregate per topic
  const questionCountByConcept = new Map<string, number>();
  for (const q of questionCounts) {
    questionCountByConcept.set(q.conceptId, q._count._all);
  }
  // Need concept->topic mapping for question aggregation
  const conceptsForMapping = await prisma.concept.findMany({
    where: { topicId: { in: allTopicIds } },
    select: { id: true, topicId: true },
  });
  const questionCountByTopic = new Map<string, number>();
  for (const c of conceptsForMapping) {
    const qCount = questionCountByConcept.get(c.id) ?? 0;
    questionCountByTopic.set(
      c.topicId,
      (questionCountByTopic.get(c.topicId) ?? 0) + qCount,
    );
  }

  // Aggregate per subject
  const statsMap = new Map<
    string,
    { conceptCount: number; pretestCount: number }
  >();
  for (const s of rows) {
    const tIds = topicIdsBySubject.get(s.id) ?? [];
    let conceptCount = 0;
    let pretestCount = 0;
    for (const tId of tIds) {
      conceptCount += conceptCountByTopic.get(tId) ?? 0;
      pretestCount += questionCountByTopic.get(tId) ?? 0;
    }
    statsMap.set(s.id, { conceptCount, pretestCount });
  }

  const items: CustomSubjectListItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    icon: r.icon,
    color: r.color,
    isVerified: r.isVerified,
    isActive: r.isActive,
    createdBy: r.createdBy
      ? {
          id: r.createdBy.id,
          name: r.createdBy.name,
          email: r.createdBy.email,
        }
      : null,
    createdAt: r.createdAt.toISOString(),
    topicCount: r._count.topics,
    conceptCount: statsMap.get(r.id)?.conceptCount ?? 0,
    pretestQuestionCount: statsMap.get(r.id)?.pretestCount ?? 0,
  }));

  return { items, total };
}

export type CustomSubjectDetail = CustomSubjectListItem & {
  topics: Array<{
    id: string;
    name: string;
    description: string | null;
    slug: string;
    conceptCount: number;
    concepts: Array<{
      id: string;
      name: string;
      description: string | null;
      questionCount: number;
    }>;
  }>;
};

export async function getCustomSubjectDetail(
  subjectId: string,
): Promise<CustomSubjectDetail | null> {
  await requireAdmin();

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      topics: {
        orderBy: { order: "asc" },
        include: {
          concepts: {
            orderBy: { order: "asc" },
            include: {
              _count: { select: { questions: true } },
            },
          },
        },
      },
    },
  });

  if (!subject) return null;

  const allTopicIds = subject.topics.map((t) => t.id);
  const [conceptCount, pretestCount] = await Promise.all([
    prisma.concept.count({ where: { topicId: { in: allTopicIds } } }),
    prisma.question.count({
      where: { concept: { topicId: { in: allTopicIds } } },
    }),
  ]);

  return {
    id: subject.id,
    name: subject.name,
    slug: subject.slug,
    description: subject.description,
    icon: subject.icon,
    color: subject.color,
    isVerified: subject.isVerified,
    isActive: subject.isActive,
    createdBy: subject.createdBy
      ? {
          id: subject.createdBy.id,
          name: subject.createdBy.name,
          email: subject.createdBy.email,
        }
      : null,
    createdAt: subject.createdAt.toISOString(),
    topicCount: subject.topics.length,
    conceptCount,
    pretestQuestionCount: pretestCount,
    topics: subject.topics.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      slug: t.slug,
      conceptCount: t.concepts.length,
      concepts: t.concepts.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        questionCount: c._count.questions,
      })),
    })),
  };
}

const verifySchema = z.object({
  subjectId: z.string().min(1),
  note: z.string().max(1000).optional(),
});

const rejectSchema = z.object({
  subjectId: z.string().min(1),
  reason: z.string().min(3).max(500),
});

/**
 * Approve a custom subject.
 * Per spec §4.6.6.8: TETAP `isCustom: true`, JANGAN promote ke global.
 * Set `isVerified: true` only. Subject tetap di section "Custom + AI"
 * tapi dapat badge "Verified" dan bisa dishare ke siswa lain.
 */
export async function approveCustomSubject(
  input: z.infer<typeof verifySchema>,
): Promise<{ ok: boolean; error?: string }> {
  const adminId = await requireAdmin();
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Input tidak valid" };
  }

  const subject = await prisma.subject.findUnique({
    where: { id: parsed.data.subjectId },
    select: { id: true, isCustom: true, isVerified: true, isActive: true },
  });
  if (!subject) return { ok: false, error: "Mapel tidak ditemukan" };
  if (!subject.isCustom) {
    return { ok: false, error: "Mapel nasional tidak perlu di-approve" };
  }
  if (subject.isVerified) {
    return { ok: false, error: "Mapel sudah diverifikasi" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.subject.update({
      where: { id: parsed.data.subjectId },
      data: { isVerified: true },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "CUSTOM_SUBJECT_APPROVE",
        targetType: "Subject",
        targetId: parsed.data.subjectId,
        note: parsed.data.note,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/custom-subjects");
  return { ok: true };
}

/**
 * Reject a custom subject.
 * Per spec §4.6.6.8: Reject = soft delete (set `isActive: false`)
 * Subject disembunyikan dari siswa tapi data tetap ada untuk audit.
 */
export async function rejectCustomSubject(
  input: z.infer<typeof rejectSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const adminId = await requireAdmin();
  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }

  const subject = await prisma.subject.findUnique({
    where: { id: parsed.data.subjectId },
    select: { id: true, isCustom: true, isActive: true },
  });
  if (!subject) return { ok: false, error: "Mapel tidak ditemukan" };
  if (!subject.isCustom) {
    return { ok: false, error: "Mapel nasional tidak bisa di-reject" };
  }
  if (!subject.isActive) {
    return { ok: false, error: "Mapel sudah di-reject" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.subject.update({
      where: { id: parsed.data.subjectId },
      data: { isActive: false },
    });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "CUSTOM_SUBJECT_REJECT",
        targetType: "Subject",
        targetId: parsed.data.subjectId,
        note: parsed.data.reason,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/custom-subjects");
  return { ok: true };
}
