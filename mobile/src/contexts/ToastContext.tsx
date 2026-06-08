import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./ThemeContext";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let externalShow: ((message: string, type?: ToastType) => void) | null = null;

export const toast = {
  success: (message: string) => externalShow?.(message, "success"),
  error: (message: string) => externalShow?.(message, "error"),
  info: (message: string) => externalShow?.(message, "info"),
};

function ToastBanner({ item, onDone }: { item: ToastItem; onDone: (id: number) => void }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  const palette = {
    success: { bg: "#f0fdf4", border: "#86efac", fg: "#166534" },
    error: { bg: "#fef2f2", border: "#fca5a5", fg: "#b91c1c" },
    info: { bg: colors.primaryLight, border: colors.border, fg: colors.text },
  }[item.type];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 8, duration: 200, useNativeDriver: true }),
      ]).start(() => onDone(item.id));
    }, 2800);

    return () => clearTimeout(timer);
  }, [item.id, onDone, opacity, translateY]);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: palette.bg, borderColor: palette.border, opacity, transform: [{ translateY }] }]}>
      <Text style={[styles.toastText, { color: palette.fg }]}>{item.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, type: ToastType = "info") => {
    idRef.current += 1;
    const id = idRef.current;
    setItems((prev) => [...prev.slice(-2), { id, message, type }]);
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    externalShow = show;
    return () => { externalShow = null; };
  }, [show]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 16 }]}>
        {items.map((item) => (
          <ToastBanner key={item.id} item={item} onDone={remove} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});