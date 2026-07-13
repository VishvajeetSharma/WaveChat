import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import authApi from "../api/auth.api.js";
import { extractApiError } from "../../../lib/apiClient.js";
import { connectSocket, disconnectSocket } from "../../../lib/socketClient.js";

const USER_STORAGE_KEY = "chat_user";
const TOKEN_STORAGE_KEY = "chat_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (token) connectSocket(token);
    else disconnectSocket();
    setReady(true);
  }, [token]);

  const persist = (nextUser, nextToken) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setUser(nextUser);
    setToken(nextToken);
  };

  const login = useCallback(async (username, password) => {
    try {
      const data = await authApi.login(username, password);
      persist(data.user, data.token);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: extractApiError(err, "Could not log in") };
    }
  }, []);

  const signup = useCallback(async (username, password) => {
    try {
      const data = await authApi.signup(username, password);
      persist(data.user, data.token);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: extractApiError(err, "Could not create account") };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    disconnectSocket();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, signup, logout }),
    [user, token, ready, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
