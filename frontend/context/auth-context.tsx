"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiError, refreshSession, setOnUnauthorized } from "@/lib/api/client";
import { authApi } from "@/lib/api/resources";
import type { MeResponse } from "@/lib/api/types";

interface AuthContextValue {
  user: MeResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => undefined);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => setUser(null));

    async function restoreSession() {
      // The refresh token lives in an httpOnly cookie this code can't read
      // directly, so there's no cheap local check for "is there a session" —
      // just ask the backend and see whether the cookie (if any) still works.
      try {
        const ok = await refreshSession();
        setUser(ok ? await authApi.me() : null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();

    return () => setOnUnauthorized(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const me = await authApi.login(email, password);
    setUser(me);
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
