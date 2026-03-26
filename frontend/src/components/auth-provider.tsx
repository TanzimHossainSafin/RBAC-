"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_URL } from "@/lib/config";
import { defaultSidebarOrder } from "@/lib/route-permissions";
import type { SidebarItem, Stats, User } from "@/lib/types";

interface AuthContextValue {
  accessToken: string | null;
  user: User | null;
  sidebar: SidebarItem[];
  stats: Stats | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  apiFetch: <T>(path: string, init?: RequestInit) => Promise<T>;
}

interface SessionResponse {
  accessToken: string;
  user: User;
  sidebar?: SidebarItem[];
  stats?: Stats;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function firstAllowedPath(sidebar: SidebarItem[]) {
  return sidebar.find((item) => defaultSidebarOrder.includes(item.href))?.href ?? "/dashboard";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sidebar, setSidebar] = useState<SidebarItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (token: string) => {
    const response = await fetch(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Session expired");
    }

    const data = (await response.json()) as { user: User; sidebar: SidebarItem[]; stats: Stats };
    setUser(data.user);
    setSidebar(data.sidebar);
    setStats(data.stats);
    return data;
  }, []);

  const refreshSession = useCallback(async () => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      setAccessToken(null);
      setUser(null);
      setSidebar([]);
      setStats(null);
      throw new Error("Unauthenticated");
    }

    const data = (await response.json()) as SessionResponse;
    setAccessToken(data.accessToken);
    await fetchMe(data.accessToken);
    return data.accessToken;
  }, [fetchMe]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await refreshSession();
      } catch {
        if (mounted && pathname !== "/") {
          router.replace("/");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as SessionResponse & { message?: string };
    if (!response.ok) {
      throw new Error(data.message ?? "Login failed");
    }

    setAccessToken(data.accessToken);
    const me = await fetchMe(data.accessToken);
    router.push(firstAllowedPath(me.sidebar));
  }, [fetchMe, router]);

  const logout = useCallback(async () => {
    if (accessToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      }).catch(() => undefined);
    }

    setAccessToken(null);
    setUser(null);
    setSidebar([]);
    setStats(null);
    router.push("/");
    router.refresh();
  }, [accessToken, router]);

  const apiFetch = useCallback(async <T,>(path: string, init: RequestInit = {}) => {
    let token = accessToken;
    if (!token) {
      token = await refreshSession();
    }

    let response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      token = await refreshSession();
      response = await fetch(`${API_URL}${path}`, {
        ...init,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(init.headers ?? {}),
        },
        cache: "no-store",
      });
    }

    if (!response.ok) {
      const data = (await response.json().catch(() => ({ message: "Request failed" }))) as { message?: string };
      throw new Error(data.message ?? "Request failed");
    }

    return (await response.json()) as T;
  }, [accessToken, refreshSession]);

  const value = useMemo(
    () => ({ accessToken, user, sidebar, stats, loading, login, logout, apiFetch }),
    [accessToken, user, sidebar, stats, loading, login, logout, apiFetch],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
