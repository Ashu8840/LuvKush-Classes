"use client";

import { createContext, useContext, useLayoutEffect, useState, ReactNode } from "react";
import { applyThemeVariables, ColorTheme as PaletteColorTheme } from "@/lib/theme-palettes";

export type ColorTheme = "pink" | "green" | "blue" | "orange" | "mono";

type ColorThemeContextType = {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
};

const ColorThemeContext = createContext<ColorThemeContextType | null>(null);

export function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("orange");

  useLayoutEffect(() => {
    const saved = localStorage.getItem("color-theme") as ColorTheme | null;
    const theme = saved || "orange";
    setColorThemeState(theme);
    const isDark =
      document.documentElement.classList.contains("dark") ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyThemeVariables(theme as PaletteColorTheme, isDark);
  }, []);

  const setColorTheme = (theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem("color-theme", theme);
    const isDark = document.documentElement.classList.contains("dark");
    applyThemeVariables(theme as PaletteColorTheme, isDark);
  };

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) throw new Error("useColorTheme must be used within ColorThemeProvider");
  return ctx;
}