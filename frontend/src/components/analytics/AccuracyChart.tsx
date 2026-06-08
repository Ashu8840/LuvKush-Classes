"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatDate } from "@/lib/utils";

type DataPoint = { date: string; accuracy: number; wpm?: number };

export function AccuracyChart({ data }: { data: DataPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  if (!chartData.length) {
    return <p className="py-8 text-center text-sm text-muted">No accuracy data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-default" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        />
        <Area
          type="monotone"
          dataKey="accuracy"
          name="Accuracy %"
          stroke="var(--color-success)"
          fill="var(--color-success)"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}