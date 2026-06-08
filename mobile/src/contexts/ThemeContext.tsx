import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ColorTheme = "pink" | "green" | "blue" | "orange" | "mono";

export type ThemeColors = {
  primary: string;
  primaryLight: string;
  accent: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  primaryText: string;
};

const THEMES: Record<ColorTheme, { light: ThemeColors; dark: ThemeColors }> = {
  pink: {
    light: { primary: "#f472b6", primaryLight: "#fdf2f8", accent: "#ec4899", background: "#ffffff", surface: "#fdf2f8", card: "#ffffff", text: "#18181b", muted: "#71717a", border: "#fce7f3", primaryText: "#ffffff" },
    dark: { primary: "#f472b6", primaryLight: "#500724", accent: "#f9a8d4", background: "#0f0f12", surface: "#18181b", card: "#27272a", text: "#f4f4f5", muted: "#a1a1aa", border: "#3f3f46", primaryText: "#ffffff" },
  },
  green: {
    light: { primary: "#4ade80", primaryLight: "#f0fdf4", accent: "#22c55e", background: "#ffffff", surface: "#f0fdf4", card: "#ffffff", text: "#18181b", muted: "#71717a", border: "#dcfce7", primaryText: "#ffffff" },
    dark: { primary: "#4ade80", primaryLight: "#14532d", accent: "#86efac", background: "#0f0f12", surface: "#18181b", card: "#27272a", text: "#f4f4f5", muted: "#a1a1aa", border: "#3f3f46", primaryText: "#ffffff" },
  },
  blue: {
    light: { primary: "#60a5fa", primaryLight: "#eff6ff", accent: "#3b82f6", background: "#ffffff", surface: "#eff6ff", card: "#ffffff", text: "#18181b", muted: "#71717a", border: "#dbeafe", primaryText: "#ffffff" },
    dark: { primary: "#60a5fa", primaryLight: "#1e3a5f", accent: "#93c5fd", background: "#0f0f12", surface: "#18181b", card: "#27272a", text: "#f4f4f5", muted: "#a1a1aa", border: "#3f3f46", primaryText: "#ffffff" },
  },
  orange: {
    light: { primary: "#fb923c", primaryLight: "#fff7ed", accent: "#f97316", background: "#ffffff", surface: "#fff7ed", card: "#ffffff", text: "#18181b", muted: "#71717a", border: "#ffedd5", primaryText: "#ffffff" },
    dark: { primary: "#fb923c", primaryLight: "#431407", accent: "#fdba74", background: "#0f0f12", surface: "#18181b", card: "#27272a", text: "#f4f4f5", muted: "#a1a1aa", border: "#3f3f46", primaryText: "#ffffff" },
  },
  mono: {
    light: { primary: "#18181b", primaryLight: "#f4f4f5", accent: "#3f3f46", background: "#ffffff", surface: "#f4f4f5", card: "#ffffff", text: "#18181b", muted: "#71717a", border: "#e4e4e7", primaryText: "#ffffff" },
    dark: { primary: "#fafafa", primaryLight: "#27272a", accent: "#d4d4d8", background: "#09090b", surface: "#18181b", card: "#27272a", text: "#fafafa", muted: "#a1a1aa", border: "#3f3f46", primaryText: "#18181b" },
  },
};

type ThemeContextType = {
  colorTheme: ColorTheme;
  setColorTheme: (t: ColorTheme) => void;
  isDark: boolean;
  toggleDark: () => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("orange");
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  useEffect(() => {
    SecureStore.getItemAsync("color-theme").then((v) => {
      if (v) setColorThemeState(v as ColorTheme);
    });
    SecureStore.getItemAsync("dark-mode").then((v) => {
      if (v !== null) setIsDark(v === "true");
    });
  }, []);

  const setColorTheme = (t: ColorTheme) => {
    setColorThemeState(t);
    SecureStore.setItemAsync("color-theme", t);
  };

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    SecureStore.setItemAsync("dark-mode", String(next));
  };

  const colors = THEMES[colorTheme][isDark ? "dark" : "light"];

  return (
    <ThemeContext.Provider value={{ colorTheme, setColorTheme, isDark, toggleDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}