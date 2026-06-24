import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  // ── CSRF check: verify state parameter ──
  const returnedState = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  if (!savedState || !returnedState || returnedState !== savedState) {
    return NextResponse.redirect(new URL("/auth/login?error=google_csrf", request.url));
  }
  // Clear state cookie immediately
  cookieStore.delete("oauth_state");

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=google", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/auth/login?error=google", request.url));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`;

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenData.access_token) {
      console.error("Google token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/auth/login?error=google", request.url));
    }

    // 2. Fetch user info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = (await userRes.json()) as GoogleUserInfo;
    if (!googleUser.email) {
      return NextResponse.redirect(new URL("/auth/login?error=google", request.url));
    }

    const email = googleUser.email.toLowerCase();
    const defaultAvatar = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(email)}`;

    // 3. Upsert user in DB
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, role: true, isOnboarded: true, image: true, sessionVersion: true },
    });

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: googleUser.name ?? existing.name,
          image: googleUser.picture ?? existing.image,
        },
        select: { id: true, name: true, email: true, role: true, isOnboarded: true, image: true, sessionVersion: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: googleUser.name ?? null,
          image: googleUser.picture ?? defaultAvatar,
          role: "STUDENT",
          studentProfile: { create: {} },
        },
        select: { id: true, name: true, email: true, role: true, isOnboarded: true, image: true, sessionVersion: true },
      });
    }

    // 4. Set session cookie
    await setSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isOnboarded: user.isOnboarded,
      image: user.image,
      sessionVersion: user.sessionVersion,
    });

    // 5. Redirect to smart landing
    return NextResponse.redirect(new URL("/auth/redirect", request.url));
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(new URL("/auth/login?error=google", request.url));
  }
}
