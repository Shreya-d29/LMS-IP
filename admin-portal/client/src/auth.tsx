import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, type SessionUser } from "./api";

type AuthValue = {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("shreya-token")));
  useEffect(() => {
    if (!localStorage.getItem("shreya-token")) return;
    api.get<{ user: SessionUser }>("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => { localStorage.removeItem("shreya-token"); setUser(null); })
      .finally(() => setLoading(false));
  }, []);
  const value = useMemo<AuthValue>(() => ({
    user, loading,
    async signIn(email, password) {
      const { data } = await api.post<{ token: string; user: SessionUser }>("/auth/login", { email, password });
      localStorage.setItem("shreya-token", data.token);
      setUser(data.user);
    },
    signOut() { localStorage.removeItem("shreya-token"); setUser(null); }
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="screen-loading"><span className="spinner" />Preparing your workspace…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export function RequirePermission({ module, children }: { module: string; children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "SUPER_ADMIN" && !user?.permissions[module]?.view) {
    return <main className="page-content"><div className="error-panel">Your role does not have access to this module.</div></main>;
  }
  return <>{children}</>;
}
