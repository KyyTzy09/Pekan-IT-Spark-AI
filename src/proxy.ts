import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

interface SessionPayload {
  id?: string;
  role?: string;
  isOnboarded?: boolean;
}

const STUDENT_ROUTES = [
  "/dashboard",
  "/chat",
  "/subjects",
  "/topics",
  "/practice",
  "/plan",
  "/upload",
  "/settings",
  "/challenge",
  "/leaderboard",
  "/materials",
  "/profile",
  "/activity",
  "/tree",
  "/onboarding",
];

const PUBLIC_ROUTES = ["/", "/about", "/help", "/courses"];

const AUTH_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/redirect",
  "/auth/verify-email",
];

async function getSessionFromCookie(
  request: NextRequest,
): Promise<SessionPayload | null> {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSessionFromCookie(request);

  const isLoggedIn = Boolean(session);
  const role = session?.role ?? "STUDENT";
  const isOnboarded = Boolean(session?.isOnboarded);

  // Public routes — no auth required
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Auth routes (login/register) — pass through
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // API auth routes — pass through
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Not logged in — redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Onboarding page — redirect to dashboard if already onboarded
  if (pathname === "/onboarding") {
    if (role === "STUDENT" && isOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (role !== "STUDENT") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Student routes — require STUDENT role
  if (STUDENT_ROUTES.some((r) => pathname.startsWith(r))) {
    if (role !== "STUDENT") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Force onboarding if not done
    if (!isOnboarded && pathname !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.next();
  }

  // Parent routes — require PARENT role
  if (pathname.startsWith("/parent")) {
    if (role !== "PARENT") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Admin routes — require ADMIN role
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
