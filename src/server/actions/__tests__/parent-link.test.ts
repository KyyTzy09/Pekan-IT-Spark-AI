import { vi } from "vitest";

// Hoist mock variables so they're available in vi.mock factories
const { mockRedirect } = vi.hoisted(() => ({
  mockRedirect: vi.fn(),
}));

// Mock server-only at the very top before any imports
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

import { describe, expect, it, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));



// Mock dependencies
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    parentStudentLink: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    streak: {
      findUnique: vi.fn(),
    },
    studentKnowledgeProfile: {
      findMany: vi.fn(),
    },
    parentTipCache: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    level: {
      findMany: vi.fn(),
    },
    challenge: {
      findMany: vi.fn(),
    },
    questionAttempt: {
      findMany: vi.fn(),
    },
    chatSession: {
      findMany: vi.fn(),
    },
    materialRead: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/server/actions/dashboard", () => ({
  getDashboardSummary: vi.fn(),
}));

vi.mock("@/server/actions/challenges", () => ({
  getProgressTimeline: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  generateText: vi.fn(),
}));

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDashboardSummary } from "@/server/actions/dashboard";
import { getProgressTimeline } from "@/server/actions/challenges";
import { generateText } from "@/lib/ai";
import {
  generateInvite,
  linkChildWithCode,
  revokeInvite,
  getActiveInvite,
  listInvites,
} from "@/server/actions/invite";
import {
  getParentDashboardData,
  getParentHistoryData,
} from "@/server/actions/parent";

