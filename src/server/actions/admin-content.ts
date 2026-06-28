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
  action:
    | "CONTENT_CREATE"
    | "CONTENT_UPDATE"
    | "CONTENT_DELETE"
    | "CUSTOM_SUBJECT_APPROVE"
    | "CUSTOM_SUBJECT_REJECT",
  targetType: string,
  targetId: string,
  note?: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      note,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

// ============================================================================
// SUBJECTS
// ============================================================================

export type AdminSubjectListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  isCustom: boolean;
  isActive: boolean;
  isVerified: boolean;
  source: string;
  topicCount: number;
  conceptCount: number;
  questionCount: number;
  createdBy: { id: string; name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
};

export async function listAllSubjects(input: {
  search?: string;
  includeInactive?: boolean;
  includeUnverified?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ items: AdminSubjectListItem[]; total: number }> {
  await requireAdmin();
  const limit = input.limit ?? 50;
  const offset = input.offset ?? 0;

  const where: Prisma.SubjectWhereInput = {};
  if (!input.includeInactive) where.isActive = true;
  if (!input.includeUnverified) where.isVerified = true;
  if (input.search) {
    where.OR = [{ name: { contains: input.search, mode: "insensitive" } }];
  }

  const [rows, total] = await Promise.all([
    prisma.subject.findMany({
      where,
      orderBy: [{ order: "asc" }, { name: "asc" }],
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
  const allSubjectIds = rows.map((s) => s.id);
  const topicsInSubjects = await prisma.topic.findMany({
    where: { subjectId: { in: allSubjectIds } },
    select: { id: true, subjectId: true },
  });
  const topicIdsBySubject = new Map<string, string[]>();
  for (const t of topicsInSubjects) {
    const arr = topicIdsBySubject.get(t.subjectId) ?? [];
    arr.push(t.id);
    topicIdsBySubject.set(t.subjectId, arr);
  }
  const allTopicIds = topicsInSubjects.map((t) => t.id);

  const [conceptCounts, questionCounts, conceptsForMapping] = await Promise.all(
    [
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
      prisma.concept.findMany({
        where: { topicId: { in: allTopicIds } },
        select: { id: true, topicId: true },
      }),
    ],
  );

  const conceptCountByTopic = new Map<string, number>();
  for (const c of conceptCounts) {
    conceptCountByTopic.set(c.topicId, c._count._all);
  }

  const questionCountByConcept = new Map<string, number>();
  for (const q of questionCounts) {
    questionCountByConcept.set(q.conceptId, q._count._all);
  }
  const questionCountByTopic = new Map<string, number>();
  for (const c of conceptsForMapping) {
    const qCount = questionCountByConcept.get(c.id) ?? 0;
    questionCountByTopic.set(
      c.topicId,
      (questionCountByTopic.get(c.topicId) ?? 0) + qCount,
    );
  }

  const items: AdminSubjectListItem[] = rows.map((s) => {
    const tIds = topicIdsBySubject.get(s.id) ?? [];
    let conceptCount = 0;
    let questionCount = 0;
    for (const tId of tIds) {
      conceptCount += conceptCountByTopic.get(tId) ?? 0;
      questionCount += questionCountByTopic.get(tId) ?? 0;
    }
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      icon: s.icon,
      color: s.color,
      order: s.order,
      isCustom: s.isCustom,
      isActive: s.isActive,
      isVerified: s.isVerified,
      source: s.source,
      topicCount: s._count.topics,
      conceptCount,
      questionCount,
      createdBy: s.createdBy
        ? {
            id: s.createdBy.id,
            name: s.createdBy.name,
            email: s.createdBy.email,
          }
        : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  });

  return { items, total };
}

export type AdminSubjectDetail = AdminSubjectListItem & {
  topics: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    order: number;
    isCustom: boolean;
    conceptCount: number;
    questionCount: number;
  }>;
};

export async function getAdminSubjectDetail(
  subjectId: string,
): Promise<AdminSubjectDetail | null> {
  await requireAdmin();
  const s = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { topics: true } },
      topics: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { concepts: true } },
        },
      },
    },
  });
  if (!s) return null;

  const topicIds = s.topics.map((t) => t.id);
  // Batch query: per-topic question count
  const [conceptCount, questionCounts, conceptsForMapping] = await Promise.all([
    prisma.concept.count({ where: { topicId: { in: topicIds } } }),
    prisma.question.groupBy({
      by: ["conceptId"],
      where: { concept: { topicId: { in: topicIds } } },
      _count: { _all: true },
    }),
    prisma.concept.findMany({
      where: { topicId: { in: topicIds } },
      select: { id: true, topicId: true },
    }),
  ]);

  const questionCountByConcept = new Map(
    questionCounts.map((q) => [q.conceptId, q._count._all]),
  );
  const conceptQuestionByTopic = new Map<string, number>();
  for (const c of conceptsForMapping) {
    const qCount = questionCountByConcept.get(c.id) ?? 0;
    conceptQuestionByTopic.set(
      c.topicId,
      (conceptQuestionByTopic.get(c.topicId) ?? 0) + qCount,
    );
  }

  // Total question count across all topics
  const questionCount = [...conceptQuestionByTopic.values()].reduce(
    (sum, n) => sum + n,
    0,
  );

  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    icon: s.icon,
    color: s.color,
    order: s.order,
    isCustom: s.isCustom,
    isActive: s.isActive,
    isVerified: s.isVerified,
    source: s.source,
    topicCount: s._count.topics,
    conceptCount,
    questionCount,
    createdBy: s.createdBy
      ? {
          id: s.createdBy.id,
          name: s.createdBy.name,
          email: s.createdBy.email,
        }
      : null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    topics: s.topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      description: t.description,
      order: t.order,
      isCustom: t.isCustom,
      conceptCount: t._count.concepts,
      questionCount: conceptQuestionByTopic.get(t.id) ?? 0,
    })),
  };
}

const createSubjectSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z_]+$/, "slug harus lowercase + underscore"),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(10).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "color harus hex seperti #3b82f6")
    .optional()
    .nullable(),
  order: z.coerce.number().int().min(0).max(999).default(0),
  isCustom: z.boolean().default(false),
  source: z
    .enum(["OFFICIAL", "AI_GENERATED", "USER_CREATED"])
    .default("OFFICIAL"),
  isVerified: z.boolean().default(true),
});

export async function createSubject(
  input: z.infer<typeof createSubjectSchema>,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const adminId = await requireAdmin();
  const parsed = createSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }
  // Check slug uniqueness
  const existing = await prisma.subject.findUnique({
    where: { slug: parsed.data.slug as Prisma.SubjectWhereUniqueInput["slug"] },
  });
  if (existing) {
    return { ok: false, error: "Slug sudah dipakai mapel lain" };
  }
  const subject = await prisma.subject.create({
    data: {
      slug: parsed.data.slug as Prisma.SubjectCreateInput["slug"],
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      icon: parsed.data.icon ?? null,
      color: parsed.data.color ?? null,
      order: parsed.data.order,
      isCustom: parsed.data.isCustom,
      source: parsed.data.source,
      isVerified: parsed.data.isVerified,
    },
  });
  await logAdminAction(
    adminId,
    "CONTENT_CREATE",
    "Subject",
    subject.id,
    undefined,
    {
      action: "create",
      slug: subject.slug,
    },
  );
  revalidatePath("/admin/subjects");
  return { ok: true, id: subject.id };
}

const updateSubjectSchema = z.object({
  subjectId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(10).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export async function updateSubject(
  input: z.infer<typeof updateSubjectSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const adminId = await requireAdmin();
  const parsed = updateSubjectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }
  const { subjectId, ...data } = parsed.data;
  const existing = await prisma.subject.findUnique({
    where: { id: subjectId },
  });
  if (!existing) return { ok: false, error: "Mapel tidak ditemukan" };

  // Remove undefined values
  const updateData: Prisma.SubjectUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.order !== undefined) updateData.order = data.order;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

  await prisma.$transaction(async (tx) => {
    await tx.subject.update({ where: { id: subjectId }, data: updateData });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "CONTENT_UPDATE",
        targetType: "Subject",
        targetId: subjectId,
        metadata: {
          action: "update",
          changes: Object.keys(updateData),
        } as Prisma.InputJsonValue,
      },
    });
  });
  revalidatePath("/admin/subjects");
  revalidatePath(`/admin/subjects/${subjectId}`);
  return { ok: true };
}

// ============================================================================
// TOPICS
// ============================================================================

const createTopicSchema = z.object({
  subjectId: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  order: z.coerce.number().int().min(0).max(999).default(0),
});

