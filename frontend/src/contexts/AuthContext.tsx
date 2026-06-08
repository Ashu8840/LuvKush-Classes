"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, User, UserRole, getRolePath } from "@/lib/api";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  getDashboardPath: (role?: UserRole) => string;
  refreshUser: () => Promise<User | null>;
  setUserAvatar: (avatar: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .getMe()
      .then((data) => setUser(data.user as User))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const getDashboardPath = (role?: UserRole) => getRolePath(role || user?.role || "student");

  const refreshUser = async () => {
    const data = await api.getMe();
    const nextUser = data.user as User;
    setUser(nextUser);
    return nextUser;
  };

  const setUserAvatar = (avatar: string) => {
    setUser((prev) => (prev ? { ...prev, avatar } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getDashboardPath, refreshUser, setUserAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}