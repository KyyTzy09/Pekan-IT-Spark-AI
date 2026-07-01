// server-only MUST be first — intercepted before any transitive import
vi.mock("server-only", () => ({}));

import { describe, expect, it, vi, beforeEach } from "vitest";

// vi.hoisted: vars available inside vi.mock factories (hoisted to top by Vitest)
const { mockSetSession, mockClearSession, mockCheckRateLimitAsync, mockClearRateLimit,
  mockUserFindUnique, mockUserCreate, mockLinkFindUnique, mockLinkUpdate, mockTransaction,
  mockBcryptCompare, mockBcryptHash } = vi.hoisted(() => ({
  mockSetSession: vi.fn(),
  mockClearSession: vi.fn(),
  mockCheckRateLimitAsync: vi.fn(),
  mockClearRateLimit: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserCreate: vi.fn(),
  mockLinkFindUnique: vi.fn(),
  mockLinkUpdate: vi.fn(),
  mockTransaction: vi.fn(),
  mockBcryptCompare: vi.fn(),
  mockBcryptHash: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  setSession: mockSetSession,
  clearSession: mockClearSession,
}));

vi.mock("@/lib/auth-utils", () => ({
  sanitizeInternalPath: vi.fn((p: string | undefined) => p ?? null),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitAsync: mockCheckRateLimitAsync,
  clearRateLimit: mockClearRateLimit,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
    parentStudentLink: {
      findUnique: mockLinkFindUnique,
      update: mockLinkUpdate,
    },
    $transaction: mockTransaction,
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mockBcryptCompare,
    hash: mockBcryptHash,
  },
}));

import { loginAction, registerAction, logoutAction } from "@/server/actions/auth";

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v);
  }
  return fd;
}

// ── loginAction ──────────────────────────────────────────────────────────────

describe("loginAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimitAsync.mockResolvedValue(true);
    mockBcryptCompare.mockResolvedValue(false);
  });

  it("returns fieldErrors on invalid email", async () => {
    const result = await loginAction(
      undefined,
      makeFormData({ email: "bukan-email", password: "password123" }),
    );
    expect(result.fieldErrors?.email).toBeTruthy();
  });

  it("returns fieldErrors on empty password", async () => {
    const result = await loginAction(
      undefined,
      makeFormData({ email: "user@example.com", password: "" }),
    );
    expect(result.fieldErrors?.password).toBeTruthy();
  });

  it("returns error when rate limited", async () => {
    mockCheckRateLimitAsync.mockResolvedValue(false);
    const result = await loginAction(
      undefined,
      makeFormData({ email: "user@example.com", password: "password123" }),
    );
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("banyak");
  });

  it("returns error when user not found", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    const result = await loginAction(
      undefined,
      makeFormData({ email: "user@example.com", password: "password123" }),
    );
    expect(result.error).toBeTruthy();
  });

  it("returns error when user has no passwordHash", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "u1", email: "user@example.com", passwordHash: null });
    const result = await loginAction(
      undefined,
      makeFormData({ email: "user@example.com", password: "password123" }),
    );
    expect(result.error).toBeTruthy();
  });

  it("returns error on wrong password", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "u1", email: "user@example.com", name: "User",
      passwordHash: "hashed", role: "STUDENT", isOnboarded: true,
      image: null, sessionVersion: 0,
    });
    mockBcryptCompare.mockResolvedValue(false);
    const result = await loginAction(
      undefined,
      makeFormData({ email: "user@example.com", password: "wrongpassword" }),
    );
    expect(result.error).toBeTruthy();
  });

  it("sets session and returns empty on success", async () => {
    const user = {
      id: "u1", email: "user@example.com", name: "User",
      passwordHash: "hashed", role: "STUDENT", isOnboarded: true,
      image: null, sessionVersion: 0,
    };
    mockUserFindUnique.mockResolvedValue(user);
    mockBcryptCompare.mockResolvedValue(true);
    mockSetSession.mockResolvedValue(undefined);

    const result = await loginAction(
      undefined,
      makeFormData({ email: "user@example.com", password: "correctpassword" }),
    );

    expect(result).toEqual({});
    expect(mockSetSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u1", email: "user@example.com", role: "STUDENT" }),
    );
    expect(mockClearRateLimit).toHaveBeenCalled();
  });

  it("normalizes email to lowercase before lookup", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    await loginAction(
      undefined,
      makeFormData({ email: "USER@EXAMPLE.COM", password: "pass" }),
    );
    expect(mockUserFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "user@example.com" } }),
    );
  });
});

