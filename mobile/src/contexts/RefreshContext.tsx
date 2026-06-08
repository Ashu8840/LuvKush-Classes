import React, { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "./AuthContext";

type RefreshContextType = {
  refreshKey: number;
  refreshing: boolean;
  refreshApp: () => Promise<void>;
};

const RefreshContext = createContext<RefreshContextType | null>(null);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const { refreshUser } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const refreshApp = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      setRefreshKey((k) => k + 1);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  return (
    <RefreshContext.Provider value={{ refreshKey, refreshing, refreshApp }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useAppRefresh() {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error("useAppRefresh must be used within RefreshProvider");
  return ctx;
}