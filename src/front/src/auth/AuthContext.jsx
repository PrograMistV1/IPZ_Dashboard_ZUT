import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import { tokenManager } from "../services/tokenManager";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");

  useEffect(() => {
    const token = tokenManager.get();
    if (token) {
      setUser({ logged: true });
    }
  }, []);

  const login = async (username, password) => {
  let data;

  try {
    data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  } catch (err) {
    // если 401 / 422 / что угодно
    throw new Error("LOGIN_FAILED");
  }

  if (!data?.access_token) {
    throw new Error("LOGIN_FAILED");
  }

  tokenManager.set(data.access_token);
    setUser({
      id: data.user_id,
      username: data.username,
    });
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {}
    tokenManager.clear();
    setUser(null);
    setMode("login");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, mode, setMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
