import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/about",
  "/help",
  "/contact",
  "/privacy",
  "/terms",
  "/pdp",
];

const authPaths = ["/auth/login", "/auth/register", "/auth/forgot-password"];

const studentPaths = [
  "/dashboard",
  "/chat",
  "/subjects",
  "/topics",
  "/practice",
  "/upload",
  "/documents",
  "/constellation",
  "/plan",
  "/badges",
  "/daily-quest",
  "/weekly-challenge",
  "/study-buddy",
  "/shop",
  "/profile",
  "/notifications",
  "/settings",
];

const roleHome: Record<string, string> = {
  STUDENT: "/dashboard",
  PARENT: "/parent",
  ADMIN: "/admin",
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const isAuth = authPaths.some((p) => pathname.startsWith(p));
  const isStudentRoute = studentPaths.some((p) => pathname.startsWith(p));
  const isParentRoute = pathname.startsWith("/parent");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isPublic) return NextResponse.next();

  if (isAuth) {
    if (session?.user) {
      const home = roleHome[session.user.role as string] || "/dashboard";
      return NextResponse.redirect(new URL(home, req.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role as string;

  if (role === "ADMIN" && isAdminRoute) return NextResponse.next();
  if (role === "PARENT" && isParentRoute) return NextResponse.next();
  if (role === "STUDENT" && isStudentRoute) return NextResponse.next();

  if (role === "STUDENT" && isAdminRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (role === "PARENT" && (isStudentRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL("/parent", req.url));
  }

  if (role === "ADMIN" && (isStudentRoute || isParentRoute)) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  const home = roleHome[role] || "/";
  return NextResponse.redirect(new URL(home, req.url));
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
