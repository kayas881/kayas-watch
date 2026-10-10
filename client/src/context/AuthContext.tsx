import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, TOKEN_KEY } from "../api/client";

export interface User { id: string; name: string | null; email: string; role: "SUPERADMIN" | "ADMIN" | "VIEWER" }
interface AuthValue { user: User | null; token: string | null; loading: boolean; isAuthenticated: boolean; login(email: string, password: string): Promise<void>; logout(): void }
export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY)); const [user, setUser] = useState<User | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!token) { setLoading(false); return; } api.get<{ user: User }>("/auth/me").then(r => setUser(r.data.user)).catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); }).finally(() => setLoading(false)); }, [token]);
  const login = useCallback(async (email: string, password: string) => { const { data } = await api.post<{ token: string; user: User }>("/auth/login", { email, password }); localStorage.setItem(TOKEN_KEY, data.token); setToken(data.token); setUser(data.user); }, []);
  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); setUser(null); }, []);
  const value = useMemo(() => ({ user, token, loading, isAuthenticated: !!user, login, logout }), [user, token, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
