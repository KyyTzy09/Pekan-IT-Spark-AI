"use client";

import * as React from "react";

interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isOnboarded: boolean;
  image: string | null;
}

interface SessionState {
  data: { user: SessionUser } | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

export function useSession(): SessionState {
  const [state, setState] = React.useState<SessionState>({
    data: null,
    status: "loading",
  });

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.user) {
          setState({ data: { user: data.user }, status: "authenticated" });
        } else {
          setState({ data: null, status: "unauthenticated" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, status: "unauthenticated" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/auth/login";
}
