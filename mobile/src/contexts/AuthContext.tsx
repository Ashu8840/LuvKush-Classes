import React, { createContext, useContext, useEffect, useState } from "react";
import { api, auth, User, UserRole, getRolePath } from "../lib/api";
import { registerForPushNotifications, unregisterPushNotifications } from "../lib/notifications";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  getDashboardPath: (role?: UserRole) => string;
  refreshUser: () => Promise<User | null>;
  setUserAvatar: (avatar: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.getToken().then((token) => {
      if (!token) {
        setLoading(false);
        return;
      }
      api
        .getMe()
        .then((data) => {
          setUser(data.user);
          registerForPushNotifications().catch(() => {});
        })
        .catch(() => auth.removeToken())
        .finally(() => setLoading(false));
    });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    await auth.saveToken(data.token);
    setUser(data.user);
    registerForPushNotifications().catch(() => {});
    return data.user;
  };

  const logout = async () => {
    await unregisterPushNotifications();
    await auth.removeToken();
    setUser(null);
  };

  const getDashboardPath = (role?: UserRole) => getRolePath(role || user?.role || "student");

  const refreshUser = async () => {
    const data = await api.getMe();
    setUser(data.user);
    return data.user;
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}