describe("Invite & Link Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const studentSession = { id: "student-1", role: "STUDENT" };
  const parentSession = { id: "parent-1", role: "PARENT" };

  describe("generateInvite", () => {
    it("should redirect unauthenticated user", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      mockRedirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

      await expect(generateInvite()).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/auth/login");
    });

    it("should redirect non-student role", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      mockRedirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

      await expect(generateInvite()).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });

    it("should return existing active invite if one exists", async () => {
      vi.mocked(getSession).mockResolvedValue(studentSession as any);
      vi.mocked(prisma.parentStudentLink.findFirst).mockResolvedValue({
        id: "link-1",
        inviteCode: "ABC12345",
        expiresAt: new Date("2099-01-01"),
        status: "PENDING",
      } as any);

      const result = await generateInvite();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.inviteCode).toBe("ABC12345");
      }
      // Should NOT create a new link
      expect(prisma.parentStudentLink.create).not.toHaveBeenCalled();
    });

    it("should create new invite when no active invite exists", async () => {
      vi.mocked(getSession).mockResolvedValue(studentSession as any);
      vi.mocked(prisma.parentStudentLink.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.parentStudentLink.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.parentStudentLink.create).mockResolvedValue({
        id: "link-new",
        inviteCode: "XYZ98765",
        expiresAt: new Date("2099-01-08"),
      } as any);

      const result = await generateInvite();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.inviteCode).toBe("XYZ98765");
      }
      expect(prisma.parentStudentLink.create).toHaveBeenCalled();
      const createCall = vi.mocked(prisma.parentStudentLink.create).mock.calls[0][0];
      expect(createCall.data.studentId).toBe("student-1");
      expect(createCall.data.status).toBe("PENDING");
    });
  });

  describe("linkChildWithCode", () => {
    it("should redirect unauthenticated user", async () => {
      vi.mocked(getSession).mockResolvedValue(null);
      mockRedirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

      await expect(linkChildWithCode({ inviteCode: "ABC12345" })).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/auth/login");
    });

    it("should redirect non-parent role", async () => {
      vi.mocked(getSession).mockResolvedValue(studentSession as any);
      mockRedirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });

      await expect(linkChildWithCode({ inviteCode: "ABC12345" })).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });

    it("should reject invalid invite code format", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);

      const result = await linkChildWithCode({ inviteCode: "AB" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("minimal 4 karakter");
      }
    });

    it("should reject non-existent invite code", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findUnique).mockResolvedValue(null);

      const result = await linkChildWithCode({ inviteCode: "XXXX9999" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("nggak ketemu");
      }
    });

    it("should reject already accepted invite code", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findUnique).mockResolvedValue({
        id: "link-1",
        inviteCode: "ABC12345",
        status: "ACCEPTED",
        expiresAt: new Date("2099-01-01"),
        student: { id: "student-1", name: "Budi" },
      } as any);

      const result = await linkChildWithCode({ inviteCode: "ABC12345" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("udah dipakai");
      }
    });

    it("should reject expired invite code", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findUnique).mockResolvedValue({
        id: "link-1",
        inviteCode: "ABC12345",
        status: "PENDING",
        expiresAt: new Date("2020-01-01"), // expired
        student: { id: "student-1", name: "Budi" },
      } as any);

      const result = await linkChildWithCode({ inviteCode: "ABC12345" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("kedaluwarsa");
      }
    });

    it("should reject if parent already linked to this student", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findUnique).mockResolvedValue({
        id: "link-1",
        inviteCode: "ABC12345",
        status: "PENDING",
        expiresAt: new Date("2099-01-01"),
        student: { id: "student-1", name: "Budi" },
      } as any);
      vi.mocked(prisma.parentStudentLink.findFirst).mockResolvedValue({
        id: "existing-link",
        status: "ACCEPTED",
      } as any);

      const result = await linkChildWithCode({ inviteCode: "ABC12345" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toContain("udah terhubung");
      }
    });

    it("should successfully link parent to student", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findUnique).mockResolvedValue({
        id: "link-1",
        inviteCode: "ABC12345",
        status: "PENDING",
        expiresAt: new Date("2099-01-01"),
        student: { id: "student-1", name: "Budi" },
      } as any);
      vi.mocked(prisma.parentStudentLink.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.parentStudentLink.update).mockResolvedValue({} as any);

      const result = await linkChildWithCode({ inviteCode: "ABC12345" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.studentName).toBe("Budi");
      }
      expect(prisma.parentStudentLink.update).toHaveBeenCalledWith({
        where: { id: "link-1" },
        data: {
          status: "ACCEPTED",
          parentId: "parent-1",
        },
      });
    });

    it("should uppercase invite code before lookup", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findUnique).mockResolvedValue(null);

      await linkChildWithCode({ inviteCode: "abc12345" });

      expect(prisma.parentStudentLink.findUnique).toHaveBeenCalledWith({
        where: { inviteCode: "ABC12345" },
        include: { student: { select: { id: true, name: true } } },
      });
    });
  });

  describe("revokeInvite", () => {
    it("should revoke pending invites for student", async () => {
      vi.mocked(getSession).mockResolvedValue(studentSession as any);
      vi.mocked(prisma.parentStudentLink.updateMany).mockResolvedValue({
        count: 1,
      } as any);

      const result = await revokeInvite();

      expect(result.ok).toBe(true);
      expect(prisma.parentStudentLink.updateMany).toHaveBeenCalledWith({
        where: {
          studentId: "student-1",
          status: "PENDING",
        },
        data: { expiresAt: expect.any(Date) },
      });
    });
  });

  describe("getActiveInvite", () => {
    it("should return null when no active invite exists", async () => {
      vi.mocked(getSession).mockResolvedValue(studentSession as any);
      vi.mocked(prisma.parentStudentLink.findFirst).mockResolvedValue(null);

      const result = await getActiveInvite();

      expect(result).toBeNull();
    });

    it("should return active invite when one exists", async () => {
      vi.mocked(getSession).mockResolvedValue(studentSession as any);
      vi.mocked(prisma.parentStudentLink.findFirst).mockResolvedValue({
        inviteCode: "ABC12345",
        expiresAt: new Date("2099-01-01"),
        status: "PENDING",
        createdAt: new Date("2024-01-01"),
      } as any);

      const result = await getActiveInvite();

      expect(result).not.toBeNull();
      expect(result?.inviteCode).toBe("ABC12345");
      expect(result?.status).toBe("PENDING");
    });
  });

  describe("listInvites", () => {
    it("should return all invites for student", async () => {
      vi.mocked(getSession).mockResolvedValue(studentSession as any);
      vi.mocked(prisma.parentStudentLink.findMany).mockResolvedValue([
        {
          inviteCode: "ABC12345",
          expiresAt: new Date("2099-01-01"),
          status: "ACCEPTED",
          parent: { name: "Pak Budi", email: "budi@email.com" },
          createdAt: new Date("2024-01-01"),
        },
        {
          inviteCode: "XYZ98765",
          expiresAt: new Date("2024-12-31"),
          status: "PENDING",
          parent: null,
          createdAt: new Date("2024-06-01"),
        },
      ] as any);

      const result = await listInvites();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe("ACCEPTED");
      expect(result[0].parentName).toBe("Pak Budi");
      expect(result[1].status).toBe("PENDING");
      expect(result[1].parentName).toBeNull();
    });
  });
});

