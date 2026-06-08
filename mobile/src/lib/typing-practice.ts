export const DURATION_OPTIONS = [
  { label: "30 sec", seconds: 30 },
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "30 min", seconds: 1800 },
] as const;

export function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function computeErrorKeys(target: string, typed: string) {
  const errors: Record<string, number> = {};
  const len = Math.max(target.length, typed.length);
  for (let i = 0; i < len; i++) {
    if (typed[i] !== target[i]) {
      const key = typed[i] ?? "[miss]";
      errors[key] = (errors[key] || 0) + 1;
    }
  }
  return Object.entries(errors)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
}

export function computeWpm(input: string, secondsUsed: number) {
  const words = input.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(secondsUsed, 1) / 60;
  return Math.round(words / minutes);
}

export function computeAccuracy(input: string, text: string) {
  let correct = 0;
  const compareLen = Math.min(input.length, text.length);
  for (let i = 0; i < compareLen; i++) {
    if (input[i] === text[i]) correct++;
  }
  return input.length ? Math.round((correct / input.length) * 100) : 100;
}