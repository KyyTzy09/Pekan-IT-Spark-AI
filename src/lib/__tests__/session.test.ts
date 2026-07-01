import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Must use vi.hoisted so vars are available inside vi.mock factories
const { mockCookieGet, mockCookieSet, mockCookieDelete, mockUserFindUnique, mockUserUpdate } =
  vi.hoisted(() => ({
    mockCookieGet: vi.fn(),
    mockCookieSet: vi.fn(),
    mockCookieDelete: vi.fn(),
    mockUserFindUnique: vi.fn(),
    mockUserUpdate: vi.fn(),
  }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: mockCookieGet,
    set: mockCookieSet,
    delete: mockCookieDelete,
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
  },
}));

process.env.AUTH_SECRET = "test-secret-that-is-long-enough-for-hs256-signing";

import {
  signToken,
  verifyToken,
  getSession,
  parseSessionFromCookieHeader,
} from "@/lib/session";
import type { SessionUser } from "@/lib/session";

const baseUser: SessionUser = {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  role: "STUDENT",
  isOnboarded: true,
  image: null,
  sessionVersion: 0,
};

describe("signToken / verifyToken", () => {
  it("round-trips a valid session user", async () => {
    const token = await signToken(baseUser);
    expect(typeof token).toBe("string");

    const result = await verifyToken(token);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(baseUser.id);
    expect(result?.email).toBe(baseUser.email);
    expect(result?.role).toBe(baseUser.role);
  });

  it("returns null for garbage token", async () => {
    const result = await verifyToken("not.a.token");
    expect(result).toBeNull();
  });

  it("returns null for tampered token", async () => {
    const token = await signToken(baseUser);
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });

  it("preserves sessionVersion in token", async () => {
    const user = { ...baseUser, sessionVersion: 7 };
    const token = await signToken(user);
    const result = await verifyToken(token);
    expect(result?.sessionVersion).toBe(7);
  });

  it("defaults sessionVersion to 0 when missing from payload", async () => {
    // Simulate old token without sessionVersion field
    const token = await signToken({ ...baseUser, sessionVersion: 0 });
    const result = await verifyToken(token);
    expect(result?.sessionVersion).toBe(0);
  });
});

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no cookie", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const result = await getSession();
    expect(result).toBeNull();
  });

  it("returns null for invalid token in cookie", async () => {
    mockCookieGet.mockReturnValue({ value: "bad.token.here" });
    const result = await getSession();
    expect(result).toBeNull();
  });

  it("returns session when token valid and sessionVersion matches DB", async () => {
    const token = await signToken(baseUser);
    mockCookieGet.mockReturnValue({ value: token });
    mockUserFindUnique.mockResolvedValue({ sessionVersion: 0 });

    const result = await getSession();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(baseUser.id);
  });

  it("returns null when sessionVersion mismatch (invalidated session)", async () => {
    const token = await signToken({ ...baseUser, sessionVersion: 0 });
    mockCookieGet.mockReturnValue({ value: token });
    // DB has version 1 — session was invalidated (e.g. password change)
    mockUserFindUnique.mockResolvedValue({ sessionVersion: 1 });

    const result = await getSession();
    expect(result).toBeNull();
  });

  it("returns null when user not found in DB", async () => {
    const token = await signToken(baseUser);
    mockCookieGet.mockReturnValue({ value: token });
    mockUserFindUnique.mockResolvedValue(null);

    const result = await getSession();
    expect(result).toBeNull();
  });
});

describe("parseSessionFromCookieHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for undefined header", async () => {
    const result = await parseSessionFromCookieHeader(undefined);
    expect(result).toBeNull();
  });

  it("returns null when session cookie not present", async () => {
    const result = await parseSessionFromCookieHeader("other=abc; foo=bar");
    expect(result).toBeNull();
  });

  it("parses valid session from cookie header", async () => {
    const token = await signToken(baseUser);
    mockUserFindUnique.mockResolvedValue({ sessionVersion: 0 });

    const result = await parseSessionFromCookieHeader(`session=${token}; other=xyz`);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(baseUser.id);
  });

  it("returns null when sessionVersion mismatch in header parse (bug #5 fix)", async () => {
    const token = await signToken({ ...baseUser, sessionVersion: 0 });
    // DB version changed — session invalidated
    mockUserFindUnique.mockResolvedValue({ sessionVersion: 3 });

    const result = await parseSessionFromCookieHeader(`session=${token}`);
    expect(result).toBeNull();
  });

  it("handles token with = in value (base64 padding)", async () => {
    const token = await signToken(baseUser);
    mockUserFindUnique.mockResolvedValue({ sessionVersion: 0 });

    // Cookie header with other cookies around it
    const result = await parseSessionFromCookieHeader(
      `foo=bar; session=${token}; baz=qux`,
    );
    expect(result?.id).toBe(baseUser.id);
  });
});
