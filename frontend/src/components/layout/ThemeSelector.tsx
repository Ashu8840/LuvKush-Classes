"use client";

import { Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useColorTheme, ColorTheme } from "@/contexts/ColorThemeContext";
import { useState } from "react";

const COLOR_THEMES: { id: ColorTheme; label: string; color: string }[] = [
  { id: "pink", label: "Pink", color: "#f9a8d4" },
  { id: "green", label: "Green", color: "#86efac" },
  { id: "blue", label: "Blue", color: "#93c5fd" },
  { id: "orange", label: "Orange", color: "#fdba74" },
  { id: "mono", label: "Black", color: "#18181b" },
];

export function ThemeSelector({ elevated = false }: { elevated?: boolean }) {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();
  const [open, setOpen] = useState(false);

  const overlayZ = elevated ? "z-[200]" : "z-40";
  const menuZ = elevated ? "z-[210]" : "z-50";

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="rounded-xl border border-default p-2.5 text-foreground transition hover:bg-primary-light"
        aria-label="Toggle dark mode"
      >
        <Sun className="h-5 w-5 dark:hidden" />
        <Moon className="hidden h-5 w-5 dark:block" />
      </button>

      <button
        onClick={() => setOpen(!open)}
        className="rounded-xl border border-default p-2.5 text-foreground transition hover:bg-primary-light"
        aria-label="Choose color theme"
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className={`fixed inset-0 ${overlayZ}`} onClick={() => setOpen(false)} />
          <div className={`absolute right-0 top-full ${menuZ} mt-2 w-48 rounded-2xl border border-default bg-card p-3 shadow-xl`}>
            <p className="mb-2 px-1 text-xs font-semibold text-muted">Color Theme</p>
            {COLOR_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setColorTheme(t.id); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-primary-light ${
                  colorTheme === t.id ? "bg-primary-light font-semibold text-accent" : "text-foreground"
                }`}
              >
                <span
                  className="h-5 w-5 rounded-full border border-default"
                  style={{ backgroundColor: t.color }}
                />
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}