export type ColorTheme = "pink" | "green" | "blue" | "orange" | "mono";

export type ThemePalette = {
  background: string;
  foreground: string;
  muted: string;
  card: string;
  cardForeground: string;
  border: string;
  inputBg: string;
  primary: string;
  primaryForeground: string;
  primaryLight: string;
  accent: string;
  surface: string;
  tableHead: string;
  gradientFrom: string;
  gradientTo: string;
  shadow: string;
  successLight: string;
  warningLight: string;
  dangerLight: string;
};

const STATUS = {
  success: "#16a34a",
  successLight: "#f0fdf4",
  warning: "#d97706",
  warningLight: "#fffbeb",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
};

const DARK_STATUS = {
  successLight: "#14532d",
  warningLight: "#451a03",
  dangerLight: "#450a0a",
};

/** Palettes mirrored from mobile ThemeContext.tsx */
export const THEME_PALETTES: Record<ColorTheme, { light: ThemePalette; dark: ThemePalette }> = {
  pink: {
    light: {
      background: "#ffffff",
      foreground: "#18181b",
      muted: "#71717a",
      card: "#ffffff",
      cardForeground: "#18181b",
      border: "#fce7f3",
      inputBg: "#ffffff",
      primary: "#f472b6",
      primaryForeground: "#ffffff",
      primaryLight: "#fdf2f8",
      accent: "#ec4899",
      surface: "#fdf2f8",
      tableHead: "#fdf2f8",
      gradientFrom: "#f472b6",
      gradientTo: "#ec4899",
      shadow: "0 4px 24px rgba(244, 114, 182, 0.12)",
      ...STATUS,
    },
    dark: {
      background: "#0f0f12",
      foreground: "#f4f4f5",
      muted: "#a1a1aa",
      card: "#27272a",
      cardForeground: "#f4f4f5",
      border: "#3f3f46",
      inputBg: "#27272a",
      primary: "#f472b6",
      primaryForeground: "#ffffff",
      primaryLight: "#500724",
      accent: "#f9a8d4",
      surface: "#18181b",
      tableHead: "#27272a",
      gradientFrom: "#ec4899",
      gradientTo: "#db2777",
      shadow: "0 4px 24px rgba(0, 0, 0, 0.35)",
      ...STATUS,
      ...DARK_STATUS,
    },
  },
  green: {
    light: {
      background: "#ffffff",
      foreground: "#18181b",
      muted: "#71717a",
      card: "#ffffff",
      cardForeground: "#18181b",
      border: "#dcfce7",
      inputBg: "#ffffff",
      primary: "#4ade80",
      primaryForeground: "#ffffff",
      primaryLight: "#f0fdf4",
      accent: "#22c55e",
      surface: "#f0fdf4",
      tableHead: "#f0fdf4",
      gradientFrom: "#4ade80",
      gradientTo: "#16a34a",
      shadow: "0 4px 24px rgba(74, 222, 128, 0.1)",
      ...STATUS,
    },
    dark: {
      background: "#0f0f12",
      foreground: "#f4f4f5",
      muted: "#a1a1aa",
      card: "#27272a",
      cardForeground: "#f4f4f5",
      border: "#3f3f46",
      inputBg: "#27272a",
      primary: "#4ade80",
      primaryForeground: "#ffffff",
      primaryLight: "#14532d",
      accent: "#86efac",
      surface: "#18181b",
      tableHead: "#27272a",
      gradientFrom: "#22c55e",
      gradientTo: "#15803d",
      shadow: "0 4px 24px rgba(0, 0, 0, 0.35)",
      ...STATUS,
      ...DARK_STATUS,
    },
  },
  blue: {
    light: {
      background: "#ffffff",
      foreground: "#18181b",
      muted: "#71717a",
      card: "#ffffff",
      cardForeground: "#18181b",
      border: "#dbeafe",
      inputBg: "#ffffff",
      primary: "#60a5fa",
      primaryForeground: "#ffffff",
      primaryLight: "#eff6ff",
      accent: "#3b82f6",
      surface: "#eff6ff",
      tableHead: "#eff6ff",
      gradientFrom: "#60a5fa",
      gradientTo: "#2563eb",
      shadow: "0 4px 24px rgba(96, 165, 250, 0.1)",
      ...STATUS,
    },
    dark: {
      background: "#0f0f12",
      foreground: "#f4f4f5",
      muted: "#a1a1aa",
      card: "#27272a",
      cardForeground: "#f4f4f5",
      border: "#3f3f46",
      inputBg: "#27272a",
      primary: "#60a5fa",
      primaryForeground: "#ffffff",
      primaryLight: "#1e3a5f",
      accent: "#93c5fd",
      surface: "#18181b",
      tableHead: "#27272a",
      gradientFrom: "#3b82f6",
      gradientTo: "#1d4ed8",
      shadow: "0 4px 24px rgba(0, 0, 0, 0.35)",
      ...STATUS,
      ...DARK_STATUS,
    },
  },
  orange: {
    light: {
      background: "#ffffff",
      foreground: "#18181b",
      muted: "#71717a",
      card: "#ffffff",
      cardForeground: "#18181b",
      border: "#ffedd5",
      inputBg: "#ffffff",
      primary: "#fb923c",
      primaryForeground: "#ffffff",
      primaryLight: "#fff7ed",
      accent: "#f97316",
      surface: "#fff7ed",
      tableHead: "#fff7ed",
      gradientFrom: "#fb923c",
      gradientTo: "#ea580c",
      shadow: "0 4px 24px rgba(251, 146, 60, 0.1)",
      ...STATUS,
    },
    dark: {
      background: "#0f0f12",
      foreground: "#f4f4f5",
      muted: "#a1a1aa",
      card: "#27272a",
      cardForeground: "#f4f4f5",
      border: "#3f3f46",
      inputBg: "#27272a",
      primary: "#fb923c",
      primaryForeground: "#ffffff",
      primaryLight: "#431407",
      accent: "#fdba74",
      surface: "#18181b",
      tableHead: "#27272a",
      gradientFrom: "#ea580c",
      gradientTo: "#c2410c",
      shadow: "0 4px 24px rgba(0, 0, 0, 0.35)",
      ...STATUS,
      ...DARK_STATUS,
    },
  },
  mono: {
    light: {
      background: "#ffffff",
      foreground: "#18181b",
      muted: "#71717a",
      card: "#ffffff",
      cardForeground: "#18181b",
      border: "#e4e4e7",
      inputBg: "#ffffff",
      primary: "#18181b",
      primaryForeground: "#ffffff",
      primaryLight: "#f4f4f5",
      accent: "#3f3f46",
      surface: "#f4f4f5",
      tableHead: "#f4f4f5",
      gradientFrom: "#27272a",
      gradientTo: "#18181b",
      shadow: "0 4px 24px rgba(24, 24, 27, 0.08)",
      ...STATUS,
    },
    dark: {
      background: "#09090b",
      foreground: "#fafafa",
      muted: "#a1a1aa",
      card: "#27272a",
      cardForeground: "#fafafa",
      border: "#3f3f46",
      inputBg: "#27272a",
      primary: "#fafafa",
      primaryForeground: "#18181b",
      primaryLight: "#27272a",
      accent: "#d4d4d8",
      surface: "#18181b",
      tableHead: "#27272a",
      gradientFrom: "#3f3f46",
      gradientTo: "#18181b",
      shadow: "0 4px 24px rgba(0, 0, 0, 0.35)",
      ...STATUS,
      ...DARK_STATUS,
    },
  },
};

export function applyThemeVariables(colorTheme: ColorTheme, isDark: boolean) {
  const p = THEME_PALETTES[colorTheme][isDark ? "dark" : "light"];
  const root = document.documentElement;

  root.setAttribute("data-color-theme", colorTheme);

  const vars: Record<string, string> = {
    "--background": p.background,
    "--foreground": p.foreground,
    "--muted": p.muted,
    "--card": p.card,
    "--card-foreground": p.cardForeground,
    "--border": p.border,
    "--input-bg": p.inputBg,
    "--primary": p.primary,
    "--primary-foreground": p.primaryForeground,
    "--primary-light": p.primaryLight,
    "--accent": p.accent,
    "--surface": p.surface,
    "--table-head": p.tableHead,
    "--gradient-from": p.gradientFrom,
    "--gradient-to": p.gradientTo,
    "--shadow": p.shadow,
    "--success": STATUS.success,
    "--success-light": p.successLight,
    "--warning": STATUS.warning,
    "--warning-light": p.warningLight,
    "--danger": STATUS.danger,
    "--danger-light": p.dangerLight,
  };

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}