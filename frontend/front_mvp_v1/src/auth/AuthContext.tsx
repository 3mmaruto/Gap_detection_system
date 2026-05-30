import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { CurrentUser } from "../types";

type AuthContextValue = {
  user: CurrentUser | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isDeveloper: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("kgds_token"));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  const refreshUser = async () => {
    if (!localStorage.getItem("kgds_token")) {
      setUser(null);
      return;
    }
    const current = await api.getCurrentUser();
    setUser(current);
  };

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    setLoading(true);
    api
      .getCurrentUser()
      .then((current) => {
        if (!cancelled) setUser(current);
      })
      .catch(() => {
        localStorage.removeItem("kgds_token");
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isDeveloper: Boolean(user?.roles.includes("platform_super_admin")),
      login: async (username: string, password: string) => {
        const response = await api.login({ username, password });
        localStorage.setItem("kgds_token", response.access_token);
        setToken(response.access_token);
        const current = await api.getCurrentUser();
        setUser(current);
      },
      logout: () => {
        localStorage.removeItem("kgds_token");
        setToken(null);
        setUser(null);
      },
      refreshUser,
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
