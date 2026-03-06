import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson } from "./api";
import type { AuthUser } from "./authTypes";
import { AuthContext } from "./authContext";
import type { AuthContextValue } from "./authContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await apiJson<{ user: AuthUser | null }>("/api/auth/me", { method: "GET" });
    setUser(data.user);
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        await refresh();
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refresh]);

  const login = useCallback(async (args: { email: string; password: string }) => {
    const data = await apiJson<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(args),
    });
    setUser(data.user);
  }, []);

  const signup = useCallback(async (args: { name: string; email: string; password: string }) => {
    const data = await apiJson<{ user: AuthUser }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(args),
    });
    setUser(data.user);
  }, []);

  const guest = useCallback(async () => {
    const data = await apiJson<{ user: AuthUser }>("/api/auth/guest", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await apiJson<{ ok: true }>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, signup, guest, logout, refresh }),
    [guest, isLoading, login, logout, refresh, signup, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
