import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "admin" | "empleado" | "cliente";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hores_token");
    if (!token) { setLoading(false); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setUser(data); else localStorage.removeItem("hores_token"); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Error al iniciar sesión" };
      localStorage.setItem("hores_token", data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: "No se pudo conectar con el servidor" };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Error al registrarse" };
      localStorage.setItem("hores_token", data.token);
      setUser(data.user);
      return {};
    } catch {
      return { error: "No se pudo conectar con el servidor" };
    }
  };

  const logout = () => {
    const token = localStorage.getItem("hores_token");
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("hores_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
