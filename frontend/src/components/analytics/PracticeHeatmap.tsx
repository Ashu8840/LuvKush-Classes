"use client";

import { cn } from "@/lib/utils";

type PracticeHeatmapProps = {
  practice: Record<string, number>;
  attendance?: Record<string, string>;
  days?: number;
};

export function PracticeHeatmap({ practice, attendance, days = 90 }: PracticeHeatmapProps) {
  const cells: { date: string; count: number; attendance?: string }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    cells.push({
      date: key,
      count: practice[key] || 0,
      attendance: attendance?.[key],
    });
  }

  const maxCount = Math.max(...cells.map((c) => c.count), 1);

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-primary-light/40";
    const ratio = count / maxCount;
    if (ratio > 0.75) return "bg-primary";
    if (ratio > 0.5) return "bg-primary/70";
    if (ratio > 0.25) return "bg-primary/40";
    return "bg-primary/20";
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {cells.map((cell) => (
          <div
            key={cell.date}
            title={`${cell.date}: ${cell.count} session(s)${cell.attendance ? ` · ${cell.attendance}` : ""}`}
            className={cn(
              "h-3 w-3 rounded-sm transition-colors sm:h-4 sm:w-4",
              getIntensity(cell.count),
              cell.attendance === "absent" && "ring-1 ring-red-400"
            )}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-primary-light/40" />
          <div className="h-3 w-3 rounded-sm bg-primary/20" />
          <div className="h-3 w-3 rounded-sm bg-primary/40" />
          <div className="h-3 w-3 rounded-sm bg-primary/70" />
          <div className="h-3 w-3 rounded-sm bg-primary" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}