"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { post, get, refreshSession, setAccessToken } from "@/services/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", user: null, team: null });

  const loadMe = useCallback(async () => {
    const me = await get("/auth/me");
    setState({ status: "authenticated", user: me.user, team: me.team });
    return me.user;
  }, []);

  useEffect(() => {
    let alive = true;
    refreshSession()
      .then(() => alive && loadMe())
      .catch(() => alive && setState({ status: "anonymous", user: null, team: null }));
    return () => { alive = false; };
  }, [loadMe]);

  const login = useCallback(async (email, password) => {
    const data = await post("/auth/login", { email, password });
    setAccessToken(data.accessToken);
    return loadMe();
  }, [loadMe]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const data = await post("/auth/change-password", { currentPassword, newPassword });
    setAccessToken(data.accessToken);
    return loadMe();
  }, [loadMe]);

  const logout = useCallback(async () => {
    try { await post("/auth/logout"); } finally {
      setAccessToken(null);
      setState({ status: "anonymous", user: null, team: null });
    }
  }, []);

  const value = useMemo(() => ({ ...state, login, logout, changePassword }), [state, login, logout, changePassword]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const homeFor = (user) => (user?.mustChangePassword ? "/change-password" : user?.role === "ADMIN" ? "/admin/dashboard" : "/captain/dashboard");
