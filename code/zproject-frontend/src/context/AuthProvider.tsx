import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authService from "../services/authService";
import type { CurrentUser } from "../types/auth";
import { AuthContext, type AuthContextValue } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  // Si hay token guardado, hay que consultar quién es antes de decidir qué mostrar
  const [loading, setLoading] = useState(() => authService.hasStoredToken());

  useEffect(() => {
    if (!authService.hasStoredToken()) {
      return;
    }
    authService
      .getMe()
      .then(setUser)
      .catch(() => authService.logout())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setUser(await authService.login(username, password));
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (code: string) => user?.permissions.includes(code) ?? false,
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, hasPermission }),
    [user, loading, login, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}