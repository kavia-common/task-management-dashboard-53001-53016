import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiLogin, apiMe, apiRegister } from "../api/client";

const STORAGE_KEY = "tmdb.auth.v1";

const AuthContext = createContext(null);

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getInitialAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  return parsed && typeof parsed === "object" ? parsed : { token: null, user: null };
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides authentication state and actions (login/register/logout). */
  const [token, setToken] = useState(() => getInitialAuth().token);
  const [user, setUser] = useState(() => getInitialAuth().user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  }, [token, user]);

  const refreshMe = async (tkn) => {
    try {
      const me = await apiMe(tkn);
      if (me) setUser(me.user || me);
    } catch {
      // ignore - backend may not implement /auth/me
    }
  };

  // Best-effort re-hydration
  useEffect(() => {
    if (token && !user) refreshMe(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PUBLIC_INTERFACE
  const login = async ({ email, password }) => {
    /** Login and store token/user. Falls back to demo mode if endpoint doesn't exist. */
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      const tkn = res?.access_token || res?.token || null;
      const usr = res?.user || (email ? { name: email.split("@")[0], email } : null);

      if (tkn) {
        setToken(tkn);
        setUser(usr);
        return { ok: true };
      }

      // If backend returns something unexpected, still allow demo mode
      setToken(`demo-${Date.now()}`);
      setUser(usr || { name: "Demo User", email });
      return { ok: true, demo: true };
    } catch (e) {
      // If auth endpoint not available, allow demo login for UI development
      if (String(e?.message || "").includes("404")) {
        setToken(`demo-${Date.now()}`);
        setUser({ name: "Demo User", email });
        return { ok: true, demo: true };
      }
      return { ok: false, error: e?.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const register = async ({ name, email, password }) => {
    /** Register new account; best-effort based on backend support. */
    setLoading(true);
    try {
      const res = await apiRegister({ name, email, password });
      const tkn = res?.access_token || res?.token || null;
      const usr = res?.user || { name, email };

      if (tkn) {
        setToken(tkn);
        setUser(usr);
        return { ok: true };
      }

      // Fallback: let user proceed in demo mode after register
      setToken(`demo-${Date.now()}`);
      setUser(usr);
      return { ok: true, demo: true };
    } catch (e) {
      if (String(e?.message || "").includes("404")) {
        setToken(`demo-${Date.now()}`);
        setUser({ name, email });
        return { ok: true, demo: true };
      }
      return { ok: false, error: e?.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const logout = () => {
    /** Clear token/user and return to auth screens. */
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loading,
      login,
      register,
      logout,
      refreshMe: () => (token ? refreshMe(token) : Promise.resolve()),
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
