import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isOnboarded: boolean;
  image: string | null;
  sessionVersion: number;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const COOKIE_NAME = "session";
const EXPIRES_IN = "7d"; // 7 hari

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env wajib diisi");
  return new TextEncoder().encode(secret);
}

// ── Sign & Verify ──────────────────────────────────────────────────────────────

export async function signToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    // Validate required fields
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.isOnboarded !== "boolean"
    ) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
      role: payload.role,
      isOnboarded: payload.isOnboarded,
      image: typeof payload.image === "string" ? payload.image : null,
      sessionVersion:
        typeof payload.sessionVersion === "number" ? payload.sessionVersion : 0,
    };
  } catch {
    return null;
  }
}

// ── Session helpers (server-side) ──────────────────────────────────────────────

export async function setSession(user: SessionUser): Promise<void> {
  const token = await signToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 hari
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyToken(cookie.value);
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function refreshSession(): Promise<void> {
  const session = await getSession();
  if (!session?.id) return;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isOnboarded: true,
      image: true,
      sessionVersion: true,
    },
  });

  // Clear session if user was deleted
  if (!user) {
    await clearSession();
    return;
  }

  // BUG-4 FIX: Invalidate session if version changed (e.g., password changed).
  // Clear the cookie AND return early — don't re-issue a token.
  if (user.sessionVersion !== (session.sessionVersion ?? 0)) {
    await clearSession();
    return;
  }

  await setSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isOnboarded: user.isOnboarded,
    image: user.image,
    sessionVersion: user.sessionVersion,
  });
}

/**
 * Increment session version to invalidate all existing JWTs for this user.
 * Call this on password change, email change, or security-sensitive actions.
 * Existing tokens will fail the sessionVersion check in refreshSession/verifyToken.
 */
export async function invalidateAllSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
  // Also clear current session cookie
  await clearSession();
}

// ── Cookie header parser (untuk middleware yang butuh async) ─────────────────────

export async function parseSessionFromCookieHeader(
  cookieHeader: string | undefined,
): Promise<SessionUser | null> {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const token = match.split("=").slice(1).join("=");
  return verifyToken(token);
}