// ── registerAction — STUDENT ─────────────────────────────────────────────────

describe("registerAction — STUDENT", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimitAsync.mockResolvedValue(true);
    mockBcryptHash.mockResolvedValue("hashed_password");
    mockSetSession.mockResolvedValue(undefined);
  });

  it("returns fieldErrors on missing role", async () => {
    const result = await registerAction(
      undefined,
      makeFormData({ email: "user@example.com", password: "password123", name: "Test" }),
    );
    expect(result.fieldErrors ?? result.error).toBeTruthy();
  });

  it("returns error when rate limited", async () => {
    mockCheckRateLimitAsync.mockResolvedValue(false);
    const result = await registerAction(
      undefined,
      makeFormData({ role: "STUDENT", name: "Test User", email: "user@example.com", password: "password123" }),
    );
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("banyak");
  });

  it("returns error when email already registered", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "existing" });
    const result = await registerAction(
      undefined,
      makeFormData({ role: "STUDENT", name: "Test User", email: "existing@example.com", password: "password123" }),
    );
    expect(result.error).toBeTruthy();
    expect(result.error).toContain("terdaftar");
  });

  it("returns fieldErrors on short name", async () => {
    const result = await registerAction(
      undefined,
      makeFormData({ role: "STUDENT", name: "A", email: "user@example.com", password: "password123" }),
    );
    expect(result.fieldErrors?.name).toBeTruthy();
  });

  it("returns fieldErrors on short password", async () => {
    const result = await registerAction(
      undefined,
      makeFormData({ role: "STUDENT", name: "Test User", email: "user@example.com", password: "short" }),
    );
    expect(result.fieldErrors?.password).toBeTruthy();
  });

  it("creates student user and sets session on success", async () => {
    mockUserFindUnique.mockResolvedValue(null); // no existing user
    const createdUser = {
      id: "new-u1", email: "student@example.com", name: "Student Baru",
      role: "STUDENT", isOnboarded: false, image: null, sessionVersion: 0,
    };
    mockUserCreate.mockResolvedValue(createdUser);

    const result = await registerAction(
      undefined,
      makeFormData({ role: "STUDENT", name: "Student Baru", email: "student@example.com", password: "password123" }),
    );

    expect(result).toEqual({});
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "student@example.com",
          role: "STUDENT",
        }),
      }),
    );
    expect(mockSetSession).toHaveBeenCalledWith(
      expect.objectContaining({ id: "new-u1", role: "STUDENT" }),
    );
  });

  it("student create uses transaction-free path — setSession outside any tx", async () => {
    // setSession must NOT be called inside $transaction for STUDENT
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      id: "u1", email: "s@test.com", name: "S", role: "STUDENT",
      isOnboarded: false, image: null, sessionVersion: 0,
    });

    await registerAction(
      undefined,
      makeFormData({ role: "STUDENT", name: "Student Name", email: "s@test.com", password: "password123" }),
    );

    // $transaction should NOT have been called for STUDENT path
    expect(mockTransaction).not.toHaveBeenCalled();
    // setSession should have been called directly
    expect(mockSetSession).toHaveBeenCalled();
  });
});

// ── registerAction — PARENT ──────────────────────────────────────────────────

