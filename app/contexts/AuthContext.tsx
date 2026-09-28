'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api, AUTH_TOKEN_KEY, getAuthToken, ApiError } from '../lib/api';
import { AuthUser } from '../lib/types';

interface AuthContextType {
  user: AuthUser | null;
  /** true trong lúc kiểm tra token đã lưu ở lần tải trang đầu. */
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  /** Cập nhật user + token sau khi đổi mật khẩu. */
  setSession: (token: string, user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { throw new Error('AuthProvider missing'); },
  logout: () => {},
  setSession: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { setLoading(false); return; }
    api.me(token)
      .then(setUser)
      .catch((e: unknown) => {
        // Chỉ bỏ token khi server nói nó không còn hợp lệ; server sập thì giữ lại.
        if (e instanceof ApiError && e.status === 401) localStorage.removeItem(AUTH_TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const setSession = useCallback((token: string, u: AuthUser) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setUser(u);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    setSession(res.token, res.user);
    return res.user;
  }, [setSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
