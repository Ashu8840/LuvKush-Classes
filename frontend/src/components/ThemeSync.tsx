"use client";

import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";
import { useColorTheme } from "@/contexts/ColorThemeContext";
import { applyThemeVariables } from "@/lib/theme-palettes";

/** Applies mobile-matched CSS variables whenever color theme or dark mode changes */
export function ThemeSync() {
  const { colorTheme } = useColorTheme();
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    applyThemeVariables(colorTheme, resolvedTheme === "dark");
  }, [colorTheme, resolvedTheme]);

  return null;
}