export async function createTopic(
  input: z.infer<typeof createTopicSchema>,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const adminId = await requireAdmin();
  const parsed = createTopicSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }
  const subject = await prisma.subject.findUnique({
    where: { id: parsed.data.subjectId },
  });
  if (!subject) return { ok: false, error: "Mapel tidak ditemukan" };
  // Check slug uniqueness within subject
  const existing = await prisma.topic.findFirst({
    where: { subjectId: parsed.data.subjectId, slug: parsed.data.slug },
  });
  if (existing) {
    return { ok: false, error: "Slug sudah dipakai topik lain di mapel ini" };
  }
  const topic = await prisma.topic.create({
    data: {
      subjectId: parsed.data.subjectId,
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      order: parsed.data.order,
    },
  });
  await logAdminAction(
    adminId,
    "CONTENT_CREATE",
    "Topic",
    topic.id,
    undefined,
    {
      action: "create",
      subjectId: parsed.data.subjectId,
    },
  );
  revalidatePath(`/admin/subjects/${parsed.data.subjectId}`);
  return { ok: true, id: topic.id };
}

const updateTopicSchema = z.object({
  topicId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
});

export async function updateTopic(
  input: z.infer<typeof updateTopicSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const adminId = await requireAdmin();
  const parsed = updateTopicSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }
  const { topicId, ...data } = parsed.data;
  const existing = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!existing) return { ok: false, error: "Topik tidak ditemukan" };

  const updateData: Prisma.TopicUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.order !== undefined) updateData.order = data.order;

  await prisma.$transaction(async (tx) => {
    await tx.topic.update({ where: { id: topicId }, data: updateData });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "CONTENT_UPDATE",
        targetType: "Topic",
        targetId: topicId,
        metadata: {
          action: "update",
          changes: Object.keys(updateData),
        } as Prisma.InputJsonValue,
      },
    });
  });
  revalidatePath(`/admin/subjects/${existing.subjectId}`);
  return { ok: true };
}

// ============================================================================
// CONCEPTS
// ============================================================================

const createConceptSchema = z.object({
  topicId: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_-]+$/),
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional().nullable(),
  order: z.coerce.number().int().min(0).max(999).default(0),
});

export async function createConcept(
  input: z.infer<typeof createConceptSchema>,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const adminId = await requireAdmin();
  const parsed = createConceptSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }
  const topic = await prisma.topic.findUnique({
    where: { id: parsed.data.topicId },
  });
  if (!topic) return { ok: false, error: "Topik tidak ditemukan" };
  const existing = await prisma.concept.findFirst({
    where: { topicId: parsed.data.topicId, slug: parsed.data.slug },
  });
  if (existing) {
    return { ok: false, error: "Slug sudah dipakai konsep lain di topik ini" };
  }
  const concept = await prisma.concept.create({
    data: {
      topicId: parsed.data.topicId,
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      order: parsed.data.order,
    },
  });
  await logAdminAction(
    adminId,
    "CONTENT_CREATE",
    "Concept",
    concept.id,
    undefined,
    { action: "create", topicId: parsed.data.topicId },
  );
  revalidatePath(`/admin/subjects/${topic.subjectId}`);
  return { ok: true, id: concept.id };
}

const updateConceptSchema = z.object({
  conceptId: z.string().min(1),
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(500).nullable().optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
});

export async function updateConcept(
  input: z.infer<typeof updateConceptSchema>,
): Promise<{ ok: boolean; error?: string }> {
  const adminId = await requireAdmin();
  const parsed = updateConceptSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Input tidak valid",
    };
  }
  const { conceptId, ...data } = parsed.data;
  const existing = await prisma.concept.findUnique({
    where: { id: conceptId },
    include: { topic: { select: { subjectId: true } } },
  });
  if (!existing) return { ok: false, error: "Konsep tidak ditemukan" };

  const updateData: Prisma.ConceptUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.order !== undefined) updateData.order = data.order;

  await prisma.$transaction(async (tx) => {
    await tx.concept.update({ where: { id: conceptId }, data: updateData });
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: "CONTENT_UPDATE",
        targetType: "Concept",
        targetId: conceptId,
        metadata: {
          action: "update",
          changes: Object.keys(updateData),
        } as Prisma.InputJsonValue,
      },
    });
  });
  revalidatePath(`/admin/subjects/${existing.topic.subjectId}`);
  return { ok: true };
}
