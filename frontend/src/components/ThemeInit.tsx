// Runs before React hydration to prevent theme flash
export function ThemeInit() {
  const script = `
    (function() {
      try {
        var palettes = {
          pink: {
            light: { background:"#ffffff",foreground:"#18181b",muted:"#71717a",card:"#ffffff",cardForeground:"#18181b",border:"#fce7f3",inputBg:"#ffffff",primary:"#f472b6",primaryForeground:"#ffffff",primaryLight:"#fdf2f8",accent:"#ec4899",surface:"#fdf2f8",tableHead:"#fdf2f8",gradientFrom:"#f472b6",gradientTo:"#ec4899",shadow:"0 4px 24px rgba(244, 114, 182, 0.12)",successLight:"#f0fdf4",warningLight:"#fffbeb",dangerLight:"#fef2f2" },
            dark: { background:"#0f0f12",foreground:"#f4f4f5",muted:"#a1a1aa",card:"#27272a",cardForeground:"#f4f4f5",border:"#3f3f46",inputBg:"#27272a",primary:"#f472b6",primaryForeground:"#ffffff",primaryLight:"#500724",accent:"#f9a8d4",surface:"#18181b",tableHead:"#27272a",gradientFrom:"#ec4899",gradientTo:"#db2777",shadow:"0 4px 24px rgba(0, 0, 0, 0.35)",successLight:"#14532d",warningLight:"#451a03",dangerLight:"#450a0a" }
          },
          green: {
            light: { background:"#ffffff",foreground:"#18181b",muted:"#71717a",card:"#ffffff",cardForeground:"#18181b",border:"#dcfce7",inputBg:"#ffffff",primary:"#4ade80",primaryForeground:"#ffffff",primaryLight:"#f0fdf4",accent:"#22c55e",surface:"#f0fdf4",tableHead:"#f0fdf4",gradientFrom:"#4ade80",gradientTo:"#16a34a",shadow:"0 4px 24px rgba(74, 222, 128, 0.1)",successLight:"#f0fdf4",warningLight:"#fffbeb",dangerLight:"#fef2f2" },
            dark: { background:"#0f0f12",foreground:"#f4f4f5",muted:"#a1a1aa",card:"#27272a",cardForeground:"#f4f4f5",border:"#3f3f46",inputBg:"#27272a",primary:"#4ade80",primaryForeground:"#ffffff",primaryLight:"#14532d",accent:"#86efac",surface:"#18181b",tableHead:"#27272a",gradientFrom:"#22c55e",gradientTo:"#15803d",shadow:"0 4px 24px rgba(0, 0, 0, 0.35)",successLight:"#14532d",warningLight:"#451a03",dangerLight:"#450a0a" }
          },
          blue: {
            light: { background:"#ffffff",foreground:"#18181b",muted:"#71717a",card:"#ffffff",cardForeground:"#18181b",border:"#dbeafe",inputBg:"#ffffff",primary:"#60a5fa",primaryForeground:"#ffffff",primaryLight:"#eff6ff",accent:"#3b82f6",surface:"#eff6ff",tableHead:"#eff6ff",gradientFrom:"#60a5fa",gradientTo:"#2563eb",shadow:"0 4px 24px rgba(96, 165, 250, 0.1)",successLight:"#f0fdf4",warningLight:"#fffbeb",dangerLight:"#fef2f2" },
            dark: { background:"#0f0f12",foreground:"#f4f4f5",muted:"#a1a1aa",card:"#27272a",cardForeground:"#f4f4f5",border:"#3f3f46",inputBg:"#27272a",primary:"#60a5fa",primaryForeground:"#ffffff",primaryLight:"#1e3a5f",accent:"#93c5fd",surface:"#18181b",tableHead:"#27272a",gradientFrom:"#3b82f6",gradientTo:"#1d4ed8",shadow:"0 4px 24px rgba(0, 0, 0, 0.35)",successLight:"#14532d",warningLight:"#451a03",dangerLight:"#450a0a" }
          },
          orange: {
            light: { background:"#ffffff",foreground:"#18181b",muted:"#71717a",card:"#ffffff",cardForeground:"#18181b",border:"#ffedd5",inputBg:"#ffffff",primary:"#fb923c",primaryForeground:"#ffffff",primaryLight:"#fff7ed",accent:"#f97316",surface:"#fff7ed",tableHead:"#fff7ed",gradientFrom:"#fb923c",gradientTo:"#ea580c",shadow:"0 4px 24px rgba(251, 146, 60, 0.1)",successLight:"#f0fdf4",warningLight:"#fffbeb",dangerLight:"#fef2f2" },
            dark: { background:"#0f0f12",foreground:"#f4f4f5",muted:"#a1a1aa",card:"#27272a",cardForeground:"#f4f4f5",border:"#3f3f46",inputBg:"#27272a",primary:"#fb923c",primaryForeground:"#ffffff",primaryLight:"#431407",accent:"#fdba74",surface:"#18181b",tableHead:"#27272a",gradientFrom:"#ea580c",gradientTo:"#c2410c",shadow:"0 4px 24px rgba(0, 0, 0, 0.35)",successLight:"#14532d",warningLight:"#451a03",dangerLight:"#450a0a" }
          },
          mono: {
            light: { background:"#ffffff",foreground:"#18181b",muted:"#71717a",card:"#ffffff",cardForeground:"#18181b",border:"#e4e4e7",inputBg:"#ffffff",primary:"#18181b",primaryForeground:"#ffffff",primaryLight:"#f4f4f5",accent:"#3f3f46",surface:"#f4f4f5",tableHead:"#f4f4f5",gradientFrom:"#27272a",gradientTo:"#18181b",shadow:"0 4px 24px rgba(24, 24, 27, 0.08)",successLight:"#f0fdf4",warningLight:"#fffbeb",dangerLight:"#fef2f2" },
            dark: { background:"#09090b",foreground:"#fafafa",muted:"#a1a1aa",card:"#27272a",cardForeground:"#fafafa",border:"#3f3f46",inputBg:"#27272a",primary:"#fafafa",primaryForeground:"#18181b",primaryLight:"#27272a",accent:"#d4d4d8",surface:"#18181b",tableHead:"#27272a",gradientFrom:"#3f3f46",gradientTo:"#18181b",shadow:"0 4px 24px rgba(0, 0, 0, 0.35)",successLight:"#14532d",warningLight:"#451a03",dangerLight:"#450a0a" }
          }
        };
        var colorTheme = localStorage.getItem('color-theme') || 'orange';
        var darkMode = localStorage.getItem('theme');
        var isDark = darkMode === 'dark' || (darkMode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (darkMode === 'dark') document.documentElement.classList.add('dark');
        else if (darkMode === 'light') document.documentElement.classList.remove('dark');
        var p = (palettes[colorTheme] || palettes.orange)[isDark ? 'dark' : 'light'];
        var root = document.documentElement;
        root.setAttribute('data-color-theme', colorTheme);
        var map = {
          '--background': p.background, '--foreground': p.foreground, '--muted': p.muted,
          '--card': p.card, '--card-foreground': p.cardForeground, '--border': p.border,
          '--input-bg': p.inputBg, '--primary': p.primary, '--primary-foreground': p.primaryForeground,
          '--primary-light': p.primaryLight, '--accent': p.accent, '--surface': p.surface,
          '--table-head': p.tableHead, '--gradient-from': p.gradientFrom, '--gradient-to': p.gradientTo,
          '--shadow': p.shadow, '--success-light': p.successLight, '--warning-light': p.warningLight,
          '--danger-light': p.dangerLight
        };
        Object.keys(map).forEach(function(k) { root.style.setProperty(k, map[k]); });
      } catch (e) {
        document.documentElement.setAttribute('data-color-theme', 'orange');
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}