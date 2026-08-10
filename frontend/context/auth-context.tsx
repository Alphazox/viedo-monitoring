'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  getAccessToken,
  getStoredRefreshToken,
  setAccessToken,
  setUnauthorizedHandler,
  storeRefreshToken,
} from '@/lib/api/client';
import { authApi } from '@/lib/api/resources';
import type { JwtPayload } from '@/lib/api/types';

interface AuthContextValue {
  user: JwtPayload | null;
  /** True while the initial silent-refresh-on-load check is in flight. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    storeRefreshToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    // A page reload keeps only the refresh token (localStorage); the access
    // token is deliberately in-memory-only, so it must be re-derived here.
    let cancelled = false;

    async function restoreSession() {
      const storedRefresh = getStoredRefreshToken();
      if (!storedRefresh) {
        setIsLoading(false);
        return;
      }

      try {
        const tokens = await authApi.refresh(storedRefresh);
        setAccessToken(tokens.accessToken);
        storeRefreshToken(tokens.refreshToken);
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    setAccessToken(tokens.accessToken);
    storeRefreshToken(tokens.refreshToken);
    const me = await authApi.me();
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getStoredRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        // Best-effort: an already-invalid/expired refresh token shouldn't
        // block the client from clearing its own local session.
        if (!(error instanceof ApiError)) throw error;
      }
    }
    clearSession();
  }, [clearSession]);

  const hasPermission = useCallback((key: string) => Boolean(user?.permissions.includes(key)), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, logout, hasPermission }),
    [user, isLoading, login, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

// Re-exported so pages that need to check auth outside React (rare) can —
// most code should go through useAuth().
export { getAccessToken };
