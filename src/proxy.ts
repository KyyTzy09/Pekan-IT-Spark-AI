import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const STUDENT_ROUTES = [
  "/dashboard",
  "/chat",
  "/subjects",
  "/topics",
  "/practice",
  "/plan",
  "/upload",
  "/settings",
];

const PUBLIC_ROUTES = ["/", "/about", "/help", "/courses"];

const AUTH_ROUTES = ["/auth/login", "/auth/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = Boolean(token);
  const role = (token?.role as string) ?? "STUDENT";
  const isOnboarded = Boolean(token?.isOnboarded);

  // Public routes — no auth required, let logged-in users browse freely
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Auth routes (login/register) — tetap bisa diakses walau udah login,
  // supaya developer bisa re-test alur registrasi / sign-in (mis. QA session
  // lama, uji role-switch, dll).
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Not logged in — redirect to login (preserves intended destination)
  if (!isLoggedIn) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but not a STUDENT trying to access student routes
  if (
    STUDENT_ROUTES.some((r) => pathname.startsWith(r)) &&
    role !== "STUDENT"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Logged in STUDENT but not onboarded — force onboarding
  // (skip if already on /onboarding to avoid redirect loop)
  if (
    STUDENT_ROUTES.some((r) => pathname.startsWith(r)) &&
    role === "STUDENT" &&
    !isOnboarded &&
    pathname !== "/onboarding"
  ) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
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
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