describe("registerAction — PARENT", () => {
  const validLink = {
    id: "link-1",
    inviteCode: "VALID123",
    status: "PENDING",
    expiresAt: new Date(Date.now() + 86_400_000),
    student: { id: "student-1", isOnboarded: true },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimitAsync.mockResolvedValue(true);
    mockBcryptHash.mockResolvedValue("hashed_password");
    mockSetSession.mockResolvedValue(undefined);
  });

  it("returns fieldErrors on missing inviteCode", async () => {
    const result = await registerAction(
      undefined,
      makeFormData({ role: "PARENT", name: "Parent Name", email: "parent@example.com", password: "password123" }),
    );
    expect(result.fieldErrors?.inviteCode).toBeTruthy();
  });

  it("returns fieldErrors when invite code not found", async () => {
    mockLinkFindUnique.mockResolvedValue(null);
    const result = await registerAction(
      undefined,
      makeFormData({ role: "PARENT", name: "Parent", email: "p@test.com", password: "password123", inviteCode: "NOTFOUND" }),
    );
    expect(result.fieldErrors?.inviteCode).toBeTruthy();
    expect(result.fieldErrors?.inviteCode).toContain("nggak ketemu");
  });

  it("returns fieldErrors when invite already accepted", async () => {
    mockLinkFindUnique.mockResolvedValue({ ...validLink, status: "ACCEPTED" });
    const result = await registerAction(
      undefined,
      makeFormData({ role: "PARENT", name: "Parent", email: "p@test.com", password: "password123", inviteCode: "VALID123" }),
    );
    expect(result.fieldErrors?.inviteCode).toBeTruthy();
    expect(result.fieldErrors?.inviteCode).toContain("udah dipakai");
  });

  it("returns fieldErrors when invite expired", async () => {
    mockLinkFindUnique.mockResolvedValue({
      ...validLink,
      expiresAt: new Date(Date.now() - 86_400_000),
    });
    const result = await registerAction(
      undefined,
      makeFormData({ role: "PARENT", name: "Parent", email: "p@test.com", password: "password123", inviteCode: "VALID123" }),
    );
    expect(result.fieldErrors?.inviteCode).toBeTruthy();
    expect(result.fieldErrors?.inviteCode).toContain("kedaluwarsa");
  });

  it("setSession called OUTSIDE transaction for PARENT (bug #3 fix)", async () => {
    // Key regression test: setSession must NOT be called inside $transaction
    mockUserFindUnique.mockResolvedValue(null);
    mockLinkFindUnique.mockResolvedValue(validLink);

    // Capture what $transaction callback does
    let setSessionCalledInsideTx = false;
    mockTransaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => {
      // Track if setSession is called during transaction execution
      const originalSetSession = mockSetSession.getMockImplementation();
      const callsBefore = mockSetSession.mock.calls.length;
      const tx = {
        user: { create: vi.fn().mockResolvedValue({
          id: "parent-1", email: "p@test.com", name: "Parent",
          role: "PARENT", isOnboarded: false, image: null, sessionVersion: 0,
        })},
        parentStudentLink: { update: vi.fn().mockResolvedValue({}) },
      };
      await fn(tx);
      const callsDuringTx = mockSetSession.mock.calls.length - callsBefore;
      setSessionCalledInsideTx = callsDuringTx > 0;
    });

    await registerAction(
      undefined,
      makeFormData({ role: "PARENT", name: "Parent Name", email: "p@test.com", password: "password123", inviteCode: "VALID123" }),
    );

    // setSession must NOT have been called inside the transaction
    expect(setSessionCalledInsideTx).toBe(false);
    // But it must have been called overall (after transaction)
    expect(mockSetSession).toHaveBeenCalled();
  });

  it("creates parent user via transaction on valid invite", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockLinkFindUnique.mockResolvedValue(validLink);

    const parentUser = {
      id: "parent-1", email: "p@test.com", name: "Parent Name",
      role: "PARENT", isOnboarded: false, image: null, sessionVersion: 0,
    };

    mockTransaction.mockImplementation(async (fn: (tx: any) => Promise<any>) => {
      const tx = {
        user: { create: vi.fn().mockResolvedValue(parentUser) },
        parentStudentLink: { update: vi.fn().mockResolvedValue({}) },
      };
      return fn(tx);
    });

    const result = await registerAction(
      undefined,
      makeFormData({ role: "PARENT", name: "Parent Name", email: "p@test.com", password: "password123", inviteCode: "VALID123" }),
    );

    expect(result).toEqual({});
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockSetSession).toHaveBeenCalledWith(
      expect.objectContaining({ role: "PARENT" }),
    );
  });
});

// ── logoutAction ─────────────────────────────────────────────────────────────

describe("logoutAction", () => {
  it("calls clearSession", async () => {
    mockClearSession.mockResolvedValue(undefined);
    await logoutAction();
    expect(mockClearSession).toHaveBeenCalled();
  });
});