describe("Parent Dashboard & History", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const parentSession = { id: "parent-1", role: "PARENT" };

  describe("getParentDashboardData", () => {
    it("should return UNAUTHORIZED for unauthenticated user", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const result = await getParentDashboardData();

      expect(result).toEqual({ ok: false, error: "UNAUTHORIZED" });
    });

    it("should return FORBIDDEN for non-parent role", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: "user-1",
        role: "STUDENT",
      } as any);

      const result = await getParentDashboardData();

      expect(result).toEqual({ ok: false, error: "FORBIDDEN" });
    });

    it("should return empty children when no links exist", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findMany).mockResolvedValue([]);

      const result = await getParentDashboardData();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.children).toEqual([]);
        expect(result.activeChild).toBeNull();
        expect(result.summary).toBeNull();
      }
    });

    it("should return linked children and active child data", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findMany).mockResolvedValue([
        {
          studentId: "student-1",
          student: { id: "student-1", name: "Budi", email: "budi@email.com" },
        },
        {
          studentId: "student-2",
          student: { id: "student-2", name: "Siti", email: "siti@email.com" },
        },
      ] as any);
      vi.mocked(getDashboardSummary).mockResolvedValue({
        streak: { current: 5 },
        subjects: [],
      } as any);
      vi.mocked(getProgressTimeline).mockResolvedValue([] as any);
      vi.mocked(prisma.streak.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.studentKnowledgeProfile.findMany).mockResolvedValue([]);
      vi.mocked(prisma.parentTipCache.findUnique).mockResolvedValue({
        content: "AI tip cached",
      } as any);

      const result = await getParentDashboardData();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.children).toHaveLength(2);
        expect(result.activeChild?.id).toBe("student-1");
        expect(result.aiRecommendation).toBe("AI tip cached");
      }
    });

    it("should use specified activeStudentId if provided", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findMany).mockResolvedValue([
        {
          studentId: "student-1",
          student: { id: "student-1", name: "Budi", email: "budi@email.com" },
        },
        {
          studentId: "student-2",
          student: { id: "student-2", name: "Siti", email: "siti@email.com" },
        },
      ] as any);
      vi.mocked(getDashboardSummary).mockResolvedValue({
        streak: { current: 3 },
        subjects: [],
      } as any);
      vi.mocked(getProgressTimeline).mockResolvedValue([] as any);
      vi.mocked(prisma.streak.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.studentKnowledgeProfile.findMany).mockResolvedValue([]);
      vi.mocked(prisma.parentTipCache.findUnique).mockResolvedValue({
        content: "Tip for Siti",
      } as any);

      const result = await getParentDashboardData("student-2");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.activeChild?.id).toBe("student-2");
        expect(result.activeChild?.name).toBe("Siti");
      }
    });

    it("should generate alerts for inactive student", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findMany).mockResolvedValue([
        {
          studentId: "student-1",
          student: { id: "student-1", name: "Budi", email: "budi@email.com" },
        },
      ] as any);
      vi.mocked(getDashboardSummary).mockResolvedValue({
        streak: { current: 0 },
        subjects: [],
      } as any);
      vi.mocked(getProgressTimeline).mockResolvedValue([] as any);
      vi.mocked(prisma.streak.findUnique).mockResolvedValue({
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        currentStreak: 0,
      } as any);
      vi.mocked(prisma.studentKnowledgeProfile.findMany).mockResolvedValue([]);
      vi.mocked(prisma.parentTipCache.findUnique).mockResolvedValue({
        content: "AI tip",
      } as any);

      const result = await getParentDashboardData();

      expect(result.ok).toBe(true);
      expect(result).toHaveProperty("alerts");
      if (result.ok && result.alerts) {
        expect(result.alerts.length).toBeGreaterThan(0);
        expect(result.alerts[0].type).toBe("inactivity");
      }
    });

    it("should generate alerts for struggling concepts", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findMany).mockResolvedValue([
        {
          studentId: "student-1",
          student: { id: "student-1", name: "Budi", email: "budi@email.com" },
        },
      ] as any);
      vi.mocked(getDashboardSummary).mockResolvedValue({
        streak: { current: 5 },
        subjects: [],
      } as any);
      vi.mocked(getProgressTimeline).mockResolvedValue([] as any);
      vi.mocked(prisma.streak.findUnique).mockResolvedValue({
        updatedAt: new Date(),
        currentStreak: 5,
      } as any);
      vi.mocked(prisma.studentKnowledgeProfile.findMany).mockResolvedValue([
        {
          conceptId: "concept-1",
          masteryScore: 0.3,
          concept: {
            name: "Trigonometri",
            topic: {
              name: "Trigonometri Dasar",
              subject: { name: "Matematika" },
            },
          },
        },
      ] as any);
      vi.mocked(prisma.parentTipCache.findUnique).mockResolvedValue({
        content: "AI tip",
      } as any);

      const result = await getParentDashboardData();

      expect(result.ok).toBe(true);
      if (result.ok && result.alerts) {
        const struggleAlerts = result.alerts.filter((a) => a.type === "struggle");
        expect(struggleAlerts.length).toBeGreaterThan(0);
        expect(result.strugglingConcepts).toHaveLength(1);
      }
    });
  });

  describe("getParentHistoryData", () => {
    it("should return UNAUTHORIZED for unauthenticated user", async () => {
      vi.mocked(getSession).mockResolvedValue(null);

      const result = await getParentHistoryData();

      expect(result).toEqual({ ok: false, error: "UNAUTHORIZED" });
    });

    it("should return FORBIDDEN for non-parent role", async () => {
      vi.mocked(getSession).mockResolvedValue({
        id: "user-1",
        role: "STUDENT",
      } as any);

      const result = await getParentHistoryData();

      expect(result).toEqual({ ok: false, error: "FORBIDDEN" });
    });

    it("should return empty history when no links exist", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findMany).mockResolvedValue([]);

      const result = await getParentHistoryData();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.children).toEqual([]);
        expect(result.activeChild).toBeNull();
        expect(result.history).toEqual([]);
      }
    });

    it("should return activity history for linked student", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findMany).mockResolvedValue([
        {
          studentId: "student-1",
          student: { id: "student-1", name: "Budi" },
        },
      ] as any);
      vi.mocked(prisma.challenge.findMany).mockResolvedValue([
        {
          id: "ch-1",
          title: "Tantangan Matematika",
          scheduledFor: new Date("2024-06-15"),
          status: "COMPLETED",
          completedAt: new Date("2024-06-15"),
          subject: { name: "Matematika" },
        },
      ] as any);
      vi.mocked(prisma.questionAttempt.findMany).mockResolvedValue([
        {
          id: "att-1",
          isCorrect: true,
          timeSpent: 30,
          createdAt: new Date("2024-06-15"),
          question: {
            concept: {
              topic: {
                subject: { name: "Matematika" },
              },
            },
          },
        },
      ] as any);
      vi.mocked(prisma.chatSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.materialRead.findMany).mockResolvedValue([]);

      const result = await getParentHistoryData();

      expect(result.ok).toBe(true);
      if (result.ok && result.history) {
        expect(result.children).toHaveLength(1);
        expect(result.activeChild?.id).toBe("student-1");
        expect(result.history.length).toBeGreaterThan(0);
      }
    });

    it("should aggregate practice attempts by date", async () => {
      vi.mocked(getSession).mockResolvedValue(parentSession as any);
      vi.mocked(prisma.parentStudentLink.findMany).mockResolvedValue([
        {
          studentId: "student-1",
          student: { id: "student-1", name: "Budi" },
        },
      ] as any);
      vi.mocked(prisma.challenge.findMany).mockResolvedValue([]);
      vi.mocked(prisma.questionAttempt.findMany).mockResolvedValue([
        {
          id: "att-1",
          isCorrect: true,
          timeSpent: 30,
          createdAt: new Date("2024-06-15T10:00:00"),
          question: {
            concept: {
              topic: { subject: { name: "Matematika" } },
            },
          },
        },
        {
          id: "att-2",
          isCorrect: false,
          timeSpent: 45,
          createdAt: new Date("2024-06-15T10:05:00"),
          question: {
            concept: {
              topic: { subject: { name: "Matematika" } },
            },
          },
        },
        {
          id: "att-3",
          isCorrect: true,
          timeSpent: 20,
          createdAt: new Date("2024-06-15T10:10:00"),
          question: {
            concept: {
              topic: { subject: { name: "Matematika" } },
            },
          },
        },
      ] as any);
      vi.mocked(prisma.chatSession.findMany).mockResolvedValue([]);
      vi.mocked(prisma.materialRead.findMany).mockResolvedValue([]);

      const result = await getParentHistoryData();

      expect(result.ok).toBe(true);
      if (result.ok && result.history) {
        const practiceItems = result.history.filter((h) => h.type === "practice");
        expect(practiceItems).toHaveLength(1); // all same date, aggregated
        expect(practiceItems[0].title).toContain("2/3");
        expect(practiceItems[0].score).toBe(67); // 2/3 ≈ 67%
      }
    });
  });
});
